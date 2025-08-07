import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from "typeorm";
import { Purchase } from "./purchase.entity";
import { Ingredient } from "../../products/ingredient/ingredient.entity";
import { DecimalTransformer } from "../../shared/transformers/decimal.transformer";

@Entity('purchase-details')
export class PurchaseDetail extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Purchase, purchase => purchase.details)
    purchase: Purchase;

    @ManyToOne(() => Ingredient, ingredient => ingredient.purchaseDetails)
    ingredient: Ingredient;

    @Column({ type: 'decimal', precision: 10, scale: 2, transformer: DecimalTransformer })
    quantity: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, transformer: DecimalTransformer })
    historicalUnitPrice: number;
}
