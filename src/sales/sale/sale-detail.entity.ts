import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from "typeorm";
import { Sale } from "./sale.entity";
import { Product } from "../../products/product/product.entity";

@Entity('sale-details')
export class SaleDetail extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Sale, sale => sale.details)
    @JoinColumn()
    sale: Sale;

    @ManyToOne(() => Product, product => product.saleDetails)
    @JoinColumn()
    product: Product;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    quantity: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    historicalUnitPrice: number;
}
