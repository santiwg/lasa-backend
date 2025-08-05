import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn, DeleteDateColumn } from "typeorm";
import { Sale } from "../sale/sale.entity";
import { PaymentCollection } from "../payment-collection/payment-collection.entity";
import { Exclude } from "class-transformer";

@Entity('customers')
export class Customer extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({unique:true})
    businessName: string;

    @Column()
    phone: string;

    @Column()
    email: string;

    @Column({unique:true,nullable:true})
    cuit: string | null;

    @Column({unique:true,nullable:true})
    cuil: string | null;

    @OneToMany(() => Sale, sale => sale.customer)
    sales: Sale[];

    @OneToMany(() => PaymentCollection, paymentCollection => paymentCollection.customer)
    paymentCollections: PaymentCollection[];

    @Exclude()
    @DeleteDateColumn()
    deletedAt?: Date;
}
