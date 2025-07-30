import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from "typeorm";
import { Product } from "./product.entity";
import { Ingredient } from "../ingredient/ingredient.entity";

@Entity('recipe-items')
export class RecipeItem extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Product, product => product.recipeItems)
    product: Product;

    @ManyToOne(() => Ingredient, ingredient => ingredient.recipeItems)
    ingredient: Ingredient;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    quantity: number;
}
