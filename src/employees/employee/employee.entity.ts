import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('employees')
export class Employee extends BaseEntity {
}
