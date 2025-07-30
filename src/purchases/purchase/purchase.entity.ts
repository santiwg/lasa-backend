import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, JoinColumn } from "typeorm";
import { State } from "../../shared/state/state.entity";
import { Supplier } from "../supplier/supplier.entity";
import { PurchaseDetail } from "./purchase-detail.entity";
import { PaymentDetail } from "../payment/payment-detail.entity";

@Entity('purchases')
export class Purchase extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    dateTime: Date;

    @ManyToOne(() => State, state => state.purchases)
    state: State;

    @ManyToOne(() => Supplier, supplier => supplier.purchases)
    supplier: Supplier;

    @OneToMany(() => PurchaseDetail, purchaseDetail => purchaseDetail.purchase)
    details: PurchaseDetail[];

    @OneToMany(() => PaymentDetail, paymentDetail => paymentDetail.purchase)
    paymentDetails: PaymentDetail[];
}
