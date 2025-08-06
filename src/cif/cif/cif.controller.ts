import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CifService } from './cif.service';
import { NewCifDto } from './dtos/newCif.dto';
import { Cif } from './cif.entity';
import { PaginatedResponseDto } from 'src/shared/pagination/dtos/paginated-response.dto';
import { PaginationDto } from 'src/shared/pagination/dtos/pagination.dto';

@Controller('cifs')
export class CifController {
    constructor(private readonly cifService: CifService) { }
    
    @Get()
    async findAll(@Query() pagination: PaginationDto): Promise<PaginatedResponseDto<Cif>> {
        return await this.cifService.findAllPaginated(pagination);
    }
    
    @Get('current-month-total')
    async findCurrentMonthTotal(): Promise<number> {
        return await this.cifService.getCurrentMonthTotal();
    }
    
    @Get('last-month-total')
    async findLastMonthTotal(): Promise<number> {
        return await this.cifService.getLastMonthTotal();
    }
    
    @Post()
    async createCif(@Body() newCif: NewCifDto): Promise<Cif> {
        return await this.cifService.createCif(newCif);
    }

}
