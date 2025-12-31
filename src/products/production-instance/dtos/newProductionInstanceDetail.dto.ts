import { IsNumber, IsPositive, Min } from 'class-validator';

export class NewProductionInstanceDetailDto {
  @IsNumber()
  @Min(1)
  productId: number;

  @IsNumber()
  @IsPositive()
  quantity: number;

  // `unitCost` is always calculated by the backend from the current costs.
}
