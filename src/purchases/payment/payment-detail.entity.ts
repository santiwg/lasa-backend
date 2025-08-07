import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from "typeorm";
import { Payment } from "./payment.entity";
import { Purchase } from "../purchase/purchase.entity";
import { DecimalTransformer } from "../../shared/transformers/decimal.transformer";

@Entity('payment-details')
export class PaymentDetail extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, transformer: DecimalTransformer })
    amount: number;

    @ManyToOne(() => Payment, payment => payment.details)
    payment: Payment;

    @ManyToOne(() => Purchase, purchase => purchase.paymentDetails)
    purchase: Purchase;
}
