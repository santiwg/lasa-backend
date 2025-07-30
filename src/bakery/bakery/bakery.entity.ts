import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Branch } from "../branch/branch.entity";

@Entity('bakerys')
export class Bakery extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({unique:true})
    name: string;

    @OneToMany(() => Branch, branch => branch.bakery)
    branches: Branch[];
}
