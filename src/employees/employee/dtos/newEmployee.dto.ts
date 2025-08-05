import { IsDecimal, IsEmail, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class NewEmployeeDto {
    @IsString()
    name: string;

    @IsString()
    @IsEmail()
    email: string;

    @IsString()
    lastName: string;

    @IsNumber()
    @IsPositive()
    hourlyWage: number;

    @IsNumber()
    @IsPositive()
    roleID: number;

    @IsString()
    phoneNumber: string;

    @IsString()
    @IsOptional()
    cuit?: string;

    @IsString()
    @IsOptional()
    cuil?: string;
}