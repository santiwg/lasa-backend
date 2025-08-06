import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { NewProductDto } from './dtos/newProduct.dto';
import { UnitService } from 'src/shared/unit/unit.service';
import { NewRecipeItemDto } from './dtos/newRecipeItem.dto';
import { IngredientService } from '../ingredient/ingredient.service';
import { RecipeItem } from './recipe-item.entity';
import { ProductWithCosts } from 'src/products/product/dtos/productWithCost.interface';
import { CifService } from 'src/cif/cif/cif.service';
import { EmployeeService } from 'src/employees/employee/employee.service';
import { COST_CALCULATION_CONFIG } from 'src/shared/constants/business-constants';



@Injectable()
export class ProductService {
    constructor(@InjectRepository(Product) private repository: Repository<Product>,
                @InjectRepository(RecipeItem) private recipeItemRepository: Repository<RecipeItem>,
                private readonly unitService: UnitService,
                private readonly ingredientService: IngredientService,
                private readonly cifService: CifService,
                private readonly employeeService: EmployeeService) { }

    // función para calcular el subtotal de un recipe item
    private calculateRecipeItemSubtotal(item: RecipeItem | Partial<RecipeItem>): number {
        if (!item.ingredient || typeof item.quantity !== 'number') {
            throw new BadRequestException('Recipe item must have ingredient and quantity');
        }
        
        // Verificamos que el ingredient tenga unitPrice
        if (typeof item.ingredient.unitPrice !== 'number') {
            throw new BadRequestException('Ingredient must have a valid unit price');
        }
        
        return item.ingredient.unitPrice * item.quantity;
    }

    // auxiliary method to get data needed for cost calculations
    private async getCostCalculationData(product: Product): Promise<{ averageHourlyWage: number; unitaryCif: number }> {
        // obtener todos los productos para el cálculo del CIF unitario
        const allProducts = await this.repository.find();
        
        return {
            averageHourlyWage: await this.employeeService.getAverageHourlyWageByRoleName(COST_CALCULATION_CONFIG.DIRECT_LABOR_ROLE_NAME),
            unitaryCif: await this.cifService.getUnitaryCif(product, allProducts)
        };
    }

    private calculateRecipeCost(product: Product, averageHourlyWage: number, unitaryCif: number): number {
        //The product cost depends of the ingredients, the workers, and the CIF
        const ingredientsCost = product.recipeItems.reduce((total, item) => {
            return total + this.calculateRecipeItemSubtotal(item);
        }, 0);
        
        //labor cost is calculated based on the average hourly wage
        const laborCost = product.laborHoursPerRecipe * averageHourlyWage;
        const cifCost = unitaryCif * product.unitsPerRecipe;
        
        return ingredientsCost + laborCost + cifCost;
    }

    private calculateUnitCost(product: Product, averageHourlyWage: number, unitaryCif: number): number {
        const recipeCost = this.calculateRecipeCost(product, averageHourlyWage, unitaryCif);
        return recipeCost / product.unitsPerRecipe;
    }

    private async convertToProductWithCosts(product: Product): Promise<ProductWithCosts> {
        const costData = await this.getCostCalculationData(product);

        //calculate the labor cost the same way as in the costCalculation method, and divide it by the units per recipe
        //to get the unitary labor cost
        const unitaryLaborCost = (product.laborHoursPerRecipe * costData.averageHourlyWage) / product.unitsPerRecipe;

        return {
            ...product,
            unitaryCif: costData.unitaryCif,
            unitaryLaborCost,
            unitCost: this.calculateUnitCost(product, costData.averageHourlyWage, costData.unitaryCif),
            recipeCost: this.calculateRecipeCost(product, costData.averageHourlyWage, costData.unitaryCif)
        } as ProductWithCosts;
    }

    async findById(id: number): Promise<Product> {
        const product = await this.repository.findOne({
            where: { id }
        });

        if (!product) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }

        return product;
    }

    async findByIdWithCosts(id: number): Promise<ProductWithCosts> {
        const product = await this.findById(id);
        return await this.convertToProductWithCosts(product);
    }
    async updateStock(id: number, quantityChange: number): Promise<void> {
        await this.repository.increment({ id }, 'currentStock', quantityChange);
    }
    async findAll(): Promise<Product[]> {
        return await this.repository.find();
        // No necesitamos relations porque todo es eager: true
    }

    async findAllWithCosts(): Promise<ProductWithCosts[]> {
        const products = await this.findAll();
        const productsWithCosts: ProductWithCosts[] = [];
        
        for (const product of products) {
            const productWithCosts = await this.convertToProductWithCosts(product);
            productsWithCosts.push(productWithCosts);
        }
        
        return productsWithCosts;
    }
    async create(product: NewProductDto): Promise<Product> {
        const {unitId, items, ...productData} = product;
        const unit = await this.unitService.findById(unitId);
        const recipeItems = await this.createRecipeItems(items);

        const newProduct = this.repository.create({
            ...productData,
            unit,
            recipeItems //se guardarán automáticamente gracias a la opción cascade: true.
        });
        
        return await this.repository.save(newProduct);
    }
    async update(id: number, product: NewProductDto): Promise<Product> {
        // 1. Cargar producto existente
        const existingProduct = await this.repository.findOne({
            where: { id }
        });

        if (!existingProduct) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }

        // 2. Procesar datos de actualización básicos
        const {unitId, items, ...productData} = product;
        const unit = await this.unitService.findById(unitId);

        // 3. Actualizar propiedades básicas
        Object.assign(existingProduct, {
            ...productData,
            unit
        });

        // 4. Actualizar recipeItems de forma eficiente
        await this.updateRecipeItemsEfficiently(existingProduct, items);

        return await this.repository.save(existingProduct);
    }
    async updateWithCosts(id: number, product: NewProductDto): Promise<ProductWithCosts> {
        const updatedProduct = await this.update(id, product);
        return await this.convertToProductWithCosts(updatedProduct);
    }

    async createWithCosts(product: NewProductDto): Promise<ProductWithCosts> {
        const savedProduct = await this.create(product);
        return await this.convertToProductWithCosts(savedProduct);
    }
    async createRecipeItems(items: NewRecipeItemDto[]): Promise<Partial<RecipeItem>[]> {
        const recipeItems: Partial<RecipeItem>[] = [];
        
        for (const item of items) {
            const ingredient = await this.ingredientService.findById(item.ingredientId);
            recipeItems.push({
                ingredient,
                quantity: item.quantity,
                // No incluimos id ni product porque se asignarán automáticamente
            });
        }
        
        return recipeItems;
    }

    private async updateRecipeItemsEfficiently(product: Product, newItems: NewRecipeItemDto[]): Promise<void> {
        // Crear mapas para búsqueda rápida
        const newItemsMap = new Map<number, NewRecipeItemDto>();
        newItems.forEach(item => {
            newItemsMap.set(item.ingredientId, item);
        });

        const existingItemsMap = new Map<number, RecipeItem>();
        product.recipeItems.forEach(item => {
            existingItemsMap.set(item.ingredient.id, item);
        });

        // 1. Identificar items a eliminar y eliminarlos físicamente
        const itemsToDelete = product.recipeItems.filter(item => 
            !newItemsMap.has(item.ingredient.id)
        );

        if (itemsToDelete.length > 0) {
            await this.recipeItemRepository.remove(itemsToDelete);
        }

        // 2. Actualizar items existentes que se mantienen
        const updatedItems: RecipeItem[] = [];
        
        for (const existingItem of product.recipeItems) {
            const ingredientId = existingItem.ingredient.id;
            const newItemData = newItemsMap.get(ingredientId);
            
            if (newItemData) {
                // Si ya existe, actualizar cantidad del item
                existingItem.quantity = newItemData.quantity;
                updatedItems.push(existingItem);
            }
        }

        // 3. Crear nuevos items
        for (const newItem of newItems) {
            if (!existingItemsMap.has(newItem.ingredientId)) {
                // Es un nuevo ingrediente, crear RecipeItem
                const ingredient = await this.ingredientService.findById(newItem.ingredientId);
                const recipeItem = this.recipeItemRepository.create({
                    ingredient,
                    quantity: newItem.quantity,
                    product: product
                });
                updatedItems.push(recipeItem);
            }
        }

        // 4. Actualizar la colección
        product.recipeItems = updatedItems;
    }
}
