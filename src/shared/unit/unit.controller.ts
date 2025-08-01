import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UnitService } from './unit.service';
import { Unit } from './unit.entity';
import { NewUnitDto } from './dtos/newUnit.dto';

@Controller('unit')
export class UnitController {
    constructor(private readonly unitService: UnitService) {}

   @Get()
   findAll(): Promise<Unit[]>  {
       return this.unitService.findAll();
   }
   @Post()
   create(@Body() newUnit: NewUnitDto): Promise<Unit>  {
        return this.unitService.create(newUnit);
    }
    @Get('findByScope/:scope')
    findByScope(@Param('scope') scope: string): Promise<Unit[]> {
        return this.unitService.findByScope(scope);
    }
}
