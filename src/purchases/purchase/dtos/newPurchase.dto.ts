import { ArrayNotEmpty, IsArray, IsDate, IsNumber, IsOptional, IsPositive, Min, ValidateNested } from "class-validator";
import { NewPurchaseDetailDto } from "./newPurchaseDetail.dto";
import { Type } from "class-transformer";
import { CoDependentProperties } from "src/utilities/validators/co-dependent-properties-validator";

@CoDependentProperties([
    { anyOf: ['paidAmount'], required: ['paymentMethodId'] }
], {
    message: 'paymentMethodId is required when paidAmount is provided'
})
export class NewPurchaseDto {
    
    @IsNumber()
    @IsPositive()
    supplierId: number;
    
    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => NewPurchaseDetailDto)
    details: NewPurchaseDetailDto[];
    
    @IsDate()
    @IsOptional()
    dateTime: Date|null;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    paidAmount: number|null;

    @IsNumber()
    @Min(1)
    @IsOptional()
    paymentMethodId: number|null;
}
