import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ProductionInstanceDetail } from "./production-instance-detail.entity";

@Entity('production-instances')
export class ProductionInstance extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    dateTime: Date;

    @OneToMany(() => ProductionInstanceDetail, productionInstanceDetail => productionInstanceDetail.productionInstance, { cascade: true, eager: true })
    details: ProductionInstanceDetail[];
}
