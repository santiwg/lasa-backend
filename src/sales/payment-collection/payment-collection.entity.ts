import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, JoinColumn } from "typeorm";
import { Customer } from "../customer/customer.entity";
import { PaymentMethod } from "../../shared/payment-method/payment-method.entity";
import { Check } from "../../shared/check/check.entity";
import { State } from "../../shared/state/state.entity";
import { PaymentCollectionDetail } from "./payment-collection-detail.entity";

@Entity('payment-collections')
export class PaymentCollection extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;


    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    dateTime: Date;

    @ManyToOne(() => Customer, customer => customer.paymentCollections)
    customer: Customer;

    @ManyToOne(() => PaymentMethod, paymentMethod => paymentMethod.paymentCollections)
    paymentMethod: PaymentMethod;

    @ManyToOne(() => Check, check => check.paymentCollections, {nullable:true})
    check: Check;

    @ManyToOne(() => State, state => state.paymentCollections)
    state: State;

    @OneToMany(() => PaymentCollectionDetail, paymentCollectionDetail => paymentCollectionDetail.paymentCollection)
    details: PaymentCollectionDetail[];
}
