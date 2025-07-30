import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from "typeorm";
import { ProductionInstance } from "./production-instance.entity";
import { Product } from "../product/product.entity";

@Entity('production-instance-details')
export class ProductionInstanceDetail extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => ProductionInstance, productionInstance => productionInstance.details)
    @JoinColumn()
    productionInstance: ProductionInstance;

    @ManyToOne(() => Product, product => product.productionInstanceDetails)
    @JoinColumn()
    product: Product;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    quantity: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    unitCost: number; //cost at the time of production
}
