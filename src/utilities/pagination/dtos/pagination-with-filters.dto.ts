import { PaginationDto } from './pagination.dto';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, IsString } from 'class-validator';

export class PaginationWithFilteringDto extends PaginationDto {
  @IsOptional()
  @IsString()
  filterType?: string = '';

  @IsOptional()
  @Transform(({ value }) =>
    value === undefined || value === null || value === '' ? null : Number(value),
  )
  @IsInt()
  @IsPositive()
  filterObjectId?: number;
}