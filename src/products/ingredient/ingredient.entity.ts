import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, JoinColumn, DeleteDateColumn } from "typeorm";
import { Exclude } from "class-transformer";
import { StockMovement } from "../stock-movement/stock-movement.entity";
import { RecipeItem } from "../product/recipe-item.entity";
import { PurchaseDetail } from "../../purchases/purchase/purchase-detail.entity";
import { Unit } from "../../shared/unit/unit.entity";
import { DecimalTransformer } from "../../shared/transformers/decimal.transformer";

@Entity('ingredients')
export class Ingredient extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({unique:true})
    name: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, transformer: DecimalTransformer })
    unitPrice: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, transformer: DecimalTransformer })
    currentStock: number;

    @ManyToOne(() => Unit, { eager: true })
    unit: Unit;

    @OneToMany(() => StockMovement, stockMovement => stockMovement.ingredient)
    stockMovements: StockMovement[];

    @OneToMany(() => RecipeItem, recipeItem => recipeItem.ingredient)
    recipeItems: RecipeItem[];

    @OneToMany(() => PurchaseDetail, purchaseDetail => purchaseDetail.ingredient)
    purchaseDetails: PurchaseDetail[];

    @Exclude()
    @DeleteDateColumn()
    deletedAt?: Date;
}
