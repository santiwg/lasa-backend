import { IsDate, IsNumber, IsOptional, IsString } from "class-validator";

export class NewStockMovementDto {
    @IsNumber()
    @IsOptional()
    productId?: number;

    @IsNumber()
    @IsOptional()
    ingredientId?: number;

    @IsNumber()
    quantity: number;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsDate()
    dateTime?: Date;
}