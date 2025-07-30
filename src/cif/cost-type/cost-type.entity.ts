import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Cif } from "../cif/cif.entity";

@Entity('cost-types')
export class CostType extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({unique:true})
    name: string;

    @Column({ nullable: true ,type: 'text'})
    description: string;

    @OneToMany(() => Cif, cif => cif.costType)
    cifs: Cif[];
}
