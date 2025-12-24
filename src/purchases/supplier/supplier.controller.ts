import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { PaginationDto } from 'src/utilities/pagination/dtos/pagination.dto';
import { NewSupplierDto } from './dtos/newSupplier.dto';
import { PaginationWithSortingDto } from 'src/utilities/pagination/dtos/pagination-with-sorting.dto';
import { SupplierWithBalance } from './dtos/supplierWithBalance.interface';
import { PaginatedResponseDto } from 'src/utilities/pagination/dtos/paginated-response.dto';
import { Supplier } from './supplier.entity';

@Controller('suppliers')
export class SupplierController {

    constructor(private readonly supplierService:SupplierService) { }

    @Get()
    async findAll(@Query() pagination: PaginationWithSortingDto):Promise<PaginatedResponseDto<Supplier>> {
        return await this.supplierService.findAll(pagination);
    }

    @Get('/with-balance')
    async findAllWithBalance(@Query() pagination: PaginationWithSortingDto):Promise<PaginatedResponseDto<SupplierWithBalance>> {
        return await this.supplierService.findAllWithBalance(pagination);
    }
    
    @Post()
    async createSupplier(@Body() newSupplierDto: NewSupplierDto): Promise<SupplierWithBalance> {
        return await this.supplierService.create(newSupplierDto);
    }
    @Put(':id')
    async updateSupplier(@Param('id') id: number, @Body() updateSupplierDto: NewSupplierDto): Promise<SupplierWithBalance> {
        return await this.supplierService.update(id, updateSupplierDto);
    }
    @Delete(':id')
    async deleteSupplier(@Param('id') id: number): Promise<{ message: string }> {
        return await this.supplierService.delete(id);
    }


}
