import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, JoinColumn, DeleteDateColumn } from "typeorm";
import { State } from "../../shared/state/state.entity";
import { Branch } from "../../bakery/branch/branch.entity";
import { Customer } from "../customer/customer.entity";
import { SaleDetail } from "./sale-detail.entity";
import { PaymentCollectionDetail } from "../payment-collection/payment-collection-detail.entity";
import { Exclude } from "class-transformer";

@Entity('sales')
export class Sale extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    dateTime: Date;

    @ManyToOne(() => State, state => state.sales)
    state: State;

    @ManyToOne(() => Branch, branch => branch.sales)
    branch: Branch;

    @ManyToOne(() => Customer, customer => customer.sales)
    customer: Customer;

    @OneToMany(() => SaleDetail, saleDetail => saleDetail.sale, { cascade: true, eager: true })
    details: SaleDetail[];

    @OneToMany(() => PaymentCollectionDetail, paymentCollectionDetail => paymentCollectionDetail.sale)
    paymentCollectionDetails: PaymentCollectionDetail[];

    @Exclude()
    @DeleteDateColumn()
    deletedAt?: Date;
}
