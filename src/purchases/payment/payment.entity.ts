import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, JoinColumn } from "typeorm";
import { Supplier } from "../supplier/supplier.entity";
import { PaymentMethod } from "../../shared/payment-method/payment-method.entity";
// import { Check } from "../../shared/check/check.entity";
import { PaymentDetail } from "./payment-detail.entity";

@Entity('payments')
export class Payment extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;


    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    dateTime: Date;

    @ManyToOne(() => Supplier, supplier => supplier.payments)
    supplier: Supplier;

    @ManyToOne(() => PaymentMethod, paymentMethod => paymentMethod.payments)
    paymentMethod: PaymentMethod;

    // @ManyToOne(() => Check, check => check.payments)
    // @JoinColumn()
    // check: Check;

    @OneToMany(() => PaymentDetail, paymentDetail => paymentDetail.payment)
    details: PaymentDetail[];
}
