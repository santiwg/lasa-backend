import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Check } from "../check/check.entity";

//@Entity('check-types')
//not saving it in the db for now
export class CheckType extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({unique:true})
    name: string;

    @Column({ nullable: true ,type: 'text'})
    description: string | null;

    @OneToMany(() => Check, check => check.checkType)
    checks: Check[];
}
