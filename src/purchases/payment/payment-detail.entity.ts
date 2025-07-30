import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from "typeorm";
import { Payment } from "./payment.entity";
import { Purchase } from "../purchase/purchase.entity";

@Entity('payment-details')
export class PaymentDetail extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @ManyToOne(() => Payment, payment => payment.details)
    payment: Payment;

    @ManyToOne(() => Purchase, purchase => purchase.paymentDetails)
    purchase: Purchase;
}
