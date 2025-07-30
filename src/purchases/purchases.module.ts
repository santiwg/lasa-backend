import { Module } from '@nestjs/common';
import { PurchaseController } from './purchase/purchase.controller';
import { PurchaseService } from './purchase/purchase.service';
import { SupplierController } from './supplier/supplier.controller';
import { SupplierService } from './supplier/supplier.service';
import { PaymentController } from './payment/payment.controller';
import { PaymentService } from './payment/payment.service';

@Module({
  controllers: [PurchaseController, SupplierController, PaymentController],
  providers: [PurchaseService, SupplierService, PaymentService]
})
export class PurchasesModule {}
