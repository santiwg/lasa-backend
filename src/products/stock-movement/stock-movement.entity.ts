import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from "typeorm";
import { Product } from "../product/product.entity";
import { Ingredient } from "../ingredient/ingredient.entity";

@Entity('stock-movements')
export class StockMovement extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    quantity: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    dateTime: Date;

    @ManyToOne(() => Product, product => product.stockMovements)
    @JoinColumn()
    product: Product;

    @ManyToOne(() => Ingredient, ingredient => ingredient.stockMovements)
    @JoinColumn()
    ingredient: Ingredient;
}
