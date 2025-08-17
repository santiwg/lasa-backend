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
        //uso uno transacción para la actualización del atributo stock en la unidad y el movimiento
        return await this.repository.manager.transaction(async manager => {
        // Validación de negocio
        this.validateExactlyOneId(newStockMovement);

        let product: Product | null = null;
        let ingredient: Ingredient | null = null;

        if (newStockMovement.productId) {
            product = await this.productService.findById(newStockMovement.productId);
            await this.productService.updateStock(product.id, newStockMovement.quantity, manager);
        }

        if (newStockMovement.ingredientId) {
            ingredient = await this.ingredientService.findById(newStockMovement.ingredientId);
            await this.ingredientService.updateStock(ingredient.id, newStockMovement.quantity, manager);
        }

        const { productId, ingredientId, ...stockMovementData } = newStockMovement;

        const stockMovement = manager.create(StockMovement, {
            ...stockMovementData,
            product,
            ingredient
        });

        return await manager.save(stockMovement);
    });
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
