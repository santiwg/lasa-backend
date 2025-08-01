import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale } from './sale.entity';

@Injectable()
export class SaleService {
    constructor(@InjectRepository(Sale) private repository: Repository<Sale>) { }
}
