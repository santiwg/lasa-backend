import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from "typeorm";
import { Sale } from "./sale.entity";
import { Product } from "../../products/product/product.entity";
import { DecimalTransformer } from "../../shared/transformers/decimal.transformer";

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

    @Column({ type: 'decimal', precision: 10, scale: 2, transformer: DecimalTransformer })
    quantity: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, transformer: DecimalTransformer })
    historicalUnitPrice: number;
}
