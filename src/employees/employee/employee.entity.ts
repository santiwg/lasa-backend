import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from "typeorm";
import { EmployeeRole } from "../employee-role/employee-role.entity";

@Entity('employees')
export class Employee extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    email: string;
    
    @Column()
    lastName: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    hourlyWage: number;

    @ManyToOne(() => EmployeeRole)
    role:EmployeeRole

    @Column()
    phoneNumber: string;
    
    @Column({ nullable: true })
    cuit: string;

    @Column({ nullable: true })
    cuil: string;
}
