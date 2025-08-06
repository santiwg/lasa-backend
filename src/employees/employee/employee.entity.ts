import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn, DeleteDateColumn } from "typeorm";
import { EmployeeRole } from "../employee-role/employee-role.entity";
import { Exclude } from "class-transformer";
import { DecimalTransformer } from "../../shared/transformers/decimal.transformer";

@Entity('employees')
export class Employee extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    email: string; //I don´t add unique because I think it will be unnecessary and may affect performance a little
    
    @Column()
    lastName: string;

    @Column({ 
        type: 'decimal', 
        precision: 10, 
        scale: 2,
        transformer: DecimalTransformer
    })
    hourlyWage: number;

    @Column({ default: true })
    isActive: boolean;

    @ManyToOne(() => EmployeeRole,{eager: true})
    role:EmployeeRole

    @Column()
    phoneNumber: string;
    
    @Column({type: 'varchar', nullable: true, unique: true})
    cuit: string | null;

    @Column({type: 'varchar', nullable: true, unique: true})
    cuil: string | null;

    @Exclude()
    @DeleteDateColumn()
    deletedAt?: Date;
}
