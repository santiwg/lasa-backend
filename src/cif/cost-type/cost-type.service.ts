import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CostType } from './cost-type.entity';

@Injectable()
export class CostTypeService {
    constructor(@InjectRepository(CostType) private repository: Repository<CostType>) { }
}
