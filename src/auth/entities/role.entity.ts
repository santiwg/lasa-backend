import { BaseEntity, Entity, PrimaryGeneratedColumn, Index, Column, ManyToMany, JoinTable, OneToMany  } from "typeorm";
import { PermissionEntity } from "./permission.entity";
import { UserEntity } from "./user.entity";

@Entity('roles')
export class RoleEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Index({unique:true})
    @Column()
    name: string;

    @ManyToMany(() => PermissionEntity, permission => permission.roles,{ eager: true })
    @JoinTable()
    permissions: PermissionEntity[];

    @OneToMany(() => UserEntity, user => user.role)
    users: UserEntity[]
}