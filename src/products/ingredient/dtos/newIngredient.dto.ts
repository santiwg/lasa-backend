import { IsNumber, IsPositive, IsString, IsNotEmpty, Min } from "class-validator";

export class NewIngredientDto {
    
    @IsNotEmpty()
    @IsString()
    name: string;
    
    @IsNumber()
    @Min(1)
    unitId: number;

    /* De momento no permito que me ingrese el stock actual, lo tiene que hacer por movimiento stock
    @IsNumber()
    @IsPositive()
    currentStock: number;*/

    @IsNumber()
    @IsPositive()
    unitPrice: number;
}

