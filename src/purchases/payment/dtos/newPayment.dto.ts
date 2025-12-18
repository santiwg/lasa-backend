import {  IsDate, IsNumber, IsOptional, IsPositive } from "class-validator";

export class NewPaymentDto {  
        @IsDate()
        @IsOptional()    
        dateTime: Date|null;
    
        @IsNumber()
        @IsPositive()
        supplierId: number;

        @IsNumber()
        @IsPositive()
        paidAmount: number;
    
        @IsNumber()
        @IsPositive()
        paymentMethodId: number;
    
    
        //"unassignedAmount" and "details" are not something the user sends;
        //the business logic defines them based on previous not fully payed purchases
    
}