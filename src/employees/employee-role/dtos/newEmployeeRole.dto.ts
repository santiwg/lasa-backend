import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class NewEmployeeRoleDto {

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

}