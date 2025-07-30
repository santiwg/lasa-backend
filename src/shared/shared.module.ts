import { Module } from '@nestjs/common';
import { StateController } from './shared/state/state.controller';
import { StateService } from './shared/state/state.service';
import { PaymentMethodController } from './payment-method/payment-method.controller';
import { PaymentMethodService } from './payment-method/payment-method.service';

@Module({
  controllers: [StateController, PaymentMethodController],
  providers: [StateService, PaymentMethodService]
})
export class SharedModule {}
