import { Body, Controller, Get, Post } from '@nestjs/common';
import { StockMovementService } from './stock-movement.service';
import { NewStockMovementDto } from './dtos/newStockMovement.dto';
import { StockMovement } from './stock-movement.entity';

@Controller('stock-movements')
export class StockMovementController {
    constructor(private readonly stockMovementService: StockMovementService) {}

    @Get()
    findAll():Promise<StockMovement[]> {
        return this.stockMovementService.findAll();
    }
    @Post()
    create(@Body() createStockMovementDto: NewStockMovementDto):Promise<StockMovement> {
        return this.stockMovementService.create(createStockMovementDto);
    }
}
