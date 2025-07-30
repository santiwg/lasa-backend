import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Employee } from "../employee/employee.entity";

@Entity('employee-roles')
export class EmployeeRole extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({unique:true})
    name: string;

    @Column({ nullable: true ,type: 'text'})
    description: string;

}
