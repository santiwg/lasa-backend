import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, JoinColumn, DeleteDateColumn } from "typeorm";
import { Exclude } from "class-transformer";
import { StockMovement } from "../stock-movement/stock-movement.entity";
import { RecipeItem } from "../product/recipe-item.entity";
import { PurchaseDetail } from "../../purchases/purchase/purchase-detail.entity";
import { Unit } from "../../shared/unit/unit.entity";

@Entity('ingredients')
export class Ingredient extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({unique:true})
    name: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    unitPrice: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
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
