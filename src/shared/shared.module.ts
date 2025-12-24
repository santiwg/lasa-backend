import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StateController } from './state/state.controller';
import { StateService } from './state/state.service';
import { PaymentMethodController } from './payment-method/payment-method.controller';
import { PaymentMethodService } from './payment-method/payment-method.service';
import { UnitController } from './unit/unit.controller';
import { UnitService } from './unit/unit.service';
import { shared_module_entities } from '../entities';
import { StartupSeederService } from './startup-seeder/startup-seeder.service';

@Module({
  imports: [
    TypeOrmModule.forFeature(shared_module_entities)
  ],
  controllers: [StateController, PaymentMethodController, UnitController],
  providers: [StateService, PaymentMethodService, UnitService, StartupSeederService],
  exports: [UnitService, StateService, PaymentMethodService]
})
export class SharedModule {}
