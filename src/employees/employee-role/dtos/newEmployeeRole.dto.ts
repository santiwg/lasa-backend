import { IsOptional, IsString } from "class-validator";

export class NewEmployeeRoleDto {

    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

}