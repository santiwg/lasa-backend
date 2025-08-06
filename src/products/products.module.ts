import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductController } from './product/product.controller';
import { ProductService } from './product/product.service';
import { IngredientController } from './ingredient/ingredient.controller';
import { IngredientService } from './ingredient/ingredient.service';
import { StockMovementController } from './stock-movement/stock-movement.controller';
import { StockMovementService } from './stock-movement/stock-movement.service';
import { ProductionInstanceController } from './production-instance/production-instance.controller';
import { ProductionInstanceService } from './production-instance/production-instance.service';
import { products_module_entities } from '../entities';
import { SharedModule } from '../shared/shared.module';
import { CifModule } from '../cif/cif.module';
import { EmployeesModule } from '../employees/employees.module';

@Module({
  imports: [
    TypeOrmModule.forFeature(products_module_entities),
    SharedModule,
    CifModule,
    EmployeesModule
  ],
  controllers: [ProductController, IngredientController, StockMovementController, ProductionInstanceController],
  providers: [ProductService, IngredientService, StockMovementService, ProductionInstanceService]
})
export class ProductsModule {}
