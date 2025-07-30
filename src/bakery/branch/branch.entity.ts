import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, JoinColumn } from "typeorm";
import { Bakery } from "../bakery/bakery.entity";
import { Sale } from "../../sales/sale/sale.entity";

@Entity('branchs')
export class Branch extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({unique:true})
    name: string;

    @ManyToOne(() => Bakery, bakery => bakery.branches)
    bakery: Bakery;

    @OneToMany(() => Sale, sale => sale.branch)
    sales: Sale[];
}
