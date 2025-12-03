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
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UtilitiesModule } from './utilities/utilities.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      //según la existencia y valor de la variable de entorno usamos un archivo u otro
      envFilePath: process.env.NODE_ENV === 'production' ? '.env.production' : '.env',
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: configService.get('DATABASE_TYPE') as 'postgres',
        url: configService.get('DATABASE_URL'),
        autoLoadEntities: configService.get('DATABASE_AUTO_LOAD_ENTITIES') === 'true',
        synchronize: configService.get('DATABASE_SYNCHRONIZE') === 'true',
      }),
      inject: [ConfigService],
    }),
    SharedModule, SalesModule, CifModule, PurchasesModule, ProductsModule, EmployeesModule, BakeryModule, AuthModule,UtilitiesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
