import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, JoinColumn } from "typeorm";
import { Purchase } from "../purchase/purchase.entity";
import { Payment } from "../payment/payment.entity";
import { State } from "../../shared/state/state.entity";

@Entity('suppliers')
export class Supplier extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({unique:true})
    businessName: string;

    @Column()
    phone: string;

    @Column()
    email: string;

    @Column({unique:true,nullable:true})
    cuit: string;

    @Column({unique:true,nullable:true})
    cuil: string;

    @OneToMany(() => Purchase, purchase => purchase.supplier)
    purchases: Purchase[];

    @OneToMany(() => Payment, payment => payment.supplier)
    payments: Payment[];
}
