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

import { PurchaseController } from './purchase.controller';
import { PurchaseService } from './purchase.service';
import { SupplierService } from '../supplier/supplier.service';
import { PaymentService } from '../payment/payment.service';
import { PaymentMethodService } from '../../shared/payment-method/payment-method.service';
import { StateService } from '../../shared/state/state.service';
import { UnitService } from '../../shared/unit/unit.service';
import { IngredientService } from '../../products/ingredient/ingredient.service';
import { PaginationService } from '../../utilities/pagination/pagination.service';

import { Supplier } from '../supplier/supplier.entity';
import { Purchase } from './purchase.entity';
import { PurchaseDetail } from './purchase-detail.entity';
import { Payment } from '../payment/payment.entity';
import { PaymentDetail } from '../payment/payment-detail.entity';
import { PaymentMethod } from '../../shared/payment-method/payment-method.entity';
import { State } from '../../shared/state/state.entity';
import { Unit } from '../../shared/unit/unit.entity';
import { Ingredient } from '../../products/ingredient/ingredient.entity';

describe('PurchaseController (integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const testEntities = [
    // Incluimos entidades completas por las relaciones cruzadas entre módulos.
    // Esto evita errores de metadata de TypeORM durante el boot de la app de test.
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
    // Estados mínimos para la lógica de compras/pagos.
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
        //No deberían ser null las dos (CUIT y CUIL) pero no es el foco de estos tests
      })
    );
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
      controllers: [PurchaseController],
      providers: [
        PurchaseService,
        SupplierService,
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

  describe('DTO validation', () => {
    it('NewPurchaseDto: rejects missing required fields', async () => {
      await request(app.getHttpServer()).post('/purchases').send({}).expect(400);
    });

    it('NewPurchaseDto: rejects empty details array', async () => {
      const supplier = await seedSupplier();

      await request(app.getHttpServer())
        .post('/purchases')
        .send({ supplierId: supplier.id, details: [] })
        .expect(400);
    });

    it('NewPurchaseDto: rejects invalid nested details', async () => {
      const supplier = await seedSupplier();

      await request(app.getHttpServer())
        .post('/purchases')
        .send({
          supplierId: supplier.id,
          details: [
            {
              ingredientId: '1',
              quantity: -1,
              historicalUnitPrice: 0,
            },
          ],
        })
        .expect(400);
    });

    it('NewPurchaseDto: enforces paidAmount -> paymentMethodId co-dependency', async () => {
      // El decorador @CoDependentProperties en NewPurchaseDto exige paymentMethodId cuando existe paidAmount.
      const supplier = await seedSupplier();
      const { ingredient } = await seedUnitAndIngredient();

      await request(app.getHttpServer())
        .post('/purchases')
        .send({
          supplierId: supplier.id,
          paidAmount: 10,
          details: [
            {
              ingredientId: ingredient.id,
              quantity: 1,
              historicalUnitPrice: 10,
            },
          ],
        })
        .expect(400);
    });

    it('NewPurchaseDto: allows omitting optional date', async () => {
      const supplier = await seedSupplier();
      const { ingredient } = await seedUnitAndIngredient();

      const res = await request(app.getHttpServer())
        .post('/purchases')
        .send({
          supplierId: supplier.id,
          details: [
            {
              ingredientId: ingredient.id,
              quantity: 1,
              historicalUnitPrice: 10,
            },
          ],
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.details).toHaveLength(1);
    });

    it('NewPurchaseDto: rejects invalid date type', async () => {
      // No usamos transform:true en ValidationPipe, así que string no debe pasar como Date.
      const supplier = await seedSupplier();
      const { ingredient } = await seedUnitAndIngredient();

      await request(app.getHttpServer())
        .post('/purchases')
        .send({
          supplierId: supplier.id,
          date: '2025-01-01',
          details: [
            {
              ingredientId: ingredient.id,
              quantity: 1,
              historicalUnitPrice: 10,
            },
          ],
        })
        .expect(400);
    });

    it('ValidationPipe: rejects extra properties', async () => {
      const supplier = await seedSupplier();
      const { ingredient } = await seedUnitAndIngredient();

      await request(app.getHttpServer())
        .post('/purchases')
        .send({
          supplierId: supplier.id,
          details: [
            {
              ingredientId: ingredient.id,
              quantity: 1,
              historicalUnitPrice: 10,
            },
          ],
          extra: 'nope',
        })
        .expect(400);
    });
  });

  describe('Controller flows', () => {
    it('GET /purchases: returns purchases when no filters are provided', async () => {
      const supplier1 = await seedSupplier('Proveedor A');
      const supplier2 = await seedSupplier('Proveedor B');
      const { ingredient } = await seedUnitAndIngredient();

      await request(app.getHttpServer())
        .post('/purchases')
        .send({
          supplierId: supplier1.id,
          details: [
            { ingredientId: ingredient.id, quantity: 1, historicalUnitPrice: 10 },
          ],
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/purchases')
        .send({
          supplierId: supplier2.id,
          details: [
            { ingredientId: ingredient.id, quantity: 1, historicalUnitPrice: 10 },
          ],
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get('/purchases')
        .query({ page: 1, quantity: 50 })
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
    });

    it('GET /purchases: supports supplier filter', async () => {
      const supplier1 = await seedSupplier('Proveedor A');
      const supplier2 = await seedSupplier('Proveedor B');
      const { ingredient } = await seedUnitAndIngredient();

      await request(app.getHttpServer())
        .post('/purchases')
        .send({
          supplierId: supplier1.id,
          details: [
            { ingredientId: ingredient.id, quantity: 1, historicalUnitPrice: 10 },
          ],
        })
        .expect(201);
      await request(app.getHttpServer())
        .post('/purchases')
        .send({
          supplierId: supplier2.id,
          details: [
            { ingredientId: ingredient.id, quantity: 1, historicalUnitPrice: 10 },
          ],
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get('/purchases')
        .query({
          page: 1,
          quantity: 50,
          filterType: 'supplier',
          filterObjectId: String(supplier1.id),
        })
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].supplier.id).toBe(supplier1.id);
    });

    it('GET /purchases: supports state filter', async () => {
      const supplier = await seedSupplier();
      const { ingredient } = await seedUnitAndIngredient();
      const paymentMethod = await paymentMethodRepository.findOneByOrFail({
        name: 'Cash',
      });

      await request(app.getHttpServer())
        .post('/purchases')
        .send({
          supplierId: supplier.id,
          details: [
            { ingredientId: ingredient.id, quantity: 1, historicalUnitPrice: 10 },
          ],
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/purchases')
        .send({
          supplierId: supplier.id,
          paidAmount: 5,
          paymentMethodId: paymentMethod.id,
          details: [
            { ingredientId: ingredient.id, quantity: 1, historicalUnitPrice: 10 },
          ],
        })
        .expect(201);

      const partiallyPayed = await stateRepository.findOneByOrFail({
        scope: 'purchases',
        name: 'Parcialmente pagado',
      });

      const res = await request(app.getHttpServer())
        .get('/purchases')
        .query({
          page: 1,
          quantity: 50,
          filterType: 'state',
          filterObjectId: String(partiallyPayed.id),
        })
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].state.id).toBe(partiallyPayed.id);
    });

    it('POST /purchases: updates ingredient stock and price', async () => {
      // Al crear una compra, el stock del ingrediente debe aumentar y su precio debe actualizarse.
      const supplier = await seedSupplier();
      const { ingredient } = await seedUnitAndIngredient();

      const res = await request(app.getHttpServer())
        .post('/purchases')
        .send({
          supplierId: supplier.id,
          details: [
            {
              ingredientId: ingredient.id,
              quantity: 2,
              historicalUnitPrice: 15,
            },
          ],
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');

      const updatedIngredient = await ingredientRepository.findOneByOrFail({
        id: ingredient.id,
      });
      expect(Number(updatedIngredient.currentStock)).toBe(2);
      expect(Number(updatedIngredient.unitPrice)).toBe(15);
    });

    it('POST /purchases: creates initial payment and sets state (Parcialmente pagado)', async () => {
      const supplier = await seedSupplier();
      const { ingredient } = await seedUnitAndIngredient();
      const paymentMethod = await paymentMethodRepository.findOneByOrFail({
        name: 'Cash',
      });

      const created = await request(app.getHttpServer())
        .post('/purchases')
        .send({
          supplierId: supplier.id,
          paidAmount: 5,
          paymentMethodId: paymentMethod.id,
          details: [
            { ingredientId: ingredient.id, quantity: 1, historicalUnitPrice: 10 },
          ],
        })
        .expect(201);

      const purchase = await purchaseRepository.findOne({
        where: { id: created.body.id },
        relations: ['state', 'paymentDetails', 'paymentDetails.payment'],
      });

      expect(purchase?.state.name).toBe('Parcialmente pagado');
      expect(purchase?.paymentDetails?.length ?? 0).toBe(1);
      expect(Number(purchase?.paymentDetails?.[0]?.amount)).toBe(5);
    });

    it('POST /purchases: sets state to Pagado when paidAmount covers total', async () => {
      const supplier = await seedSupplier();
      const { ingredient } = await seedUnitAndIngredient();
      const paymentMethod = await paymentMethodRepository.findOneByOrFail({
        name: 'Cash',
      });

      const created = await request(app.getHttpServer())
        .post('/purchases')
        .send({
          supplierId: supplier.id,
          paidAmount: 10,
          paymentMethodId: paymentMethod.id,
          details: [
            { ingredientId: ingredient.id, quantity: 1, historicalUnitPrice: 10 },
          ],
        })
        .expect(201);

      const purchase = await purchaseRepository.findOne({
        where: { id: created.body.id },
        relations: ['state'],
      });
      expect(purchase?.paymentDetails?.length ?? 0).toBeGreaterThan(0);

      expect(purchase?.state.name).toBe('Pagado');
    });

    it('POST /purchases: when no paidAmount, keeps state Pendiente and creates no payment', async () => {
      const supplier = await seedSupplier();
      const { ingredient } = await seedUnitAndIngredient();

      const created = await request(app.getHttpServer())
        .post('/purchases')
        .send({
          supplierId: supplier.id,
          details: [
            { ingredientId: ingredient.id, quantity: 1, historicalUnitPrice: 10 },
          ],
        })
        .expect(201);

      const purchase = await purchaseRepository.findOne({
        where: { id: created.body.id },
        relations: ['state', 'paymentDetails'],
      });

      expect(purchase?.state.name).toBe('Pendiente');
      expect(purchase?.paymentDetails?.length ?? 0).toBe(0);

      // No debería haberse creado ningún pago/relación.
      expect(await paymentRepository.count()).toBe(0);
      expect(await paymentDetailRepository.count()).toBe(0);
    });

    it('POST /purchases: uses supplier payments with unassignedAmount', async () => {
      const supplier = await seedSupplier();
      const { ingredient } = await seedUnitAndIngredient();
      const paymentMethod = await paymentMethodRepository.findOneByOrFail({
        name: 'Cash',
      });

      const payment = await paymentRepository.save(
        paymentRepository.create({
          supplier,
          paymentMethod,
          unassignedAmount: 7,
          details: [],
          dateTime: new Date(),
        })
      );

      const created = await request(app.getHttpServer())
        .post('/purchases')
        .send({
          supplierId: supplier.id,
          details: [
            { ingredientId: ingredient.id, quantity: 1, historicalUnitPrice: 10 },
          ],
        })
        .expect(201);

      const purchase = await purchaseRepository.findOne({
        where: { id: created.body.id },
        relations: ['state', 'paymentDetails', 'paymentDetails.payment'],
      });

      expect(purchase?.paymentDetails?.length ?? 0).toBe(1);
      expect(Number(purchase?.paymentDetails?.[0]?.amount)).toBe(7);
      expect(purchase?.paymentDetails?.[0]?.payment?.id).toBe(payment.id);
      expect(purchase?.state.name).toBe('Parcialmente pagado');

      const updatedPayment = await paymentRepository.findOneByOrFail({
        id: payment.id,
      });
      expect(Number(updatedPayment.unassignedAmount)).toBe(0);
    });

    it('DELETE /purchases/:id: restores stock and removes orphan payment', async () => {
      // Delete de compra debe:
      // - revertir el stock (detalle.quantity)
      // - eliminar el payment si quedó huérfano (era un pago sólo para esta compra)
      const supplier = await seedSupplier();
      const { ingredient } = await seedUnitAndIngredient();
      const paymentMethod = await paymentMethodRepository.findOneByOrFail({
        name: 'Cash',
      });

      const created = await request(app.getHttpServer())
        .post('/purchases')
        .send({
          supplierId: supplier.id,
          paidAmount: 10,
          paymentMethodId: paymentMethod.id,
          details: [
            { ingredientId: ingredient.id, quantity: 2, historicalUnitPrice: 10 },
          ],
        })
        .expect(201);

      const purchaseId = created.body.id;

      const detail = await paymentDetailRepository.findOne({
        where: { purchase: { id: purchaseId } },
        relations: ['payment'],
      });
      expect(detail?.payment?.id).toBeDefined();
      const paymentId = detail!.payment.id;

      await request(app.getHttpServer())
        .delete(`/purchases/${purchaseId}`)
        .expect(200);

      const deletedPurchase = await purchaseRepository.findOne({
        where: { id: purchaseId },
      });
      expect(deletedPurchase).toBeNull();

      const updatedIngredient = await ingredientRepository.findOneByOrFail({
        id: ingredient.id,
      });
      expect(Number(updatedIngredient.currentStock)).toBe(0); //It was 0 intially

      const deletedPayment = await paymentRepository.findOne({
        where: { id: paymentId },
      });
      expect(deletedPayment).toBeNull();
    });

    it('DELETE /purchases/:id: when payment is shared, deletes only the purchase detail (keeps payment)', async () => {
      const supplier = await seedSupplier();
      const { ingredient } = await seedUnitAndIngredient();
      const paymentMethod = await paymentMethodRepository.findOneByOrFail({
        name: 'Cash',
      });

      const created1 = await request(app.getHttpServer())
        .post('/purchases')
        .send({
          supplierId: supplier.id,
          paidAmount: 5,
          paymentMethodId: paymentMethod.id,
          details: [
            { ingredientId: ingredient.id, quantity: 1, historicalUnitPrice: 10 },
          ],
        })
        .expect(201);

      const purchaseId1 = created1.body.id;
      const detail1 = await paymentDetailRepository.findOne({
        where: { purchase: { id: purchaseId1 } },
        relations: ['payment', 'purchase'],
      });
      expect(detail1?.payment?.id).toBeDefined();
      const paymentId = detail1!.payment.id;

      const created2 = await request(app.getHttpServer())
        .post('/purchases')
        .send({
          supplierId: supplier.id,
          details: [
            { ingredientId: ingredient.id, quantity: 1, historicalUnitPrice: 10 },
          ],
        })
        .expect(201);

      const purchaseId2 = created2.body.id;
      const purchase2 = await purchaseRepository.findOneByOrFail({
        id: purchaseId2,
      });
      const payment = await paymentRepository.findOneByOrFail({
        id: paymentId,
      });

      // Simulamos un pago compartido: agregamos un 2do detail en el mismo payment.
      await paymentDetailRepository.save(
        paymentDetailRepository.create({
          amount: 1,
          purchase: purchase2,
          payment,
        })
      );

      await request(app.getHttpServer())
        .delete(`/purchases/${purchaseId1}`)
        .expect(200);

      const stillTherePayment = await paymentRepository.findOne({
        where: { id: paymentId },
      });
      expect(stillTherePayment).not.toBeNull();

      const deletedDetail1 = await paymentDetailRepository.findOne({
        where: { purchase: { id: purchaseId1 } },
      });
      expect(deletedDetail1).toBeNull();

      const remainingDetails = await paymentDetailRepository.count({
        where: { payment: { id: paymentId } },
      });
      expect(remainingDetails).toBe(1);

      const purchase2StillExists = await purchaseRepository.findOne({
        where: { id: purchaseId2 },
      });
      expect(purchase2StillExists).not.toBeNull();
    });
  });
});
