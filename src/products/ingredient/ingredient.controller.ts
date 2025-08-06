import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { IngredientService } from './ingredient.service';
import { NewIngredientDto } from './dtos/newIngredient.dto';

@Controller('ingredients')
export class IngredientController {
    constructor(private readonly ingredientService: IngredientService) {}

    @Get()
    async findAll() {
        return await this.ingredientService.findAll();
    }
    
    @Post()
    async create(@Body() createIngredientDto: NewIngredientDto) {
        return await this.ingredientService.create(createIngredientDto);
    }

    @Put(':id')
    async update(@Param('id') id: number, @Body() updateIngredientDto: NewIngredientDto) {
        return await this.ingredientService.update(id, updateIngredientDto);
    }

    @Delete(':id')
    async delete(@Param('id') id: number) {
        return await this.ingredientService.delete(id);
    }
}
