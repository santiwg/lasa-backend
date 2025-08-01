import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StateController } from './state/state.controller';
import { StateService } from './state/state.service';
import { PaymentMethodController } from './payment-method/payment-method.controller';
import { PaymentMethodService } from './payment-method/payment-method.service';
import { shared_module_entities } from '../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature(shared_module_entities)
  ],
  controllers: [StateController, PaymentMethodController],
  providers: [StateService, PaymentMethodService]
})
export class SharedModule {}
