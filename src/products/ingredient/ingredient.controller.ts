import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { IngredientService } from './ingredient.service';
import { NewIngredientDto } from './dtos/newIngredient.dto';

@Controller('ingredient')
export class IngredientController {
    constructor(private readonly ingredientService: IngredientService) {}

    @Get()
    findAll() {
        return this.ingredientService.findAll();
    }
    @Post()
    create(@Body() createIngredientDto: NewIngredientDto) {
        return this.ingredientService.create(createIngredientDto);
    }

    @Put(':id')
    update(@Param('id') id: number, @Body() updateIngredientDto: NewIngredientDto) {
        return this.ingredientService.update(id, updateIngredientDto);
    }

    @Delete(':id')
    delete(@Param('id') id: number) {
        return this.ingredientService.delete(id);
    }
}
