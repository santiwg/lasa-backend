import { IsDecimal, IsEmail, IsNumber, IsOptional, IsPositive, IsString, IsNotEmpty, Min } from "class-validator";

export class NewEmployeeDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsString()
    lastName: string;

    @IsNumber()
    @IsPositive()
    hourlyWage: number;

    @IsNumber()
    @Min(1)
    roleId: number;

    @IsNotEmpty()
    @IsString()
    phoneNumber: string;

    @IsString()
    @IsOptional()
    cuit?: string;

    @IsString()
    @IsOptional()
    cuil?: string;

    @IsOptional()
    isActive?: boolean = true;
}