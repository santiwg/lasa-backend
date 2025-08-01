import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from "typeorm";
import { CostType } from "../cost-type/cost-type.entity";
import { Unit } from "../../shared/unit/unit.entity";

@Entity('cifs')
export class Cif extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => CostType, costType => costType.cifs)
    costType: CostType;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    dateTime: Date;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    quantity: number;

    @ManyToOne(() => Unit)
    unit: Unit;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    unitPrice: number;
}
