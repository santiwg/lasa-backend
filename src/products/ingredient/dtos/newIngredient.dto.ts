import { IsNumber, IsPositive, IsString, IsNotEmpty, Min } from "class-validator";

export class NewIngredientDto {
    
    @IsNotEmpty()
    @IsString()
    name: string;
    
    @IsNumber()
    @Min(1)
    unitId: number;

    @IsNumber()
    @IsPositive()
    currentStock: number;

    @IsNumber()
    @IsPositive()
    unitPrice: number;
}

