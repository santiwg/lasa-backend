import { Body, Controller, Get, Post } from '@nestjs/common';
import { CostTypeService } from './cost-type.service';
import { NewCostTypeDto } from './dtos/newCostType.dto';

@Controller('cost-type')
export class CostTypeController {
    constructor(private readonly costTypeService: CostTypeService) { }
    
    @Get()
    findAll() {
        return this.costTypeService.findAll();
    }

    @Post()
    create(@Body() costType: NewCostTypeDto) {
        return this.costTypeService.create(costType);
    }
}
