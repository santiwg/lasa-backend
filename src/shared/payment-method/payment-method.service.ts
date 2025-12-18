import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentMethod } from './payment-method.entity';

@Injectable()
export class PaymentMethodService {
    constructor(@InjectRepository(PaymentMethod) private repository: Repository<PaymentMethod>) { }
    async findById(id: number): Promise<PaymentMethod> {
        const paymentMethod = await this.repository.findOne({ where: { id } });
        if (!paymentMethod) {
            throw new NotFoundException('Payment Method not found');
        }
        return paymentMethod;
    }
    async findAll():Promise<PaymentMethod[]> {
        return await this.repository.find();
    }
}
