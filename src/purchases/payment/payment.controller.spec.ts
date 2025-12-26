import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as request from 'supertest';

jest.setTimeout(30000);

import { Ingredient } from '../../products/ingredient/ingredient.entity';
import { PurchaseDetail } from '../purchase/purchase-detail.entity';
import { Purchase } from '../purchase/purchase.entity';
import { Supplier } from '../supplier/supplier.entity';
import { PaymentDetail } from './payment-detail.entity';
import { Payment } from './payment.entity';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PurchaseService } from '../purchase/purchase.service';
import { SupplierService } from '../supplier/supplier.service';
import { PaymentMethod } from '../../shared/payment-method/payment-method.entity';
import { PaymentMethodService } from '../../shared/payment-method/payment-method.service';
import { State } from '../../shared/state/state.entity';
import { StateService } from '../../shared/state/state.service';
import { Unit } from '../../shared/unit/unit.entity';
import { UnitService } from '../../shared/unit/unit.service';
import { IngredientService } from '../../products/ingredient/ingredient.service';
import { PaginationService } from '../../utilities/pagination/pagination.service';
import {
  bakery_module_entities,
  products_module_entities,
  purchases_module_entities,
  sales_module_entities,
  shared_module_entities,
} from '../../entities';

describe('PaymentController (integration)', () => {
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

  const seedSupplier = async (businessName = 'Proveedor 1') => {
    return supplierRepository.save(
      supplierRepository.create({
        businessName,
        phone: '111111',
        email: `${businessName.replace(/\s+/g, '').toLowerCase()}@test.com`,
        cuit: null,
        cuil: null,
      })
    );
  };

  const createPurchaseWithTotal = async (args: {
    supplier: Supplier;
    stateName: 'Pendiente' | 'Parcialmente pagado' | 'Pagado';
    ingredient: Ingredient;
    total: number;
  }) => {
    const state = await stateRepository.findOneByOrFail({ name: args.stateName });
    const detail = new PurchaseDetail();
    detail.ingredient = args.ingredient;
    detail.quantity = 1;
    detail.historicalUnitPrice = args.total;

    const purchase = purchaseRepository.create({
      dateTime: new Date(),
      supplier: args.supplier,
      state,
      details: [detail],
    });

    return purchaseRepository.save(purchase);
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
      controllers: [PaymentController],
      providers: [
        PaymentService,
        PurchaseService,
        SupplierService,
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

  describe('DTO validation', () => {
    it('NewPaymentDto: rejects missing required fields', async () => {
      const supplier = await seedSupplier();
      const paymentMethod = await paymentMethodRepository.findOneByOrFail({
        name: 'Cash',
      });

      await request(app.getHttpServer())
        .post('/payments')
        .send({
          supplierId: supplier.id,
          paymentMethodId: paymentMethod.id,
          // paidAmount missing
        })
        .expect(400);
    });

    it('NewPaymentDto: rejects non-positive numbers', async () => {
      const supplier = await seedSupplier();
      const paymentMethod = await paymentMethodRepository.findOneByOrFail({
        name: 'Cash',
      });

      await request(app.getHttpServer())
        .post('/payments')
        .send({
          supplierId: supplier.id,
          paymentMethodId: paymentMethod.id,
          paidAmount: 0,
        })
        .expect(400);

      await request(app.getHttpServer())
        .post('/payments')
        .send({
          supplierId: -1,
          paymentMethodId: paymentMethod.id,
          paidAmount: 10,
        })
        .expect(400);
    });

    it('NewPaymentDto: rejects wrong types', async () => {
      const supplier = await seedSupplier();
      const paymentMethod = await paymentMethodRepository.findOneByOrFail({
        name: 'Cash',
      });

      await request(app.getHttpServer())
        .post('/payments')
        .send({
          supplierId: supplier.id,
          paymentMethodId: paymentMethod.id,
          paidAmount: '10', //Es string, lo que es incorrecto
        })
        .expect(400);
    });

    it('NewPaymentDto: allows omitting optional dateTime', async () => {
      const supplier = await seedSupplier();
      const { ingredient } = await seedUnitAndIngredient();
      const paymentMethod = await paymentMethodRepository.findOneByOrFail({
        name: 'Cash',
      });
      await createPurchaseWithTotal({
        supplier,
        ingredient,
        stateName: 'Pendiente',
        total: 100,
      });

      const res = await request(app.getHttpServer())
        .post('/payments')
        .send({
          supplierId: supplier.id,
          paymentMethodId: paymentMethod.id,
          paidAmount: 50,
          //ommits dateTime
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.details.length).toBe(1);
      expect(Number(res.body.unassignedAmount)).toBe(0);
    });

    it('NewPaymentDto: rejects invalid dateTime type', async () => {
      const supplier = await seedSupplier();
      const paymentMethod = await paymentMethodRepository.findOneByOrFail({
        name: 'Cash',
      });

      await request(app.getHttpServer())
        .post('/payments')
        .send({
          supplierId: supplier.id,
          paymentMethodId: paymentMethod.id,
          paidAmount: 10,
          dateTime: '2025-01-01',
        })
        .expect(400);
    });

    it('ValidationPipe: rejects extra properties', async () => {
      const supplier = await seedSupplier();
      const paymentMethod = await paymentMethodRepository.findOneByOrFail({
        name: 'Cash',
      });

      await request(app.getHttpServer())
        .post('/payments')
        .send({
          supplierId: supplier.id,
          paymentMethodId: paymentMethod.id,
          paidAmount: 10,
          extra: 'nope',
        })
        .expect(400);
    });
  });

  describe('Controller flows', () => {
    it('GET /payments: supports supplier filter', async () => {
      const supplier1 = await seedSupplier('Proveedor A');
      const supplier2 = await seedSupplier('Proveedor B');
      const paymentMethod = await paymentMethodRepository.findOneByOrFail({
        name: 'Cash',
      });
      const { ingredient } = await seedUnitAndIngredient();

      await createPurchaseWithTotal({
        supplier: supplier1,
        ingredient,
        stateName: 'Pendiente',
        total: 10,
      });
      await createPurchaseWithTotal({
        supplier: supplier2,
        ingredient,
        stateName: 'Pendiente',
        total: 10,
      });

      // create payments via API
      await request(app.getHttpServer())
        .post('/payments')
        .send({ supplierId: supplier1.id, paymentMethodId: paymentMethod.id, paidAmount: 10 })
        .expect(201);
      await request(app.getHttpServer())
        .post('/payments')
        .send({ supplierId: supplier2.id, paymentMethodId: paymentMethod.id, paidAmount: 10 })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get('/payments')
        .query({ page: 1, quantity: 50, filterType: 'supplier', filterObjectId: String(supplier1.id) })
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].supplier.id).toBe(supplier1.id);
    });

    it('GET /payments: supports paymentMethod filter', async () => {
      const supplier = await seedSupplier('Proveedor A');
      const cash = await paymentMethodRepository.findOneByOrFail({ name: 'Cash' });
      const card = await seedPaymentMethod('Card');
      const { ingredient } = await seedUnitAndIngredient();

      await createPurchaseWithTotal({
        supplier,
        ingredient,
        stateName: 'Pendiente',
        total: 10,
      });
      await createPurchaseWithTotal({
        supplier,
        ingredient,
        stateName: 'Pendiente',
        total: 10,
      });

      await request(app.getHttpServer())
        .post('/payments')
        .send({ supplierId: supplier.id, paymentMethodId: cash.id, paidAmount: 10 })
        .expect(201);
      await request(app.getHttpServer())
        .post('/payments')
        .send({ supplierId: supplier.id, paymentMethodId: card.id, paidAmount: 10 })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get('/payments')
        .query({
          page: 1,
          quantity: 50,
          filterType: 'paymentMethod',
          filterObjectId: String(card.id),
        })
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].paymentMethod.id).toBe(card.id);
    });

    it('GET /payments: rejects invalid filterType', async () => {
      await request(app.getHttpServer())
        .get('/payments')
        .query({ page: 1, quantity: 10, filterType: 'nope', filterObjectId: '1' })
        .expect(400);
    });

    it('GET /payments: returns all payments when no filters are provided', async () => {
      const supplier1 = await seedSupplier('Proveedor A');
      const supplier2 = await seedSupplier('Proveedor B');
      const paymentMethod = await paymentMethodRepository.findOneByOrFail({ name: 'Cash' });
      const { ingredient } = await seedUnitAndIngredient();

      await createPurchaseWithTotal({ supplier: supplier1, ingredient, stateName: 'Pendiente', total: 10 });
      await createPurchaseWithTotal({ supplier: supplier2, ingredient, stateName: 'Pendiente', total: 10 });

      await request(app.getHttpServer())
        .post('/payments')
        .send({ supplierId: supplier1.id, paymentMethodId: paymentMethod.id, paidAmount: 10 })
        .expect(201);

      await request(app.getHttpServer())
        .post('/payments')
        .send({ supplierId: supplier2.id, paymentMethodId: paymentMethod.id, paidAmount: 10 })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get('/payments')
        .query({ page: 1, quantity: 50 }) // sin filterType / filterObjectId
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
    });

    //AGREGA UNA PRUEBA PARA LA OPCION SIN FILTROS

    it('POST /payments: creates one detail when paidAmount covers part of first unpaid purchase', async () => {
      const supplier = await seedSupplier();
      const paymentMethod = await paymentMethodRepository.findOneByOrFail({
        name: 'Cash',
      });
      const { ingredient } = await seedUnitAndIngredient();

      const purchase = await createPurchaseWithTotal({
        supplier,
        ingredient,
        stateName: 'Pendiente',
        total: 100,
      });

      const res = await request(app.getHttpServer())
        .post('/payments')
        .send({ supplierId: supplier.id, paymentMethodId: paymentMethod.id, paidAmount: 80 })
        .expect(201);

      expect(res.body.details.length).toBe(1);
      expect(Number(res.body.details[0].amount)).toBe(80);
      expect(Number(res.body.unassignedAmount)).toBe(0);

      const updated = await purchaseRepository.findOne({
        where: { id: purchase.id },
        relations: ['state', 'paymentDetails'],
      });
      expect(updated?.state.name).toBe('Parcialmente pagado');
    });

    it('POST /payments: creates multiple details and leaves unassignedAmount when paidAmount exceeds owed', async () => {
      const supplier = await seedSupplier();
      const paymentMethod = await paymentMethodRepository.findOneByOrFail({
        name: 'Cash',
      });
      const { ingredient } = await seedUnitAndIngredient();

      const purchase1 = await createPurchaseWithTotal({
        supplier,
        ingredient,
        stateName: 'Pendiente',
        total: 50,
      });
      const purchase2 = await createPurchaseWithTotal({
        supplier,
        ingredient,
        stateName: 'Pendiente',
        total: 60,
      });

      const res = await request(app.getHttpServer())
        .post('/payments')
        .send({ supplierId: supplier.id, paymentMethodId: paymentMethod.id, paidAmount: 200 })
        .expect(201);

      const paidTotal = res.body.details.reduce(
        (acc: number, d: any) => acc + Number(d.amount),
        0
      );
      expect(paidTotal).toBe(110);
      expect(Number(res.body.unassignedAmount)).toBe(90);

      const [u1, u2] = await Promise.all([
        purchaseRepository.findOne({ where: { id: purchase1.id }, relations: ['state'] }),
        purchaseRepository.findOne({ where: { id: purchase2.id }, relations: ['state'] }),
      ]);
      expect(u1?.state.name).toBe('Pagado');
      expect(u2?.state.name).toBe('Pagado');
    });

    it('POST /payments: only uses Pending and Partially Payed purchases', async () => {
      const supplier = await seedSupplier();
      const paymentMethod = await paymentMethodRepository.findOneByOrFail({
        name: 'Cash',
      });
      const { ingredient } = await seedUnitAndIngredient();

      const pendingPurchase = await createPurchaseWithTotal({
        supplier,
        ingredient,
        stateName: 'Pendiente',
        total: 10,
      });
      const partiallyPayedPurchase = await createPurchaseWithTotal({
        supplier,
        ingredient,
        stateName: 'Parcialmente pagado',
        total: 10,
      });
      const alreadyPayedPurchase = await createPurchaseWithTotal({
        supplier,
        ingredient,
        stateName: 'Pagado',
        total: 10,
      });

      const res = await request(app.getHttpServer())
        .post('/payments')
        .send({ supplierId: supplier.id, paymentMethodId: paymentMethod.id, paidAmount: 25 })
        .expect(201);

      expect(res.body.details).toHaveLength(2);
      const purchaseIdsFromDetails = res.body.details
        .map((d: any) => d.purchase?.id)
        .filter(Boolean)
        .sort((a: number, b: number) => a - b);
      expect(purchaseIdsFromDetails).toEqual(
        [pendingPurchase.id, partiallyPayedPurchase.id].sort((a, b) => a - b)
      );
      expect(Number(res.body.unassignedAmount)).toBe(5);

      const payedAfter = await purchaseRepository.findOne({
        where: { id: alreadyPayedPurchase.id },
        relations: ['paymentDetails', 'state'],
      });
      expect(payedAfter?.state.name).toBe('Pagado');
      expect(payedAfter?.paymentDetails?.length ?? 0).toBe(0);
    });

    it('DELETE /payments/:id: removes payment', async () => {
      const supplier = await seedSupplier();
      const paymentMethod = await paymentMethodRepository.findOneByOrFail({ name: 'Cash' });
      const { ingredient } = await seedUnitAndIngredient();
      await createPurchaseWithTotal({ supplier, ingredient, stateName: 'Pendiente', total: 10 });

      const created = await request(app.getHttpServer())
        .post('/payments')
        .send({ supplierId: supplier.id, paymentMethodId: paymentMethod.id, paidAmount: 10 })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/payments/${created.body.id}`)
        .expect(200);

      const exists = await paymentRepository.findOne({ where: { id: created.body.id } });
      expect(exists).toBeNull();
    });

    
    it('DELETE /payments/:id & POST /payments: updates related purchase state', async () => {
      const supplier = await seedSupplier();
      const paymentMethod = await paymentMethodRepository.findOneByOrFail({ name: 'Cash' });
      const { ingredient } = await seedUnitAndIngredient();
      const purchase = await createPurchaseWithTotal({
        supplier,
        ingredient,
        stateName: 'Pendiente',
        total: 10,
      });

      const created = await request(app.getHttpServer())
        .post('/payments')
        .send({ supplierId: supplier.id, paymentMethodId: paymentMethod.id, paidAmount: 10 })
        .expect(201);

      const paidPurchase = await purchaseRepository.findOne({
        where: { id: purchase.id },
        relations: ['state'],
      });
      expect(paidPurchase?.state.name).toBe('Pagado');

      await request(app.getHttpServer())
        .delete(`/payments/${created.body.id}`)
        .expect(200);

      // Esperamos que el servicio haga la actualización de estados dentro de la misma transacción del delete.
      const updated = await purchaseRepository.findOne({
        where: { id: purchase.id },
        relations: ['state'],
      });
      expect(updated?.state.name).toBe('Pendiente');
    });
  });
});
