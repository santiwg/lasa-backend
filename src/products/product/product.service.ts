import { BadRequestException, Injectable } from '@nestjs/common';
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
                private readonly unitService: UnitService,
                private readonly ingredientService: IngredientService,
                private readonly cifService: CifService,
                private readonly employeeService: EmployeeService) { }

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
            return total + item.getSubtotal();
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
            throw new BadRequestException(`Product with ID ${id} not found`);
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
        
        /////CHEQUEAR
        /////CHEQUEAR
        /////CHEQUEAR
        
        // 1. Cargar producto existente (eager:true ya carga las relaciones)
        const existingProduct = await this.repository.findOne({
            where: { id }
        });

        if (!existingProduct) {
            throw new BadRequestException(`Product with ID ${id} not found`);
        }

        // 2. Procesar datos de actualización
        const {unitId, items, ...productData} = product;
        const unit = await this.unitService.findById(unitId);
        const recipeItems = await this.createRecipeItems(items);

        // 3. Actualizar usando Object.assign
        Object.assign(existingProduct, {
            ...productData,
            unit,
            recipeItems
        });

        // 4. Guardar (maneja relaciones automáticamente)
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
}
