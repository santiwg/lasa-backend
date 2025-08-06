import { IsOptional, IsString, IsNotEmpty } from "class-validator";

export class NewCostTypeDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;
}