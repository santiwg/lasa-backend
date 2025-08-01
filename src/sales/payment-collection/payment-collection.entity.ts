import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, JoinColumn } from "typeorm";
import { Customer } from "../customer/customer.entity";
import { PaymentMethod } from "../../shared/payment-method/payment-method.entity";
// import { Check } from "../../shared/check/check.entity";
import { PaymentCollectionDetail } from "./payment-collection-detail.entity";

@Entity('payment-collections')
export class PaymentCollection extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    collectionNumber: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    dateTime: Date;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @ManyToOne(() => Customer, customer => customer.paymentCollections)
    @JoinColumn()
    customer: Customer;

    @ManyToOne(() => PaymentMethod, paymentMethod => paymentMethod.paymentCollections)
    @JoinColumn()
    paymentMethod: PaymentMethod;

    // @ManyToOne(() => Check, check => check.paymentCollections, {nullable:true})
    // @JoinColumn()
    // check: Check;



    @OneToMany(() => PaymentCollectionDetail, paymentCollectionDetail => paymentCollectionDetail.paymentCollection,{ cascade: true, eager: true })
    details: PaymentCollectionDetail[];
}
