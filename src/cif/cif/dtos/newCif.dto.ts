import { IsDate, IsOptional, Min } from "class-validator";
import { Type } from "class-transformer";
import { IsPositive } from "class-validator/types/decorator/number/IsPositive";
import { IsNumber } from "class-validator/types/decorator/typechecker/IsNumber";
import { IsNotFutureDate } from "../../../shared/validators/is-not-future-date.validator";

export class NewCifDto {
    @IsNumber()
    @Min(1)
    costTypeId: number;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    @IsNotFutureDate() // decorador personalizado
    dateTime?: Date;

    @IsNumber()
    @IsPositive()
    quantity: number;

    @IsNumber()
    @Min(1)
    unitId: number;

    @IsNumber()
    @IsPositive()
    unitPrice: number;
}