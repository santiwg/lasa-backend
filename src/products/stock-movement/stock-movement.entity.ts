import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn, DeleteDateColumn } from "typeorm";
import { Product } from "../product/product.entity";
import { Ingredient } from "../ingredient/ingredient.entity";
import { Exclude } from "class-transformer";
import { DecimalTransformer } from "../../shared/transformers/decimal.transformer";

@Entity('stock-movements')
export class StockMovement extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, transformer: DecimalTransformer })
    quantity: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    dateTime: Date;

    @ManyToOne(() => Product, product => product.stockMovements, { nullable: true })
    @JoinColumn()
    product: Product | null;

    @Column({ nullable: true ,type:'text'})
    description: string | null;

    @ManyToOne(() => Ingredient, ingredient => ingredient.stockMovements, { nullable: true })
    @JoinColumn()
    ingredient: Ingredient | null;

    @Exclude()
    @DeleteDateColumn()
    deletedAt?: Date;
}
