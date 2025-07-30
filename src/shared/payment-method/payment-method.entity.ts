import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('payment-methods')
export class PaymentMethod extends BaseEntity {
}
