
import { IsString, IsOptional } from 'class-validator';
export class NewUnitDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  scope: string;
}