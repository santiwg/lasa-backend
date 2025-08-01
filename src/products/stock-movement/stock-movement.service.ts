import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockMovement } from './stock-movement.entity';

@Injectable()
export class StockMovementService {
    constructor(@InjectRepository(StockMovement) private repository: Repository<StockMovement>) { }
}
