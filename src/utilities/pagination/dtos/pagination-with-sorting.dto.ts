import { PaginationDto } from './pagination.dto';
import { IsOptional, IsString } from 'class-validator';

export class PaginationWithSortingDto extends PaginationDto {
  @IsOptional()
  @IsString()
  sort?: string='';

  @IsOptional()
  @IsString()
  order?: 'asc' | 'desc' ;
}