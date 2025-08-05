import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, JoinColumn, DeleteDateColumn } from "typeorm";
import { StockMovement } from "../stock-movement/stock-movement.entity";
import { RecipeItem } from "./recipe-item.entity";
import { SaleDetail } from "../../sales/sale/sale-detail.entity";
import { ProductionInstanceDetail } from "../production-instance/production-instance-detail.entity";
import { Unit } from "../../shared/unit/unit.entity";
import { Exclude } from "class-transformer";

export enum ComplexityFactor {
    SIMPLE = 1,
    MEDIUM = 1.5,
    COMPLEX = 2
}

@Entity('products')
export class Product extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({unique:true})
    name: string;

    @ManyToOne(() => Unit,{eager: true})
    unit: Unit;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    currentStock: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    unitsPerRecipe: number;

    @Column({ type: 'decimal', precision: 8, scale: 2 })
    laborHoursPerRecipe: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    expectedKilosPerMonth: number;

    @Column({ type: 'enum', enum: ComplexityFactor, default: ComplexityFactor.SIMPLE })
    complexityFactor: ComplexityFactor;

    @OneToMany(() => StockMovement, stockMovement => stockMovement.product)
    stockMovements: StockMovement[];

    @OneToMany(() => RecipeItem, recipeItem => recipeItem.product, { cascade: true, eager: true })
    recipeItems: RecipeItem[];

    @OneToMany(() => SaleDetail, saleDetail => saleDetail.product)
    saleDetails: SaleDetail[];

    @OneToMany(() => ProductionInstanceDetail, productionInstanceDetail => productionInstanceDetail.product)
    productionInstanceDetails: ProductionInstanceDetail[];

    @Exclude()
    @DeleteDateColumn()
    deletedAt?: Date;
}
