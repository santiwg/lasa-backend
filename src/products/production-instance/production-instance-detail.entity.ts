import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from "typeorm";
import { ProductionInstance } from "./production-instance.entity";
import { Product } from "../product/product.entity";
import { DecimalTransformer } from "../../shared/transformers/decimal.transformer";

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

    @Column({ type: 'decimal', precision: 10, scale: 2, transformer: DecimalTransformer })
    quantity: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, transformer: DecimalTransformer })
    unitCost: number; //cost at the time of production
}
