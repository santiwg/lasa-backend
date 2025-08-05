import { IsOptional, IsString } from "class-validator";

export class NewCostTypeDto {
    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;
}