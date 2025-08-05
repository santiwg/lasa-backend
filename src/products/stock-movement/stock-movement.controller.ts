import { Controller } from '@nestjs/common';
import { StockMovementService } from './stock-movement.service';

@Controller('stock-movement')
export class StockMovementController {
    constructor(private readonly stockMovementService: StockMovementService) {}
}
