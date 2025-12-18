import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as request from 'supertest';

jest.setTimeout(30000);

import {
  bakery_module_entities,
  products_module_entities,
  purchases_module_entities,
  sales_module_entities,
  shared_module_entities,
} from '../../entities';

import { SupplierController } from './supplier.controller';
import { SupplierService } from './supplier.service';
import { PurchaseService } from '../purchase/purchase.service';
import { PaymentService } from '../payment/payment.service';
import { PaymentMethodService } from '../../shared/payment-method/payment-method.service';
import { StateService } from '../../shared/state/state.service';
import { UnitService } from '../../shared/unit/unit.service';
import { IngredientService } from '../../products/ingredient/ingredient.service';
import { PaginationService } from '../../utilities/pagination/pagination.service';

import { Supplier } from './supplier.entity';
import { PurchaseDetail } from '../purchase/purchase-detail.entity';
import { Purchase } from '../purchase/purchase.entity';
import { PaymentMethod } from '../../shared/payment-method/payment-method.entity';
import { State } from '../../shared/state/state.entity';
import { Unit } from '../../shared/unit/unit.entity';
import { Ingredient } from '../../products/ingredient/ingredient.entity';
import { Payment } from '../payment/payment.entity';
import { PaymentDetail } from '../payment/payment-detail.entity';

describe('SupplierController (integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const testEntities = [
    // Incluimos todas las entidades que aparecen por relaciones (aunque no usemos sus controllers).
    // Ej: PaymentMethod -> PaymentCollection -> Sale -> Branch, etc.
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

  let supplierSeq = 0;

  const seedStates = async () => {
    // Estados mínimos usados por Purchases/Payments (para balance y para evitar fallos en servicios).
    await stateRepository.save([
      stateRepository.create({ scope: 'purchases', name: 'Pending' }),
      stateRepository.create({ scope: 'purchases', name: 'Partially Payed' }),
      stateRepository.create({ scope: 'purchases', name: 'Payed' }),
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

  const createSupplier = async (overrides?: Partial<Supplier>) => {
    supplierSeq += 1;

    const dto = {
      // Con supplierSeq evitamos conflictos de unique key (businessName/email/cuit/cuil)
      // cuando un mismo spec crea múltiples proveedores.
      businessName: `Proveedor ${supplierSeq}`,
      phone: '111111',
      email: `proveedor${supplierSeq}@test.com`,
      cuit: `cuit-${supplierSeq}`,
      cuil: null,
      ...overrides,
    };

    const res = await request(app.getHttpServer())
      .post('/suppliers')
      .send(dto)
      .expect(201);

    return res.body;
  };

  const createPurchaseWithTotal = async (args: {
    supplier: Supplier;
    ingredient: Ingredient;
    total: number;
  }) => {
    const pending = await stateRepository.findOneByOrFail({
      scope: 'purchases',
      name: 'Pending',
    });

    const detail = new PurchaseDetail();
    detail.ingredient = args.ingredient;
    detail.quantity = 1;
    detail.historicalUnitPrice = args.total;

    const purchase = purchaseRepository.create({
      dateTime: new Date(),
      supplier: args.supplier,
      state: pending,
      details: [detail],
    });

    return purchaseRepository.save(purchase);
  };

  const createPaymentForPurchase = async (args: {
    supplier: Supplier;
    purchase: Purchase;
    amount: number;
    paymentMethod: PaymentMethod;
  }) => {
    const payment = paymentRepository.create({
      supplier: args.supplier,
      paymentMethod: args.paymentMethod,
      dateTime: new Date(),
      unassignedAmount: 0,
      details: [
        {
          amount: args.amount,
          purchase: args.purchase,
        } as Partial<PaymentDetail>,
      ],
    });

    return paymentRepository.save(payment);
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
      controllers: [SupplierController],
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
    paymentMethodRepository = dataSource.getRepository(PaymentMethod);
    stateRepository = dataSource.getRepository(State);
    unitRepository = dataSource.getRepository(Unit);
    ingredientRepository = dataSource.getRepository(Ingredient);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Reseteamos el schema en cada test para que las constraints de unique no contaminen otros casos.
    await dataSource.synchronize(true);
    supplierSeq = 0;
    await seedStates();
    await seedPaymentMethod();
  });

  describe('DTO validation', () => {
    it('NewSupplierDto: rejects missing required fields', async () => {
      await request(app.getHttpServer()).post('/suppliers').send({}).expect(400);
    });

    it('NewSupplierDto: rejects invalid email', async () => {
      await request(app.getHttpServer())
        .post('/suppliers')
        .send({
          businessName: 'Proveedor 1',
          phone: '111111',
          email: 'not-an-email',
          cuit: 'cuit-1',
          // Le doy CUIT para no mezclar esta prueba con el validador HasOneOf(cuit,cuil).
          cuil: null,
        })
        .expect(400);
    });

    it('ValidationPipe: rejects extra properties', async () => {
      await request(app.getHttpServer())
        .post('/suppliers')
        .send({
          businessName: 'Proveedor 1',
          phone: '111111',
          email: 'proveedor1@test.com',
          cuit: 'cuit-1',
          cuil: null,
          extra: 'nope',
        })
        .expect(400);
    });

    it('NewSupplierDto: enforces HasOneOf(cuit,cuil)', async () => {
      // Caso: ambos null => debe rechazar.
      await request(app.getHttpServer())
        .post('/suppliers')
        .send({
          businessName: 'Proveedor 1',
          phone: '111111',
          email: 'proveedor1@test.com',
          cuit: null,
          cuil: null,
        })
        .expect(400);
    });
  });

  describe('Controller flows', () => {
    it('POST /suppliers: creates supplier with balance 0', async () => {
      const created = await createSupplier({
        businessName: 'Proveedor A',
        email: 'proveedora@test.com',
      });
      expect(created).toHaveProperty('id');
      expect(Number(created.balance)).toBe(0);
    });

    it('GET /suppliers: returns all suppliers (no sorting)', async () => {
      // Esta ruta usa el path de "sin sort" (sort vacío) y debería ordenar por businessName.
      await createSupplier({ businessName: 'Proveedor A', email: 'a@test.com' });
      await createSupplier({ businessName: 'Proveedor B', email: 'b@test.com' });
      await createSupplier({ businessName: 'Proveedor C', email: 'c@test.com' });

      const res = await request(app.getHttpServer())
        .get('/suppliers')
        .query({ page: 1, quantity: 50, order: 'asc' })
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(3);
      expect(res.body.data[0]).toHaveProperty('balance');

      // evalúa orden
      const names = res.body.data.map((s: any) => s.businessName);
      expect(names).toEqual(['Proveedor A', 'Proveedor B', 'Proveedor C']);

      // evalúa paginación
      const page1 = await request(app.getHttpServer())
        .get('/suppliers')
        .query({ page: 1, quantity: 1, order: 'asc' })
        .expect(200);
      expect(page1.body.data).toHaveLength(1);
      expect(page1.body.data[0].businessName).toBe('Proveedor A');

      const page2 = await request(app.getHttpServer())
        .get('/suppliers')
        .query({ page: 2, quantity: 1, order: 'asc' })
        .expect(200);
      expect(page2.body.data).toHaveLength(1);
      expect(page2.body.data[0].businessName).toBe('Proveedor B');
    });

    it('GET /suppliers: supports sorting by balance', async () => {
      const { ingredient } = await seedUnitAndIngredient();
      const paymentMethod = await paymentMethodRepository.findOneByOrFail({
        name: 'Cash',
      });

      const supplierAEntity = await supplierRepository.save(
        supplierRepository.create({
          businessName: 'Proveedor A',
          phone: '111111',
          email: 'a@test.com',
          cuit: 'cuit-a',
          cuil: null,
        })
      );
      const supplierBEntity = await supplierRepository.save(
        supplierRepository.create({
          businessName: 'Proveedor B',
          phone: '111111',
          email: 'b@test.com',
          cuit: null,
          cuil: 'cuil-b',
        })
      );

      const purchaseB = await createPurchaseWithTotal({
        supplier: supplierBEntity,
        ingredient,
        total: 100,
      });
      await createPaymentForPurchase({
        supplier: supplierBEntity,
        purchase: purchaseB,
        amount: 20,
        paymentMethod,
      });

      await createPurchaseWithTotal({
        supplier: supplierAEntity,
        ingredient,
        total: 50,
      });

      const res = await request(app.getHttpServer())
        .get('/suppliers')
        .query({ page: 1, quantity: 50, sort: 'balance', order: 'desc' })
        .expect(200);

      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0].businessName).toBe('Proveedor B');
      expect(Number(res.body.data[0].balance)).toBe(80);
      expect(res.body.data[1].businessName).toBe('Proveedor A');
      expect(Number(res.body.data[1].balance)).toBe(50);
    });

    it('PUT /suppliers/:id: updates supplier', async () => {
      const created = await createSupplier({
        businessName: 'Proveedor A',
        email: 'a@test.com',
      });

      const res = await request(app.getHttpServer())
        .put(`/suppliers/${created.id}`)
        .send({
          businessName: 'Proveedor A2',
          phone: '222222',
          email: 'a2@test.com',
          cuit: 'cuit-updated',
          cuil: null,
        })
        .expect(200);

      expect(res.body.businessName).toBe('Proveedor A2');
      expect(res.body.phone).toBe('222222');
      expect(res.body.email).toBe('a2@test.com');
    });

    it('DELETE /suppliers/:id: deletes supplier when no relations exist', async () => {
      const created = await createSupplier({
        businessName: 'Proveedor A',
        email: 'a@test.com',
      });

      await request(app.getHttpServer())
        .delete(`/suppliers/${created.id}`)
        .expect(200);

      const exists = await supplierRepository.findOne({ where: { id: created.id } });
      expect(exists).toBeNull();
    });

    it('DELETE /suppliers/:id: rejects deletion when supplier has purchases', async () => {
      const { ingredient } = await seedUnitAndIngredient();
      const supplierEntity = await supplierRepository.save(
        supplierRepository.create({
          businessName: 'Proveedor A',
          phone: '111111',
          email: 'a@test.com',
          cuit: 'cuit-a',
          cuil: null,
        })
      );

      await createPurchaseWithTotal({ supplier: supplierEntity, ingredient, total: 10 });

      await request(app.getHttpServer())
        .delete(`/suppliers/${supplierEntity.id}`)
        .expect(400);
    });
  });
});
