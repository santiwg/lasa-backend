import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, JoinColumn } from "typeorm";
import { CheckType } from "../check-type/check-type.entity";
import { State } from "../state/state.entity";
import { Payment } from "../../purchases/payment/payment.entity";
import { PaymentCollection } from "../../sales/payment-collection/payment-collection.entity";

//@Entity('checks')
//for now I don't save the check in the database
export abstract class Check extends BaseEntity { //not finished
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    holder: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @ManyToOne(() => CheckType, checkType => checkType.checks)
    checkType: CheckType;

    @Column({ type: 'date' })
    issueDate: Date;

    @Column({ type: 'date' })
    collectionDate: Date;

    @ManyToOne(() => State, state => state.checks)
    state: State;

    @OneToMany(() => Payment, payment => payment.check)
    payments: Payment[];

    @OneToMany(() => PaymentCollection, paymentCollection => paymentCollection.check)
    paymentCollections: PaymentCollection[];
}
