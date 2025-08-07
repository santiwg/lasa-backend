import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn, DeleteDateColumn } from "typeorm";
import { CostType } from "../cost-type/cost-type.entity";
import { Unit } from "../../shared/unit/unit.entity";
import { Exclude } from "class-transformer";
import { DecimalTransformer } from "../../shared/transformers/decimal.transformer";

@Entity('cifs')
export class Cif extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => CostType, costType => costType.cifs, { eager: true })
    costType: CostType;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    dateTime: Date;

    @Column({ type: 'decimal', precision: 10, scale: 2, transformer: DecimalTransformer })
    quantity: number;

    @ManyToOne(() => Unit, { eager: true })
    unit: Unit;

    @Column({ type: 'decimal', precision: 10, scale: 2, transformer: DecimalTransformer })
    unitPrice: number;

    @Exclude()
    @DeleteDateColumn()
    deletedAt?: Date;
}
