import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ingredient } from './ingredient.entity';
import { NewIngredientDto } from './dtos/newIngredient.dto';
import { UnitService } from 'src/shared/unit/unit.service';

@Injectable()
export class IngredientService {
    constructor(@InjectRepository(Ingredient) private repository: Repository<Ingredient>,
                private readonly unitService: UnitService) { }

    async findById(id: number): Promise<Ingredient> {
        const ingredient = await this.repository.findOne({
            where: { id }
        });

        if (!ingredient) {
            throw new BadRequestException(`Ingredient with ID ${id} not found`);
        }

        return ingredient;
    }
    async updateStock(id: number, quantityChange: number): Promise<void> {
        await this.repository.increment({ id }, 'currentStock', quantityChange);
    }
    async findAll(): Promise<Ingredient[]> {
        return this.repository.find();
    }
    async create(ingredient: NewIngredientDto): Promise<Ingredient> {
        const unit = await this.unitService.findById(ingredient.unitId);
        const { unitId, ...ingredientData } = ingredient;
        const newIngredient = this.repository.create({
            ...ingredientData,
            unit
        });
        return this.repository.save(newIngredient);
    }
    async delete(id: number): Promise<{ message: string; }> {
        const ingredient = await this.findById(id);
        await this.repository.softRemove(ingredient);
        return { message: `Ingredient with ID ${id} deleted successfully` };
    }
}
