import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductController } from './product/product.controller';
import { ProductService } from './product/product.service';
import { IngredientController } from './ingredient/ingredient.controller';
import { IngredientService } from './ingredient/ingredient.service';
import { StockMovementService } from './stock-movement/stock-movement.service';
import { ProductionInstanceController } from './production-instance/production-instance.controller';
import { ProductionInstanceService } from './production-instance/production-instance.service';
import { UnitService } from './unit/unit.service';
import { UnitController } from './unit/unit.controller';
import { products_module_entities } from '../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature(products_module_entities)
  ],
  controllers: [ProductController, IngredientController, ProductionInstanceController, UnitController],
  providers: [ProductService, IngredientService, StockMovementService, ProductionInstanceService, UnitService]
})
export class ProductsModule {}
