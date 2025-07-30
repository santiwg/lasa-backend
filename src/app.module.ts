import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SalesModule } from './sales/sales.module';
import { CifModule } from './cif/cif.module';
import { SharedModule } from './shared/shared.module';
import { AuthModule } from './auth/auth.module';
import { BakeryModule } from './bakery/bakery.module';
import { EmployeesModule } from './employees/employees.module';
import { ProductsModule } from './products/products.module';
import { PurchasesModule } from './purchases/purchases.module';
import { SalesModule } from './sales/sales.module';

@Module({
  imports: [SalesModule, PurchasesModule, ProductsModule, EmployeesModule, BakeryModule, AuthModule, SharedModule, CifModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
