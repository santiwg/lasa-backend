import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn, DeleteDateColumn } from "typeorm";
import { Branch } from "../branch/branch.entity";
import { Exclude } from "class-transformer";

@Entity('bakerys')
export class Bakery extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({unique:true})
    name: string;

    @OneToMany(() => Branch, branch => branch.bakery)
    branches: Branch[];

    @Exclude()
    @DeleteDateColumn()
    deletedAt?: Date;
}
