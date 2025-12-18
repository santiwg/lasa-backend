import { IsNumber, IsPositive, Min } from "class-validator";

export class NewPurchaseDetailDto {
    @IsNumber()
    @Min(1)
    ingredientId: number;
    @IsNumber()
    @IsPositive()
    quantity: number;
    @IsNumber()
    @IsPositive()
    historicalUnitPrice: number; 
    // Precio unitario histórico al momento de la compra, que dependerá del proveedor y no será necesariamente el previamente registrado en el ingrediente
}