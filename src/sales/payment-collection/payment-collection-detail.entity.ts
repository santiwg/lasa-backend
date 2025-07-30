import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from "typeorm";
import { PaymentCollection } from "./payment-collection.entity";
import { Sale } from "../sale/sale.entity";

@Entity('payment-collection-details')
export class PaymentCollectionDetail extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @ManyToOne(() => PaymentCollection, paymentCollection => paymentCollection.details)
    paymentCollection: PaymentCollection;

    @ManyToOne(() => Sale, sale => sale.paymentCollectionDetails)
    sale: Sale;
}
