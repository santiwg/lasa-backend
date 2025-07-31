import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SaleController } from './sale/sale.controller';
import { SaleService } from './sale/sale.service';
import { CustomerController } from './customer/customer.controller';
import { CustomerService } from './customer/customer.service';
import { PaymentCollectionController } from './payment-collection/payment-collection.controller';
import { PaymentCollectionService } from './payment-collection/payment-collection.service';
import { sales_module_entities } from '../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature(sales_module_entities)
  ],
  controllers: [SaleController, CustomerController, PaymentCollectionController],
  providers: [SaleService, CustomerService, PaymentCollectionService]
})
export class SalesModule {}
