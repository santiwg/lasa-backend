import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as request from 'supertest';

import { Unit } from '../../shared/unit/unit.entity';
import { UnitService } from '../../shared/unit/unit.service';

import { Ingredient } from '../ingredient/ingredient.entity';
import { IngredientService } from '../ingredient/ingredient.service';

import { Product, ComplexityFactor } from '../product/product.entity';
import { RecipeItem } from '../product/recipe-item.entity';
import { ProductService } from '../product/product.service';

import { ProductionInstance } from './production-instance.entity';
import { ProductionInstanceDetail } from './production-instance-detail.entity';
import { ProductionInstanceController } from './production-instance.controller';
import { ProductionInstanceService } from './production-instance.service';

import { PaginationService } from '../../utilities/pagination/pagination.service';
import { CifService } from '../../cif/cif/cif.service';
import { EmployeeService } from '../../employees/employee/employee.service';

jest.setTimeout(120000);

describe('Production Instances flow (integration)', () => {
	let app: INestApplication;
	let dataSource: DataSource;

	let unitRepository: Repository<Unit>;
	let ingredientRepository: Repository<Ingredient>;
	let productRepository: Repository<Product>;

	const entities = [
		Unit,
		Ingredient,
		Product,
		RecipeItem,
		ProductionInstance,
		ProductionInstanceDetail,
	];

	const mockCifService: Pick<CifService, 'getUnitaryCif'> = {
		getUnitaryCif: jest.fn(async () => 0),
	};

	const mockEmployeeService: Pick<EmployeeService, 'getAverageHourlyWageByRoleName'> = {
		getAverageHourlyWageByRoleName: jest.fn(async () => 0),
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
						entities,
						synchronize: true,
						logging: false,
					}),
				}),
				TypeOrmModule.forFeature(entities),
			],
			controllers: [ProductionInstanceController],
			providers: [
				ProductionInstanceService,
				ProductService,
				IngredientService,
				UnitService,
				PaginationService,
				{ provide: CifService, useValue: mockCifService },
				{ provide: EmployeeService, useValue: mockEmployeeService },
			],
		}).compile();

		app = moduleRef.createNestApplication();
		app.useGlobalPipes(
			new ValidationPipe({
				whitelist: true,
				forbidNonWhitelisted: true,
			}),
		);
		await app.init();

		dataSource = moduleRef.get(DataSource);
		unitRepository = dataSource.getRepository(Unit);
		ingredientRepository = dataSource.getRepository(Ingredient);
		productRepository = dataSource.getRepository(Product);
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		await dataSource.synchronize(true);
	});

	const seedUnitKg = async () => {
		return await unitRepository.save(
			unitRepository.create({ name: 'kg', description: null, scope: 'products' }),
		);
	};

	const seedIngredient = async (args: { name: string; unit: Unit; unitPrice?: number }) => {
		return await ingredientRepository.save(
			ingredientRepository.create({
				name: args.name,
				unit: args.unit,
				unitPrice: args.unitPrice ?? 1,
				currentStock: 0,
			}),
		);
	};

	const setIngredientStock = async (ingredientId: number, stock: number) => {
		await ingredientRepository.update({ id: ingredientId }, { currentStock: stock });
	};

	const seedProduct = async (args: {
		name: string;
		unit: Unit;
		unitsPerRecipe: number;
		recipe: Array<{ ingredient: Ingredient; quantity: number }>;
	}) => {
		return await productRepository.save(
			productRepository.create({
				name: args.name,
				unit: args.unit,
				currentStock: 0,
				unitsPerRecipe: args.unitsPerRecipe,
				laborHoursPerRecipe: 0.1,
				price: 1,
				expectedKilosPerMonth: 1,
				complexityFactor: ComplexityFactor.SIMPLE,
				recipeItems: args.recipe.map((r) => ({ ingredient: r.ingredient, quantity: r.quantity })),
			}),
		);
	};

	const getIngredientStock = async (id: number) => {
		const ing = await ingredientRepository.findOneByOrFail({ id });
		return Number(ing.currentStock);
	};

	const getProductStock = async (id: number) => {
		const p = await productRepository.findOneByOrFail({ id });
		return Number(p.currentStock);
	};

	it('runs full flow with expected stocks, filters and delete reversion', async () => {
		// 1) Controlar stock de ingredientes
		const unit = await seedUnitKg();
		const flour = await seedIngredient({ name: 'Harina', unit });
		const sugar = await seedIngredient({ name: 'Azucar', unit });
		const yeast = await seedIngredient({ name: 'Levadura', unit });

		await setIngredientStock(flour.id, 100);
		await setIngredientStock(sugar.id, 100);
		await setIngredientStock(yeast.id, 100);

		expect(await getIngredientStock(flour.id)).toBe(100);
		expect(await getIngredientStock(sugar.id)).toBe(100);
		expect(await getIngredientStock(yeast.id)).toBe(100);

		// 2) Crear productos y recetas
		const productA = await seedProduct({
			name: 'ProdA',
			unit,
			unitsPerRecipe: 10,
			recipe: [
				{ ingredient: sugar, quantity: 0.5 },
				{ ingredient: flour, quantity: 3 },
			],
		});

		const productB = await seedProduct({
			name: 'ProdB',
			unit,
			unitsPerRecipe: 15,
			recipe: [
				{ ingredient: flour, quantity: 2 },
				{ ingredient: yeast, quantity: 1 },
			],
		});

		// 3) Crear instancias de producción y verificar stocks
		const createProductionInstance = async (details: Array<{ productId: number; quantity: number }>) => {
			const res = await request(app.getHttpServer())
				.post('/production-instances')
				.send({ details })
				.expect(201);
			return res.body.id as number;
		};

		const instance1 = await createProductionInstance([
			{ productId: productA.id, quantity: 10 },
			{ productId: productB.id, quantity: 15 },
		]);

		expect(await getProductStock(productA.id)).toBe(10);
		expect(await getProductStock(productB.id)).toBe(15);

		expect(await getIngredientStock(sugar.id)).toBe(99.5);
		expect(await getIngredientStock(flour.id)).toBe(95);
		expect(await getIngredientStock(yeast.id)).toBe(99);

		const instance2 = await createProductionInstance([{ productId: productA.id, quantity: 15 }]);

		// Con la lógica actual, el stock de productos es acumulativo:
		// ProdA = 10 + 15 = 25
		expect(await getProductStock(productA.id)).toBe(25);
		expect(await getProductStock(productB.id)).toBe(15);

		expect(await getIngredientStock(sugar.id)).toBe(98.75);
		expect(await getIngredientStock(flour.id)).toBe(90.5);
		expect(await getIngredientStock(yeast.id)).toBe(99);

		const instance3 = await createProductionInstance([{ productId: productB.id, quantity: 10 }]);

		expect(await getProductStock(productA.id)).toBe(25);
		expect(await getProductStock(productB.id)).toBe(25);

		// Harina: 90.50 - (2 * (10/15)) = 90.50 - 1.33 = 89.17 (redondeo a 2 decimales)
		// Levadura: 99.00 - (1 * (10/15)) = 99.00 - 0.67 = 98.33
		expect(await getIngredientStock(sugar.id)).toBe(98.75);
		expect(await getIngredientStock(flour.id)).toBe(89.17);
		expect(await getIngredientStock(yeast.id)).toBe(98.33);

		// 4) Filtros por producto (paginado)
		const fetchIds = async (filterProductId: number) => {
			const res = await request(app.getHttpServer())
				.get('/production-instances')
				.query({
					page: 1,
					quantity: 50,
					filterType: 'product',
					filterObjectId: filterProductId,
				})
				.expect(200);

			return (res.body.data as any[]).map((row) => row.id as number);
		};

		const idsForA = await fetchIds(productA.id);
		expect(new Set(idsForA)).toEqual(new Set([instance1, instance2]));

		const idsForB = await fetchIds(productB.id);
		expect(new Set(idsForB)).toEqual(new Set([instance1, instance3]));

		const productC = await seedProduct({
			name: 'ProdC',
			unit,
			unitsPerRecipe: 10,
			recipe: [{ ingredient: flour, quantity: 1 }],
		});

		const idsForC = await fetchIds(productC.id);
		expect(idsForC).toEqual([]);

		// 5) Eliminar última instancia y verificar reversión de stock
		await request(app.getHttpServer())
			.delete(`/production-instances/${instance3}`)
			.expect(200);

		expect(await getProductStock(productA.id)).toBe(25);
		expect(await getProductStock(productB.id)).toBe(15);

		expect(await getIngredientStock(sugar.id)).toBe(98.75);
		expect(await getIngredientStock(flour.id)).toBe(90.5);
		expect(await getIngredientStock(yeast.id)).toBe(99);
	});
});