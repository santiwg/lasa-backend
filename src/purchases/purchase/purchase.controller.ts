import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import { PaginationWithFilteringDto } from 'src/utilities/pagination/dtos/pagination-with-filters.dto';
import { PaginatedResponseDto } from 'src/utilities/pagination/dtos/paginated-response.dto';
import { Purchase } from './purchase.entity';
import { NewPurchaseDto } from './dtos/newPurchase.dto';

@Controller('purchases')
export class PurchaseController {
    constructor(private readonly purchaseService: PurchaseService) { }

    @Get()
    async findAll(@Query() pagination: PaginationWithFilteringDto): Promise<PaginatedResponseDto<Purchase>> {
        return await this.purchaseService.findAll(pagination);
    }
    @Post()
    async createPurchase(@Body() purchaseData: NewPurchaseDto): Promise<Purchase> {
        return await this.purchaseService.create(purchaseData);
    }
    @Delete(':id')
    async deletePurchase(@Param('id') id: number): Promise<{ message: string }> {
        return await this.purchaseService.delete(id);
    }
}
