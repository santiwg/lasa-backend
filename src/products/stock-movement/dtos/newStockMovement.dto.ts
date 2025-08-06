import { IsDate, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { Type } from "class-transformer";
import { IsNotFutureDate } from "../../../shared/validators/is-not-future-date.validator";

export class NewStockMovementDto {
    @IsNumber()
    @Min(1)
    @IsOptional()
    productId?: number;

    @IsNumber()
    @Min(1)
    @IsOptional()
    ingredientId?: number;

    @IsNumber()
    quantity: number;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    @IsNotFutureDate() // decorador personalizado
    dateTime?: Date;
}