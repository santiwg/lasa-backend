import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, JoinColumn, DeleteDateColumn } from "typeorm";
import { Supplier } from "../supplier/supplier.entity";
import { PaymentMethod } from "../../shared/payment-method/payment-method.entity";
// import { Check } from "../../shared/check/check.entity";
import { PaymentDetail } from "./payment-detail.entity";
import { Exclude } from "class-transformer";
import { DecimalTransformer } from "src/utilities/transformers/decimal.transformer";

@Entity('payments')
export class Payment extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, transformer: DecimalTransformer , default:0})
    unassignedAmount:number; 
    //this property represents the amount that is not assigned to any purchase yet 
    //it is used when the paidAmount is greater than what is owed to supplier.
    //more explanation in documentation.

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    dateTime: Date;

    @ManyToOne(() => Supplier, supplier => supplier.payments)
    supplier: Supplier;

    @ManyToOne(() => PaymentMethod, paymentMethod => paymentMethod.payments)
    paymentMethod: PaymentMethod;

    // @ManyToOne(() => Check, check => check.payments)
    // @JoinColumn()
    // check: Check;

    @OneToMany(() => PaymentDetail, paymentDetail => paymentDetail.payment, { cascade: true})
    details: PaymentDetail[];

    @Exclude()
    @DeleteDateColumn()
    deletedAt?: Date;
}
