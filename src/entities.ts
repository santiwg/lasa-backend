import { Product } from './products/product/product.entity';
import { Ingredient } from './products/ingredient/ingredient.entity';
import { StockMovement } from './products/stock-movement/stock-movement.entity';
import { ProductionInstance } from './products/production-instance/production-instance.entity';
import { ProductionInstanceDetail } from './products/production-instance/production-instance-detail.entity';
import { RecipeItem } from './products/product/recipe-item.entity';
import { Unit } from './shared/unit/unit.entity';

import { Employee } from './employees/employee/employee.entity';
import { EmployeeRole } from './employees/employee-role/employee-role.entity';

import { User } from './auth/user/user.entity';

import { Bakery } from './bakery/bakery/bakery.entity';
import { Branch } from './bakery/branch/branch.entity';

import { Cif } from './cif/cif/cif.entity';
import { CostType } from './cif/cost-type/cost-type.entity';

import { Sale } from './sales/sale/sale.entity';
import { SaleDetail } from './sales/sale/sale-detail.entity';
import { Customer } from './sales/customer/customer.entity';
import { PaymentCollection } from './sales/payment-collection/payment-collection.entity';
import { PaymentCollectionDetail } from './sales/payment-collection/payment-collection-detail.entity';

import { Purchase } from './purchases/purchase/purchase.entity';
import { PurchaseDetail } from './purchases/purchase/purchase-detail.entity';
import { Supplier } from './purchases/supplier/supplier.entity';
import { Payment } from './purchases/payment/payment.entity';
import { PaymentDetail } from './purchases/payment/payment-detail.entity';

import { State } from './shared/state/state.entity';
import { PaymentMethod } from './shared/payment-method/payment-method.entity';
// import { Check } from './shared/check/check.entity';
// import { CheckType } from './shared/check-type/check-type.entity';

// Products module entities
export const products_module_entities = [
  Product,
  Ingredient,
  StockMovement,
  ProductionInstance,
  ProductionInstanceDetail,
  RecipeItem
];

// Employees module entities
export const employees_module_entities = [
  Employee,
  EmployeeRole
];

// Auth module entities
export const auth_module_entities = [
  User
];

// Bakery module entities
export const bakery_module_entities = [
  Bakery,
  Branch
];

// CIF module entities
export const cif_module_entities = [
  Cif,
  CostType
];

// Sales module entities
export const sales_module_entities = [
  Sale,
  SaleDetail,
  Customer,
  PaymentCollection,
  PaymentCollectionDetail
];

// Purchases module entities
export const purchases_module_entities = [
  Purchase,
  PurchaseDetail,
  Supplier,
  Payment,
  PaymentDetail
];

// Shared module entities
export const shared_module_entities = [
  State,
  PaymentMethod,
  // Check,
  // CheckType,
  Unit
]; 