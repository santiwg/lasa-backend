import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseController } from './purchase/purchase.controller';
import { PurchaseService } from './purchase/purchase.service';
import { SupplierController } from './supplier/supplier.controller';
import { SupplierService } from './supplier/supplier.service';
import { PaymentController } from './payment/payment.controller';
import { PaymentService } from './payment/payment.service';
import { purchases_module_entities } from '../entities';
import { UtilitiesModule } from 'src/utilities/utilities.module';
import { SharedModule } from 'src/shared/shared.module';
import { Product } from 'src/products/product/product.entity';
import { ProductsModule } from 'src/products/products.module';

@Module({
  imports: [
    TypeOrmModule.forFeature(purchases_module_entities),
    SharedModule,
    UtilitiesModule,
    ProductsModule
  ],
  controllers: [PurchaseController, SupplierController, PaymentController],
  providers: [PurchaseService, SupplierService, PaymentService]
})
export class PurchasesModule {}
