import { Module } from '@nestjs/common';
import { SaleController } from './sale/sale.controller';
import { SaleService } from './sale/sale.service';
import { CustomerController } from './customer/customer.controller';
import { CustomerService } from './customer/customer.service';
import { PaymentCollectionController } from './payment-collection/payment-collection.controller';
import { PaymentCollectionService } from './payment-collection/payment-collection.service';

@Module({
  controllers: [SaleController, CustomerController, PaymentCollectionController],
  providers: [SaleService, CustomerService, PaymentCollectionService]
})
export class SalesModule {}
