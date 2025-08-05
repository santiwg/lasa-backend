import { IsNumber, IsPositive, IsString } from "class-validator";

export class NewIngredientDto {
    
    @IsString()
    name: string;
    
    @IsNumber()
    @IsPositive()
    unitId: number;

    @IsNumber()
    @IsPositive()
    currentStock: number;

    @IsNumber()
    @IsPositive()
    unitPrice: number;
}

