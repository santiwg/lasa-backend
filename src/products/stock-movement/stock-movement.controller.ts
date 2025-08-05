import { Body, Controller, Get, Post } from '@nestjs/common';
import { StockMovementService } from './stock-movement.service';
import { NewStockMovementDto } from './dtos/newStockMovement.dto';

@Controller('stock-movement')
export class StockMovementController {
    constructor(private readonly stockMovementService: StockMovementService) {}

    @Get()
    findAll() {
        return this.stockMovementService.findAll();
    }
    @Post()
    create(@Body() createStockMovementDto: NewStockMovementDto) {
        return this.stockMovementService.create(createStockMovementDto);
    }
}
