import { IsDate, IsOptional } from "class-validator";
import { IsPositive } from "class-validator/types/decorator/number/IsPositive";
import { IsNumber } from "class-validator/types/decorator/typechecker/IsNumber";

export class NewCifDto {
    @IsNumber()
    @IsPositive()
    costTypeId: number;


    @IsDate()
    @IsOptional()
    dateTime?: Date;

    @IsNumber()
    @IsPositive()
    quantity: number;

    @IsNumber()
    @IsPositive()
    unitId: number;

    @IsNumber()
    @IsPositive()
    unitPrice: number;
}