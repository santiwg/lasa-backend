import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsDate, IsOptional, ValidateNested } from 'class-validator';
import { IsNotFutureDate } from 'src/utilities/validators/is-not-future-date.validator';
import { NewProductionInstanceDetailDto } from './newProductionInstanceDetail.dto';

export class NewProductionInstanceDto {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @IsNotFutureDate()
  dateTime?: Date;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => NewProductionInstanceDetailDto)
  details: NewProductionInstanceDetailDto[];
}
