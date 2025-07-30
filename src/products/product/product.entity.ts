import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, JoinColumn } from "typeorm";
import { StockMovement } from "../stock-movement/stock-movement.entity";
import { RecipeItem } from "./recipe-item.entity";
import { SaleDetail } from "../../sales/sale/sale-detail.entity";
import { ProductionInstanceDetail } from "../production-instance/production-instance-detail.entity";
import { Unit } from "../unit/unit.entity";

@Entity('products')
export class Product extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({unique:true})
    name: string;

    @ManyToOne(() => Unit)
    unit: Unit;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    currentStock: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    unitsPerRecipe: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    expectedKilosPerMonth: number;

    @Column({ type: 'enum', enum: [1, 1.5, 2], default: 1 })
    complexityFactor: 1 | 1.5 | 2;

    @OneToMany(() => StockMovement, stockMovement => stockMovement.product)
    stockMovements: StockMovement[];

    @OneToMany(() => RecipeItem, recipeItem => recipeItem.product)
    recipeItems: RecipeItem[];

    @OneToMany(() => SaleDetail, saleDetail => saleDetail.product)
    saleDetails: SaleDetail[];

    @OneToMany(() => ProductionInstanceDetail, productionInstanceDetail => productionInstanceDetail.product)
    productionInstanceDetails: ProductionInstanceDetail[];
}
