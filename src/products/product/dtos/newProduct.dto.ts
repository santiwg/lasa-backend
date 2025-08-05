import { IsString, IsNumber, IsEnum, IsArray, ValidateNested, IsPositive, Min, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { NewRecipeItemDto } from './newRecipeItem.dto';
import { ComplexityFactor } from '../product.entity';

export class NewProductDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsNumber()
    @IsPositive()
    unitId: number;

    @IsNumber()
    @Min(0)
    currentStock: number;
    

    @IsNumber()
    @IsPositive()
    unitsPerRecipe: number;

    @IsNumber()
    @IsPositive()
    laborHoursPerRecipe: number;

    @IsNumber()
    @IsPositive()
    price: number;

    @IsNumber()
    @IsPositive()
    expectedKilosPerMonth: number;

    @IsEnum(ComplexityFactor)
    complexityFactor: ComplexityFactor;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => NewRecipeItemDto)
    items: NewRecipeItemDto[];
}