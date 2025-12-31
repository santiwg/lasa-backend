import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ProductionInstance } from './production-instance.entity';
import { ProductionInstanceService } from './production-instance.service';
import { NewProductionInstanceDto } from './dtos/newProductionInstance.dto';
import { PaginationWithFilteringDto } from 'src/utilities/pagination/dtos/pagination-with-filters.dto';
import { PaginatedResponseDto } from 'src/utilities/pagination/dtos/paginated-response.dto';

@Controller('production-instances')
export class ProductionInstanceController {
	constructor(private readonly productionInstanceService: ProductionInstanceService) { }

	@Get()
	findAll(@Query() pagination: PaginationWithFilteringDto): Promise<PaginatedResponseDto<ProductionInstance>> {
		return this.productionInstanceService.findAll(pagination);
	}

	@Post()
	create(@Body() dto: NewProductionInstanceDto): Promise<ProductionInstance> {
		return this.productionInstanceService.create(dto);
	}

	@Delete(':id')
	delete(@Param('id') id: number): Promise<{ message: string }> {
		return this.productionInstanceService.delete(id);
	}
}
