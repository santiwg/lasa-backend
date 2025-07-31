import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseController } from './purchase/purchase.controller';
import { PurchaseService } from './purchase/purchase.service';
import { SupplierController } from './supplier/supplier.controller';
import { SupplierService } from './supplier/supplier.service';
import { PaymentController } from './payment/payment.controller';
import { PaymentService } from './payment/payment.service';
import { purchases_module_entities } from '../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature(purchases_module_entities)
  ],
  controllers: [PurchaseController, SupplierController, PaymentController],
  providers: [PurchaseService, SupplierService, PaymentService]
})
export class PurchasesModule {}
