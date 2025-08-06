import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockMovement } from './stock-movement.entity';
import { NewStockMovementDto } from './dtos/newStockMovement.dto';
import { ProductService } from '../product/product.service';
import { IngredientService } from '../ingredient/ingredient.service';
import { Product } from '../product/product.entity';
import { Ingredient } from '../ingredient/ingredient.entity';

@Injectable()
export class StockMovementService {
    constructor(
        @InjectRepository(StockMovement) private readonly repository: Repository<StockMovement>,
        private readonly productService: ProductService,
        private readonly ingredientService: IngredientService
    ) { }

    async create(newStockMovement: NewStockMovementDto): Promise<StockMovement> {
        // Validación de negocio: exactamente uno de los IDs debe estar presente
        this.validateExactlyOneId(newStockMovement);

        // Fetch the actual entity based on which ID was provided using services
        let product: Product | null = null;
        let ingredient: Ingredient | null = null;

        if (newStockMovement.productId) {
            product = await this.productService.findById(newStockMovement.productId);
        }

        if (newStockMovement.ingredientId) {
            ingredient = await this.ingredientService.findById(newStockMovement.ingredientId);
        }

        // Destructure to remove ID attributes
        const { productId, ingredientId, ...stockMovementData } = newStockMovement;

        const stockMovement = this.repository.create({
            ...stockMovementData,
            product,
            ingredient
        });

        const savedStockMovement = await this.repository.save(stockMovement);

        //Update the stock attribute for the product or ingredient
        if (product) {
            await this.productService.updateStock(product.id, newStockMovement.quantity);
        }
        if (ingredient) {
            await this.ingredientService.updateStock(ingredient.id, newStockMovement.quantity);
        }
        return savedStockMovement;
    }

    private validateExactlyOneId(dto: NewStockMovementDto): void {
        //when a stock movement is registered, this will be for either a product or an ingredient
        //but not both, so we check that exactly one of productId or ingredientId is provided

        const hasProductId = dto.productId !== undefined && dto.productId !== null;
        const hasIngredientId = dto.ingredientId !== undefined && dto.ingredientId !== null;

        if (hasProductId === hasIngredientId) {
            throw new BadRequestException(
                'Exactly one of productId or ingredientId must be provided'
            );
        }
    }

    async findAll(): Promise<StockMovement[]> {
        return await this.repository.find({
            relations: ['product', 'ingredient']
        });
    }

    async findById(id: number): Promise<StockMovement> {
        const stockMovement = await this.repository.findOne({
            where: { id },
            relations: ['product', 'ingredient']
        });

        if (!stockMovement) {
            throw new NotFoundException(`Stock movement with ID ${id} not found`);
        }

        return stockMovement;
    }
}
