import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Check } from "../check/check.entity";

@Entity('check-types')
export class CheckType extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({unique:true})
    name: string;

    @Column({ nullable: true ,type: 'text'})
    description: string;

    @OneToMany(() => Check, check => check.checkType)
    checks: Check[];
}
