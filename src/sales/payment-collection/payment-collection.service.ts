import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentCollection } from './payment-collection.entity';

@Injectable()
export class PaymentCollectionService {
    constructor(@InjectRepository(PaymentCollection) private repository: Repository<PaymentCollection>) { }
}
