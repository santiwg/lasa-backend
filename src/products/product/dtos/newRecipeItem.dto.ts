import { IsNumber, IsPositive } from "class-validator";

export class NewRecipeItemDto {
    @IsNumber()
    @IsPositive()
    ingredientId: number;

    @IsNumber()
    @IsPositive()
    quantity: number;
}