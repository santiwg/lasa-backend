import { Body, Controller, Get, Post } from '@nestjs/common';
import { CostTypeService } from './cost-type.service';
import { NewCostTypeDto } from './dtos/newCostType.dto';

@Controller('cost-types')
export class CostTypeController {
    constructor(private readonly costTypeService: CostTypeService) { }
    
    @Get()
    async findAll() {
        return await this.costTypeService.findAll();
    }

    @Post()
    async create(@Body() costType: NewCostTypeDto) {
        return await this.costTypeService.create(costType);
    }
}
