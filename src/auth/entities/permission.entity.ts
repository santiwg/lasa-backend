import { BaseEntity, Entity, Index, ManyToMany, PrimaryGeneratedColumn, Column } from "typeorm";
import { RoleEntity } from "./role.entity";


@Entity('permissions')
export class PermissionEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;
    
    @Index({unique:true})
    @Column()
    name: string;

    @ManyToMany(() => RoleEntity, role => role.permissions)
    roles: RoleEntity[]
}

