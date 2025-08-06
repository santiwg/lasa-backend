import { IsNumber, IsPositive, Min } from "class-validator";

export class NewRecipeItemDto {
    @IsNumber()
    @Min(1)
    ingredientId: number;

    @IsNumber()
    @IsPositive()
    quantity: number;
}