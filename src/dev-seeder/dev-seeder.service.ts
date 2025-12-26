import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bakery } from 'src/bakery/bakery/bakery.entity';
import { Branch } from 'src/bakery/branch/branch.entity';
import { CostType } from 'src/cif/cost-type/cost-type.entity';
import { Cif } from 'src/cif/cif/cif.entity';
import { EmployeeRole } from 'src/employees/employee-role/employee-role.entity';
import { Employee } from 'src/employees/employee/employee.entity';
import { PaymentDetail } from 'src/purchases/payment/payment-detail.entity';
import { Payment } from 'src/purchases/payment/payment.entity';
import { PurchaseDetail } from 'src/purchases/purchase/purchase-detail.entity';
import { Purchase } from 'src/purchases/purchase/purchase.entity';
import { Supplier } from 'src/purchases/supplier/supplier.entity';
import { Ingredient } from 'src/products/ingredient/ingredient.entity';
import { RecipeItem } from 'src/products/product/recipe-item.entity';
import { Product } from 'src/products/product/product.entity';
import { Customer } from 'src/sales/customer/customer.entity';
import { PaymentMethod } from 'src/shared/payment-method/payment-method.entity';
import { State } from 'src/shared/state/state.entity';
import { Unit } from 'src/shared/unit/unit.entity';

/**
 * Creates non-predefined "demo" entities for development/testing.
 *
 * Key points:
 * - Runs automatically on app boot (OnApplicationBootstrap).
 * - Skips entirely in production (NODE_ENV === 'production').
 * - Idempotent: it checks for existing rows by UNIQUE fields.
 * - Soft-delete aware: it searches with `withDeleted: true` and restores
 *   soft-deleted rows instead of trying to re-insert (which would violate
 *   UNIQUE constraints).
 */
@Injectable()
export class DevSeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DevSeederService.name);

  constructor(
    @InjectRepository(Bakery) private readonly bakeryRepository: Repository<Bakery>,
    @InjectRepository(Branch) private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Unit) private readonly unitRepository: Repository<Unit>,
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepository: Repository<PaymentMethod>,
    @InjectRepository(State) private readonly stateRepository: Repository<State>,
    @InjectRepository(EmployeeRole)
    private readonly employeeRoleRepository: Repository<EmployeeRole>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(CostType)
    private readonly costTypeRepository: Repository<CostType>,
    @InjectRepository(Cif) private readonly cifRepository: Repository<Cif>,
    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,
    @InjectRepository(Product) private readonly productRepository: Repository<Product>,
    @InjectRepository(RecipeItem)
    private readonly recipeItemRepository: Repository<RecipeItem>,
    @InjectRepository(Purchase) private readonly purchaseRepository: Repository<Purchase>,
    @InjectRepository(PurchaseDetail)
    private readonly purchaseDetailRepository: Repository<PurchaseDetail>,
    @InjectRepository(Payment) private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(PaymentDetail)
    private readonly paymentDetailRepository: Repository<PaymentDetail>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    // Only run outside production.
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    // Some "predefined" tables are required as foreign keys for dev data.
    // StartupSeederService already seeds these in SharedModule, but we also
    // ensure them here so DevSeeder can run even if that changes.
    const units = await this.ensureDevUnits();
    const paymentMethods = await this.ensureDevPaymentMethods();
    const purchaseStates = await this.ensureDevPurchaseStates();

    // Keep the seeds small and deterministic; this is meant to provide
    // a usable DB right after boot in dev/test.
    const bakery = await this.ensureBakery();
    await this.ensureBranch(bakery);

    const supplier = await this.ensureSupplier();
    await this.ensureCustomer();

    const roles = await this.ensureEmployeeRoles();
    await this.ensureEmployees(roles);

    const costTypes = await this.ensureCostTypes();
    await this.ensureCifs(costTypes, units);

    const ingredients = await this.ensureIngredients(units);
    await this.ensureProducts(units, ingredients);

    // Purchases + payments (linked to supplier/state/payment method)
    const purchase = await this.ensurePurchase(
      supplier,
      purchaseStates,
      ingredients,
    );
    if (purchase) {
      await this.ensurePaymentForPurchase(supplier, purchase, paymentMethods);
    }

    this.logger.log('Dev seed completed');
  }

  private async ensureDevUnits(): Promise<Record<string, Unit>> {
    // We only create the minimal Units needed to satisfy FK constraints
    // for Ingredients/Products and CIF.
    const desired: Array<Pick<Unit, 'name' | 'scope' | 'description'>> = [
      { name: 'Kilo', scope: 'Alimento', description: null },
      { name: 'Gramos', scope: 'Alimento', description: null },
      { name: 'Litro', scope: 'Liquido', description: null },
      { name: 'Mensual', scope: 'Frecuencia', description: null },
    ];

    await this.unitRepository
      .createQueryBuilder()
      .insert()
      .into(Unit)
      .values(desired)
      .orIgnore()
      .execute();

    const byName: Record<string, Unit> = {};
    for (const item of desired) {
      const unit = await this.unitRepository.findOne({ where: { name: item.name } });
      if (unit) byName[item.name] = unit;
    }
    return byName;
  }

  private async ensureDevPaymentMethods(): Promise<Record<string, PaymentMethod>> {
    const desired: Array<Pick<PaymentMethod, 'name' | 'description'>> = [
      { name: 'Efectivo', description: null },
      { name: 'Transferencia', description: null },
    ];

    await this.paymentMethodRepository
      .createQueryBuilder()
      .insert()
      .into(PaymentMethod)
      .values(desired)
      .orIgnore()
      .execute();

    const byName: Record<string, PaymentMethod> = {};
    for (const item of desired) {
      const method = await this.paymentMethodRepository.findOne({
        where: { name: item.name },
      });
      if (method) byName[item.name] = method;
    }
    return byName;
  }

  private async ensureDevPurchaseStates(): Promise<Record<string, State>> {
    // State has no uniqueness constraint, so we manually ensure (scope,name).
    const desired: Array<Pick<State, 'scope' | 'name'>> = [
      { scope: 'Compra', name: 'Pendiente' },
      { scope: 'Compra', name: 'Parcialmente pagado' },
      { scope: 'Compra', name: 'Pagado' },
    ];

    const byName: Record<string, State> = {};

    for (const item of desired) {
      const existing = await this.stateRepository.findOne({
        where: { scope: item.scope, name: item.name },
      });
      if (existing) {
        byName[item.name] = existing;
        continue;
      }

      const created = await this.stateRepository.save(
        this.stateRepository.create({ scope: item.scope, name: item.name }),
      );
      byName[item.name] = created;
    }

    return byName;
  }

  private async ensureEmployeeRoles(): Promise<Record<string, EmployeeRole>> {
    const desired: Array<Pick<EmployeeRole, 'name' | 'description'>> = [
      { name: 'Panadero', description: 'Operario de producción' },
      { name: 'Administrador', description: 'Gestión y administración' },
    ];

    await this.employeeRoleRepository
      .createQueryBuilder()
      .insert()
      .into(EmployeeRole)
      .values(desired)
      .orIgnore()
      .execute();

    const byName: Record<string, EmployeeRole> = {};
    for (const item of desired) {
      const role = await this.employeeRoleRepository.findOne({
        where: { name: item.name },
      });
      if (role) byName[item.name] = role;
    }
    return byName;
  }

  private async ensureEmployees(roles: Record<string, EmployeeRole>): Promise<void> {
    // Employee doesn't have a natural unique key; we use email as our
    // idempotency key for dev purposes.
    const desired: Array<
      Pick<
        Employee,
        | 'name'
        | 'lastName'
        | 'email'
        | 'hourlyWage'
        | 'isActive'
        | 'phoneNumber'
        | 'cuit'
        | 'cuil'
      > & { roleName: string }
    > = [
      {
        name: 'Juan',
        lastName: 'Pérez',
        email: 'juan.perez@example.com',
        hourlyWage: 2500,
        isActive: true,
        phoneNumber: '0000-000001',
        cuit: null,
        cuil: null,
        roleName: 'Panadero',
      },
      {
        name: 'Ana',
        lastName: 'Gómez',
        email: 'ana.gomez@example.com',
        hourlyWage: 3000,
        isActive: true,
        phoneNumber: '0000-000002',
        cuit: null,
        cuil: null,
        roleName: 'Administrador',
      },
    ];

    for (const item of desired) {
      const existing = await this.employeeRepository.findOne({
        where: { email: item.email },
        withDeleted: true,
      });

      if (existing) {
        if ((existing as any).deletedAt) {
          await this.employeeRepository.restore(existing.id);
        }
        continue;
      }

      const role = roles[item.roleName];
      if (!role) continue;

      await this.employeeRepository.save(
        this.employeeRepository.create({
          name: item.name,
          lastName: item.lastName,
          email: item.email,
          hourlyWage: item.hourlyWage,
          isActive: item.isActive,
          role,
          phoneNumber: item.phoneNumber,
          cuit: item.cuit,
          cuil: item.cuil,
        }),
      );
    }
  }

  private async ensureCostTypes(): Promise<Record<string, CostType>> {
    const desired: Array<Pick<CostType, 'name' | 'description'>> = [
      { name: 'Luz', description: null },
      { name: 'Gas', description: null },
      { name: 'Alquiler', description: null },
    ];

    await this.costTypeRepository
      .createQueryBuilder()
      .insert()
      .into(CostType)
      .values(desired)
      .orIgnore()
      .execute();

    const byName: Record<string, CostType> = {};
    for (const item of desired) {
      const costType = await this.costTypeRepository.findOne({
        where: { name: item.name },
      });
      if (costType) byName[item.name] = costType;
    }
    return byName;
  }

  private async ensureCifs(
    costTypes: Record<string, CostType>,
    units: Record<string, Unit>,
  ): Promise<void> {
    // CIF doesn't have a unique constraint; we use (costType,dateTime,quantity,unitPrice)
    // as a simple dev idempotency key.
    const monthlyUnit = units['Mensual'];
    if (!monthlyUnit) return;

    const desired = [
      {
        costTypeName: 'Luz',
        quantity: 1,
        unit: monthlyUnit,
        unitPrice: 50000,
      },
      {
        costTypeName: 'Gas',
        quantity: 1,
        unit: monthlyUnit,
        unitPrice: 30000,
      },
    ] as const;

    for (const item of desired) {
      const costType = costTypes[item.costTypeName];
      if (!costType) continue;

      const existing = await this.cifRepository.findOne({
        where: {
          costType: { id: costType.id } as any,
          quantity: item.quantity as any,
          unitPrice: item.unitPrice as any,
        },
        withDeleted: true,
      });

      if (existing) {
        if ((existing as any).deletedAt) {
          await this.cifRepository.restore(existing.id);
        }
        continue;
      }

      await this.cifRepository.save(
        this.cifRepository.create({
          costType,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          dateTime: new Date(),
        }),
      );
    }
  }

  private async ensureIngredients(units: Record<string, Unit>): Promise<Record<string, Ingredient>> {
    const kilo = units['Kilo'];
    const gramos = units['Gramos'];
    if (!kilo || !gramos) return {};

    const desired: Array<
      Pick<Ingredient, 'name' | 'unitPrice' | 'currentStock'> & { unit: Unit }
    > = [
      { name: 'Harina 000', unitPrice: 800, currentStock: 50, unit: kilo },
      { name: 'Azúcar', unitPrice: 1200, currentStock: 25, unit: kilo },
      { name: 'Levadura', unitPrice: 15, currentStock: 2000, unit: gramos },
    ];

    const byName: Record<string, Ingredient> = {};

    for (const item of desired) {
      const existing = await this.ingredientRepository.findOne({
        where: { name: item.name },
        withDeleted: true,
      });

      if (existing) {
        if ((existing as any).deletedAt) {
          await this.ingredientRepository.restore(existing.id);
        }
        const fresh = await this.ingredientRepository.findOne({
          where: { name: item.name },
        });
        if (fresh) byName[item.name] = fresh;
        continue;
      }

      const created = await this.ingredientRepository.save(
        this.ingredientRepository.create({
          name: item.name,
          unitPrice: item.unitPrice,
          currentStock: item.currentStock,
          unit: item.unit,
        }),
      );
      byName[item.name] = created;
    }

    return byName;
  }

  private async ensureProducts(
    units: Record<string, Unit>,
    ingredients: Record<string, Ingredient>,
  ): Promise<Record<string, Product>> {
    const kilo = units['Kilo'];
    if (!kilo) return {};

    const harina = ingredients['Harina 000'];
    const azucar = ingredients['Azúcar'];
    const levadura = ingredients['Levadura'];

    const desired = [
      {
        name: 'Pan Francés',
        unit: kilo,
        currentStock: 10,
        unitsPerRecipe: 5,
        laborHoursPerRecipe: 1,
        price: 2500,
        expectedKilosPerMonth: 120,
        recipe: [
          { ingredient: harina, quantity: 3 },
          { ingredient: levadura, quantity: 20 },
        ],
      },
      {
        name: 'Bizcochuelo',
        unit: kilo,
        currentStock: 5,
        unitsPerRecipe: 2,
        laborHoursPerRecipe: 1,
        price: 4000,
        expectedKilosPerMonth: 40,
        recipe: [
          { ingredient: harina, quantity: 1 },
          { ingredient: azucar, quantity: 0.5 },
        ],
      },
    ] as const;

    const byName: Record<string, Product> = {};

    for (const item of desired) {
      const existing = await this.productRepository.findOne({
        where: { name: item.name },
        withDeleted: true,
        relations: ['recipeItems'],
      });

      if (existing) {
        if ((existing as any).deletedAt) {
          await this.productRepository.restore(existing.id);
        }
        const fresh = await this.productRepository.findOne({
          where: { name: item.name },
        });
        if (fresh) byName[item.name] = fresh;
        continue;
      }

      // Product.recipeItems has cascade: true, eager: true
      // so we can create Product with recipeItems in one save.
      const recipeItems = item.recipe
        .filter((r) => !!r.ingredient)
        .map((r) =>
          this.recipeItemRepository.create({
            ingredient: r.ingredient!,
            quantity: r.quantity,
          }),
        );

      const product = this.productRepository.create({
        name: item.name,
        unit: item.unit,
        currentStock: item.currentStock,
        unitsPerRecipe: item.unitsPerRecipe,
        laborHoursPerRecipe: item.laborHoursPerRecipe,
        price: item.price,
        expectedKilosPerMonth: item.expectedKilosPerMonth,
        recipeItems,
      });

      const created: Product = await this.productRepository.save(product);
      byName[item.name] = created;
    }

    return byName;
  }

  private async ensurePurchase(
    supplier: Supplier,
    purchaseStates: Record<string, State>,
    ingredients: Record<string, Ingredient>,
  ): Promise<Purchase | null> {
    const state =
      purchaseStates['Pendiente'] ??
      (await this.stateRepository.findOne({
        where: { scope: 'Compra', name: 'Pendiente' },
      }));

    const harina = ingredients['Harina 000'];
    const azucar = ingredients['Azúcar'];
    if (!state || !harina || !azucar) {
      // Details cannot be empty, so if prerequisites are missing we skip
      // creating the Purchase entirely.
      this.logger.warn(
        'Skipping Purchase seed because prerequisites are missing (state/ingredients)',
      );
      return null;
    }

    // Purchases don't have a unique key; we use (supplier,dateTime day) for dev.
    const today = new Date();
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);

    const existing = await this.purchaseRepository
      .createQueryBuilder('p')
      .leftJoin('p.supplier', 's')
      .where('s.id = :supplierId', { supplierId: supplier.id })
      .andWhere('p.dateTime BETWEEN :start AND :end', { start, end })
      .withDeleted()
      .getOne();

    if (existing) {
      if ((existing as any).deletedAt) {
        await this.purchaseRepository.restore(existing.id);
      }
      return (
        (await this.purchaseRepository.findOne({ where: { id: existing.id } })) ??
        existing
      );
    }

    const details = [
      this.purchaseDetailRepository.create({
        ingredient: harina,
        quantity: 10,
        historicalUnitPrice: harina.unitPrice,
      }),
      this.purchaseDetailRepository.create({
        ingredient: azucar,
        quantity: 5,
        historicalUnitPrice: azucar.unitPrice,
      }),
    ];

    return await this.purchaseRepository.save(
      this.purchaseRepository.create({
        supplier,
        state,
        dateTime: new Date(),
        details,
      }),
    );
  }

  private async ensurePaymentForPurchase(
    supplier: Supplier,
    purchase: Purchase,
    paymentMethods: Record<string, PaymentMethod>,
  ): Promise<void> {
    const method = paymentMethods['Efectivo'];
    if (!method) return;

    // Use (supplier, method, day) as dev idempotency key.
    const today = new Date();
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);

    const existing = await this.paymentRepository
      .createQueryBuilder('pay')
      .leftJoin('pay.supplier', 's')
      .leftJoin('pay.paymentMethod', 'pm')
      .where('s.id = :supplierId', { supplierId: supplier.id })
      .andWhere('pm.id = :pmId', { pmId: method.id })
      .andWhere('pay.dateTime BETWEEN :start AND :end', { start, end })
      .withDeleted()
      .getOne();

    if (existing) {
      if ((existing as any).deletedAt) {
        await this.paymentRepository.restore(existing.id);
      }
      return;
    }

    const payment = await this.paymentRepository.save(
      this.paymentRepository.create({
        supplier,
        paymentMethod: method,
        dateTime: new Date(),
        unassignedAmount: 0,
      }),
    );

    // Create a PaymentDetail assigned to the purchase.
    // PaymentDetail has eager relations to Payment and Purchase.
    await this.paymentDetailRepository.save(
      this.paymentDetailRepository.create({
        payment,
        purchase,
        amount: 10000,
      }),
    );
  }

  private async ensureBakery(): Promise<Bakery> {
    const name = 'Panaderia Demo';

    // `Bakery.name` is unique. We query including soft-deleted rows so we can
    // restore instead of crashing on unique constraint.
    const existing = await this.bakeryRepository.findOne({
      where: { name },
      withDeleted: true,
    });

    if (existing) {
      // If it was soft-deleted, restore it.
      if ((existing as any).deletedAt) {
        await this.bakeryRepository.restore(existing.id);
      }
      return (
        (await this.bakeryRepository.findOne({ where: { name } })) ?? existing
      );
    }

    return await this.bakeryRepository.save(
      this.bakeryRepository.create({
        name,
      }),
    );
  }

  private async ensureBranch(bakery: Bakery): Promise<Branch> {
    const name = 'Casa Central';

    // `Branch.name` is unique.
    const existing = await this.branchRepository.findOne({
      where: { name },
      withDeleted: true,
      relations: ['bakery'],
    });

    if (existing) {
      if ((existing as any).deletedAt) {
        await this.branchRepository.restore(existing.id);
      }
      // If it exists but is linked to a different bakery, we leave it as-is
      // to avoid surprising destructive changes.
      return (
        (await this.branchRepository.findOne({ where: { name }, relations: ['bakery'] })) ??
        existing
      );
    }

    return await this.branchRepository.save(
      this.branchRepository.create({
        name,
        bakery,
      }),
    );
  }

  private async ensureSupplier(): Promise<Supplier> {
    const businessName = 'Proveedor Demo';

    // `Supplier.businessName` is unique.
    const existing = await this.supplierRepository.findOne({
      where: { businessName },
      withDeleted: true,
    });

    if (existing) {
      if ((existing as any).deletedAt) {
        await this.supplierRepository.restore(existing.id);
      }
      return (
        (await this.supplierRepository.findOne({ where: { businessName } })) ??
        existing
      );
    }

    return await this.supplierRepository.save(
      this.supplierRepository.create({
        businessName,
        phone: '0000-000000',
        email: 'proveedor.demo@example.com',
        cuit: null,
        cuil: null,
      }),
    );
  }

  private async ensureCustomer(): Promise<Customer> {
    const businessName = 'Cliente Demo';

    // `Customer.businessName` is unique.
    const existing = await this.customerRepository.findOne({
      where: { businessName },
      withDeleted: true,
    });

    if (existing) {
      if ((existing as any).deletedAt) {
        await this.customerRepository.restore(existing.id);
      }
      return (
        (await this.customerRepository.findOne({ where: { businessName } })) ??
        existing
      );
    }

    return await this.customerRepository.save(
      this.customerRepository.create({
        businessName,
        phone: '0000-000000',
        email: 'cliente.demo@example.com',
        cuit: null,
        cuil: null,
      }),
    );
  }
}
