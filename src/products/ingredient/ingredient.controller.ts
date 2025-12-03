import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { IngredientService } from './ingredient.service';
import { NewIngredientDto } from './dtos/newIngredient.dto';
import { PaginationDto } from 'src/utilities/pagination/dtos/pagination.dto';
import { PaginatedResponseDto } from 'src/utilities/pagination/dtos/paginated-response.dto';
import { Ingredient } from './ingredient.entity';

@Controller('ingredients')
export class IngredientController {
    constructor(private readonly ingredientService: IngredientService) {}

    @Get()
    async findAll(@Query() pagination: PaginationDto): Promise<PaginatedResponseDto<Ingredient>> {
        return await this.ingredientService.findAllPaginated(pagination);
    }
    
    @Post()
    async create(@Body() createIngredientDto: NewIngredientDto):Promise<Ingredient> {
        return await this.ingredientService.create(createIngredientDto);
    }

    @Put(':id')
    async update(@Param('id') id: number, @Body() updateIngredientDto: NewIngredientDto):Promise<Ingredient> {
        return await this.ingredientService.update(id, updateIngredientDto);
    }

    @Delete(':id')
    async delete(@Param('id') id: number):Promise<{ message: string }> {
        return await this.ingredientService.delete(id);
    }
}
