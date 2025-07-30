import { Module } from '@nestjs/common';
import { ProductController } from './product/product.controller';
import { ProductService } from './product/product.service';
import { IngredientController } from './ingredient/ingredient.controller';
import { IngredientService } from './ingredient/ingredient.service';
import { StockMovementService } from './stock-movement/stock-movement.service';
import { ProductionInstanceController } from './production-instance/production-instance.controller';
import { ProductionInstanceService } from './production-instance/production-instance.service';

@Module({
  controllers: [ProductController, IngredientController, ProductionInstanceController],
  providers: [ProductService, IngredientService, StockMovementService, ProductionInstanceService]
})
export class ProductsModule {}
