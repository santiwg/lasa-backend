import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductionInstance } from './production-instance.entity';

@Injectable()
export class ProductionInstanceService {
    constructor(@InjectRepository(ProductionInstance) private repository: Repository<ProductionInstance>) { }
}
