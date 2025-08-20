import { BaseEntity, Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { RoleEntity } from './role.entity';

@Entity('users')
export class UserEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({unique:true})
  @Column()
  email: string;

  @Column()
  password: string;
  
  //mas adelante tendria que sacarle lo de null
  @ManyToOne(() => RoleEntity, role => role.users,{ eager: true ,nullable:true})
  role: RoleEntity;
}
