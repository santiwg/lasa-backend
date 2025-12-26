import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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
import { Product } from 'src/products/product/product.entity';
import { RecipeItem } from 'src/products/product/recipe-item.entity';
import { Customer } from 'src/sales/customer/customer.entity';
import { PaymentMethod } from 'src/shared/payment-method/payment-method.entity';
import { State } from 'src/shared/state/state.entity';
import { Unit } from 'src/shared/unit/unit.entity';
import { DevSeederService } from './dev-seeder.service';

/**
 * Development-only database seeding.
 *
 * This module is imported by AppModule, but the service will **no-op** when
 * running with NODE_ENV=production.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      // Shared
      Unit,
      PaymentMethod,
      State,

      // Bakery / branches
      Bakery,
      Branch,

      // People
      Supplier,
      Customer,
      Employee,
      EmployeeRole,

      // Products
      Ingredient,
      Product,
      RecipeItem,

      // Purchases / payments
      Purchase,
      PurchaseDetail,
      Payment,
      PaymentDetail,

      // CIF
      CostType,
      Cif,
    ]),
  ],
  providers: [DevSeederService],
})
export class DevSeederModule {}
