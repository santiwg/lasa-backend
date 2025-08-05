import { RecipeItem } from "../recipe-item.entity";

export interface ProductWithCosts {
    id: number;
    name: string;
    unit: any;
    currentStock: number;
    unitsPerRecipe: number;
    laborHoursPerRecipe: number;
    price: number;
    expectedKilosPerMonth: number;
    complexityFactor: any;
    recipeItems: RecipeItem[];
    unitaryCif: number;
    unitaryLaborCost: number;
    unitCost: number;
    recipeCost: number;
}