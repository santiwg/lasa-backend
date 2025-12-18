import { Controller, Param, Get } from '@nestjs/common';
import { PaymentMethod } from './payment-method.entity';
import { PaymentMethodService } from './payment-method.service';

@Controller('payment-method')
export class PaymentMethodController {

    constructor(private readonly paymentMethodService: PaymentMethodService) { }

    @Get(':id')
    async findById(@Param('id') id: number): Promise<PaymentMethod> {
        return await this.paymentMethodService.findById(id);
    }

    @Get()
    async findAll(): Promise<PaymentMethod[]> {
        return await this.paymentMethodService.findAll();
    }
}