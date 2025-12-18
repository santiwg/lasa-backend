import { PaginationDto } from './pagination.dto';
import { IsOptional, IsString } from 'class-validator';

export class PaginationWithFilteringDto extends PaginationDto {
  @IsOptional()
  @IsString()
  filterType?: string='';

  @IsOptional()
  @IsString()
  filterObjectId?: number;
}