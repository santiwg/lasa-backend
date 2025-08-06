import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CostType } from './cost-type.entity';
import { NewCostTypeDto } from './dtos/newCostType.dto';

@Injectable()
export class CostTypeService {
    constructor(@InjectRepository(CostType) private repository: Repository<CostType>) { }

    async findAll(): Promise<CostType[]> {
        return this.repository.find();
    }
    async findById(id: number): Promise<CostType> {
        const costType = await this.repository.findOneBy({ id });
        if (!costType) {
            throw new Error(`CostType with id ${id} not found`);
        }
        return costType;
    }
    async create(costType: NewCostTypeDto): Promise<CostType> {
        const newCostType = this.repository.create(costType);
        return this.repository.save(newCostType);
    }
}
