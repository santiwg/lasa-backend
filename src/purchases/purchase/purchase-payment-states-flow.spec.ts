import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as request from 'supertest';

//Este test simula un flujo de registro de compras y pagos que contempla muchos escenarios distintos
//desde el uso de un sobrante previo hasta compras que cubren solo una parte del total de una compra y otras que cubren dos compras enteras
//se encuentra mejor documentado en el 

jest.setTimeout(120000);

import {
  bakery_module_entities,
  products_module_entities,
  purchases_module_entities,
  sales_module_entities,
  shared_module_entities,
} from '../../entities';

import { SupplierController } from '../supplier/supplier.controller';
import { SupplierService } from '../supplier/supplier.service';

import { PurchaseController } from './purchase.controller';
import { PurchaseService } from './purchase.service';

import { PaymentController } from '../payment/payment.controller';
import { PaymentService } from '../payment/payment.service';

import { PaymentMethodService } from '../../shared/payment-method/payment-method.service';
import { StateService } from '../../shared/state/state.service';
import { UnitService } from '../../shared/unit/unit.service';
import { IngredientService } from '../../products/ingredient/ingredient.service';
import { PaginationService } from '../../utilities/pagination/pagination.service';

import { Supplier } from '../supplier/supplier.entity';
import { Purchase } from './purchase.entity';
import { Payment } from '../payment/payment.entity';
import { PaymentDetail } from '../payment/payment-detail.entity';
import { PaymentMethod } from '../../shared/payment-method/payment-method.entity';
import { State } from '../../shared/state/state.entity';
import { Unit } from '../../shared/unit/unit.entity';
import { Ingredient } from '../../products/ingredient/ingredient.entity';

describe('Purchases/Payments/States flow (integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const testEntities = [
    ...bakery_module_entities,
    ...products_module_entities,
    ...purchases_module_entities,
    ...sales_module_entities,
    ...shared_module_entities,
  ];

  let supplierRepository: Repository<Supplier>;
  let purchaseRepository: Repository<Purchase>;
  let paymentRepository: Repository<Payment>;
  let paymentDetailRepository: Repository<PaymentDetail>;
  let paymentMethodRepository: Repository<PaymentMethod>;
  let stateRepository: Repository<State>;
  let unitRepository: Repository<Unit>;
  let ingredientRepository: Repository<Ingredient>;

  const seedStates = async () => {
    await stateRepository.save([
      stateRepository.create({ scope: 'Compra', name: 'Pendiente' }),
      stateRepository.create({ scope: 'Compra', name: 'Parcialmente pagado' }),
      stateRepository.create({ scope: 'Compra', name: 'Pagado' }),
    ]);
  };

  const seedPaymentMethod = async (name = 'Cash') => {
    return paymentMethodRepository.save(
      paymentMethodRepository.create({ name, description: null })
    );
  };

  const seedUnitAndIngredient = async () => {
    const unit = await unitRepository.save(
      unitRepository.create({ name: 'kg', description: null, scope: 'products' })
    );
    const ingredient = await ingredientRepository.save(
      ingredientRepository.create({
        name: 'Flour',
        unitPrice: 10,
        currentStock: 0,
        unit,
      })
    );
    return { unit, ingredient };
  };

  const fetchPurchase = async (id: number) => {
    return purchaseRepository.findOneOrFail({
      where: { id },
      relations: ['state', 'details', 'paymentDetails', 'paymentDetails.payment'],
    });
  };

  const getSupplierBalancePayable = async (supplierId: number) => {
    const res = await request(app.getHttpServer())
      .get('/suppliers/with-balance')
      .query({ page: 1, quantity: 50, order: 'asc' })
      .expect(200);

    const row = (res.body.data as any[]).find((s) => s.id === supplierId);
    if (!row) {
      throw new Error(`Supplier ${supplierId} not found in /suppliers/with-balance response`);
    }
    return Number(row.balancePayable);
  };

  const expectPurchaseState = async (purchaseId: number, expectedName: string) => {
    const p = await fetchPurchase(purchaseId);
    expect(p.state?.name).toBe(expectedName);
    return p;
  };

  const findPaymentDetailAmount = async (paymentId: number, purchaseId: number) => {
    const details = await paymentDetailRepository.find({
      where: { payment: { id: paymentId }, purchase: { id: purchaseId } },
      relations: ['payment', 'purchase'],
    });

    const sum = details.reduce((acc, d) => acc + Number(d.amount), 0);
    return sum;
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: '.env.test', isGlobal: true }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            type: 'postgres',
            url: configService.get<string>('TEST_DATABASE_URL'),
            entities: testEntities,
            synchronize: true,
            logging: false,
          }),
        }),
        TypeOrmModule.forFeature(testEntities),
      ],
      controllers: [SupplierController, PurchaseController, PaymentController],
      providers: [
        SupplierService,
        PurchaseService,
        PaymentService,
        PaymentMethodService,
        StateService,
        UnitService,
        IngredientService,
        PaginationService,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      })
    );
    await app.init();

    dataSource = moduleRef.get(DataSource);
    supplierRepository = dataSource.getRepository(Supplier);
    purchaseRepository = dataSource.getRepository(Purchase);
    paymentRepository = dataSource.getRepository(Payment);
    paymentDetailRepository = dataSource.getRepository(PaymentDetail);
    paymentMethodRepository = dataSource.getRepository(PaymentMethod);
    stateRepository = dataSource.getRepository(State);
    unitRepository = dataSource.getRepository(Unit);
    ingredientRepository = dataSource.getRepository(Ingredient);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await dataSource.synchronize(true);
    await seedStates();
    await seedPaymentMethod();
  });

  it('runs full flow A–J with expected states and balances', async () => {
    const { ingredient } = await seedUnitAndIngredient();
    const cash = await paymentMethodRepository.findOneByOrFail({ name: 'Cash' });

    // 1) create supplier
    const supplierRes = await request(app.getHttpServer())
      .post('/suppliers')
      .send({
        businessName: 'Proveedor Flow',
        phone: '111111',
        email: 'proveedorflow@test.com',
        cuit: 'cuit-flow',
        cuil: null,
      })
      .expect(201);

    const supplierId = supplierRes.body.id as number;
    expect(supplierId).toBeTruthy();
    expect(Number(supplierRes.body.balancePayable)).toBe(0);

    const createPurchase = async (args: {
      total: number;
      paidAmount?: number;
    }) => {
      const body: any = {
        supplierId,
        details: [
          {
            ingredientId: ingredient.id,
            quantity: 1,
            historicalUnitPrice: args.total,
          },
        ],
      };
      if (typeof args.paidAmount === 'number') {
        body.paidAmount = args.paidAmount;
        body.paymentMethodId = cash.id;
      }

      const res = await request(app.getHttpServer())
        .post('/purchases')
        .send(body)
        .expect(201);

      return res.body.id as number;
    };

    const createPayment = async (paidAmount: number) => {
      const res = await request(app.getHttpServer())
        .post('/payments')
        .send({ supplierId, paymentMethodId: cash.id, paidAmount })
        .expect(201);
      return res.body.id as number;
    };

    const countPayments = async () =>
      paymentRepository.count({ where: { supplier: { id: supplierId } } });

    // 2) A, B, C
    const purchaseA = await createPurchase({ total: 1000 });
    await expectPurchaseState(purchaseA, 'Pendiente');
    expect(await countPayments()).toBe(0);

    const purchaseB = await createPurchase({ total: 1100, paidAmount: 500 });
    await expectPurchaseState(purchaseB, 'Parcialmente pagado');
    expect(await countPayments()).toBe(1);

    const purchaseC = await createPurchase({ total: 1200, paidAmount: 1200 });
    await expectPurchaseState(purchaseC, 'Pagado');
    expect(await countPayments()).toBe(2);

    // B y C no cambian A
    await expectPurchaseState(purchaseA, 'Pendiente');

    // saldo = compras - pagos = 1600
    expect(await getSupplierBalancePayable(supplierId)).toBe(1600);

    // 3) D, E, F
    const paymentsSeen = new Set<number>(
      (await paymentRepository.find({
        where: { supplier: { id: supplierId } },
        select: { id: true },
      }))
        .map((p) => p.id)
    );

    const getNewPaymentId = async () => {
      const all = await paymentRepository.find({
        where: { supplier: { id: supplierId } },
        order: { id: 'ASC' },
        select: { id: true },
      });
      const newOne = all.map((p) => p.id).find((id) => !paymentsSeen.has(id));
      if (!newOne) {
        throw new Error('Expected a new payment to be created but none found');
      }
      paymentsSeen.add(newOne);
      return newOne;
    };

    const purchaseD = await createPurchase({ total: 1300, paidAmount: 1500 });
    await expectPurchaseState(purchaseD, 'Pagado');

    // A should become partially paid by 200
    await expectPurchaseState(purchaseA, 'Parcialmente pagado');

    const paymentD = await getNewPaymentId();
    const paymentDEntity = await paymentRepository.findOneOrFail({ where: { id: paymentD } });
    expect(Number(paymentDEntity.unassignedAmount)).toBe(0);
    expect(await findPaymentDetailAmount(paymentD, purchaseD)).toBe(1300);
    expect(await findPaymentDetailAmount(paymentD, purchaseA)).toBe(200);

    const purchaseE = await createPurchase({ total: 1400, paidAmount: 2800 });
    await expectPurchaseState(purchaseE, 'Pagado');
    await expectPurchaseState(purchaseA, 'Pagado');
    await expectPurchaseState(purchaseB, 'Pagado');

    const paymentE = await getNewPaymentId();
    const paymentEEntity = await paymentRepository.findOneOrFail({ where: { id: paymentE } });
    expect(Number(paymentEEntity.unassignedAmount)).toBe(0);
    expect(await findPaymentDetailAmount(paymentE, purchaseE)).toBe(1400);
    expect(await findPaymentDetailAmount(paymentE, purchaseA)).toBe(800);
    expect(await findPaymentDetailAmount(paymentE, purchaseB)).toBe(600);

    const purchaseF = await createPurchase({ total: 1500, paidAmount: 1600 });
    await expectPurchaseState(purchaseF, 'Pagado');

    const paymentF = await getNewPaymentId();
    let paymentFEntity = await paymentRepository.findOneOrFail({ where: { id: paymentF } });
    expect(Number(paymentFEntity.unassignedAmount)).toBe(100);
    expect(await findPaymentDetailAmount(paymentF, purchaseF)).toBe(1500);

    // saldo = -100
    expect(await getSupplierBalancePayable(supplierId)).toBe(-100);

    // 4) G, H, I
    const purchaseG = await createPurchase({ total: 1600 });
    await expectPurchaseState(purchaseG, 'Parcialmente pagado');

    // paymentF unassigned consumed into a new detail for G
    paymentFEntity = await paymentRepository.findOneOrFail({ where: { id: paymentF } });
    expect(Number(paymentFEntity.unassignedAmount)).toBe(0);
    expect(await findPaymentDetailAmount(paymentF, purchaseG)).toBe(100);

    const purchaseH = await createPurchase({ total: 1700 });
    const purchaseI = await createPurchase({ total: 1800 });
    await expectPurchaseState(purchaseH, 'Pendiente');
    await expectPurchaseState(purchaseI, 'Pendiente');

    // saldo = 5000
    expect(await getSupplierBalancePayable(supplierId)).toBe(5000);

    // 5) Payments
    const pay1 = await createPayment(1500);
    await expectPurchaseState(purchaseG, 'Pagado');
    await expectPurchaseState(purchaseH, 'Pendiente');
    await expectPurchaseState(purchaseI, 'Pendiente');

    const pay1Entity = await paymentRepository.findOneOrFail({ where: { id: pay1 } });
    expect(Number(pay1Entity.unassignedAmount)).toBe(0);
    expect(await findPaymentDetailAmount(pay1, purchaseG)).toBe(1500);

    const pay2 = await createPayment(700);
    await expectPurchaseState(purchaseH, 'Parcialmente pagado');

    const pay2Entity = await paymentRepository.findOneOrFail({ where: { id: pay2 } });
    expect(Number(pay2Entity.unassignedAmount)).toBe(0);
    expect(await findPaymentDetailAmount(pay2, purchaseH)).toBe(700);

    const pay3 = await createPayment(1800);
    await expectPurchaseState(purchaseH, 'Pagado');
    await expectPurchaseState(purchaseI, 'Parcialmente pagado');

    const pay3Entity = await paymentRepository.findOneOrFail({ where: { id: pay3 } });
    expect(Number(pay3Entity.unassignedAmount)).toBe(0);
    expect(await findPaymentDetailAmount(pay3, purchaseH)).toBe(1000);
    expect(await findPaymentDetailAmount(pay3, purchaseI)).toBe(800);

    const pay4 = await createPayment(1500);
    await expectPurchaseState(purchaseI, 'Pagado');

    let pay4Entity = await paymentRepository.findOneOrFail({ where: { id: pay4 } });
    expect(Number(pay4Entity.unassignedAmount)).toBe(500);
    expect(await findPaymentDetailAmount(pay4, purchaseI)).toBe(1000);

    // saldo = -500
    expect(await getSupplierBalancePayable(supplierId)).toBe(-500);

    // 6) Purchase J (total 1000, paid 500) consumes previous unassigned 500
    const purchaseJ = await createPurchase({ total: 1000, paidAmount: 500 });
    await expectPurchaseState(purchaseJ, 'Pagado');

    pay4Entity = await paymentRepository.findOneOrFail({ where: { id: pay4 } });
    expect(Number(pay4Entity.unassignedAmount)).toBe(0);
    expect(await findPaymentDetailAmount(pay4, purchaseJ)).toBe(500);

    // final saldo = 0
    expect(await getSupplierBalancePayable(supplierId)).toBe(0);

    // sanity: total payments created
    expect(await countPayments()).toBe(10);
  });
});
