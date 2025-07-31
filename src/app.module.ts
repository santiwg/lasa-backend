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
import { TypeOrmModule } from '@nestjs/typeorm';


@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: "postgresql://admin:77PdonrDyrvXgd6tSqVd56oC9GEy1iFj@dpg-d25b1o63jp1c73d5dcs0-a.virginia-postgres.render.com/lasa?sslmode=require",
      autoLoadEntities: true,
      synchronize: true,
    }),
    SharedModule, SalesModule, PurchasesModule, ProductsModule, EmployeesModule, BakeryModule, AuthModule, CifModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
