import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Purchase } from './purchase.entity';

@Injectable()
export class PurchaseService {
    constructor(@InjectRepository(Purchase) private repository: Repository<Purchase>) { }
}
