import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { ProductionInstance } from './production-instance.entity';
import { ProductionInstanceDetail } from './production-instance-detail.entity';
import { NewProductionInstanceDto } from './dtos/newProductionInstance.dto';
import { NewProductionInstanceDetailDto } from './dtos/newProductionInstanceDetail.dto';
import { ProductService } from '../product/product.service';
import { IngredientService } from '../ingredient/ingredient.service';
import { normalizeLocalDateTime } from 'src/utilities/dates/normalize-local-datetime';
import { PaginationWithFilteringDto } from 'src/utilities/pagination/dtos/pagination-with-filters.dto';
import { PaginationDto } from 'src/utilities/pagination/dtos/pagination.dto';
import { PaginatedResponseDto } from 'src/utilities/pagination/dtos/paginated-response.dto';
import { PaginationService } from 'src/utilities/pagination/pagination.service';

@Injectable()
export class ProductionInstanceService {
    constructor(
        @InjectRepository(ProductionInstance) private readonly repository: Repository<ProductionInstance>,
        @InjectRepository(ProductionInstanceDetail) private readonly detailRepository: Repository<ProductionInstanceDetail>,
        private readonly productService: ProductService,
        private readonly ingredientService: IngredientService,
        private readonly paginationService: PaginationService,
    ) { }

    private getRelations(): string[] {
        return [
            'details',
            'details.product',
            'details.product.unit',
            'details.product.recipeItems',
            'details.product.recipeItems.ingredient',
        ];
    }

    private getOrder() {
        return {
            dateTime: 'DESC' as const,
            id: 'DESC' as const,
        };
    }

    private async findByIdWithRelations(id: number, manager?: EntityManager): Promise<ProductionInstance> {
        const repo = manager ? manager.getRepository(ProductionInstance) : this.repository;

        const instance = await repo.findOne({
            where: { id },
            relations: this.getRelations(),
            order: this.getOrder(),
        });

        if (!instance) {
            throw new NotFoundException(`ProductionInstance with ID ${id} not found`);
        }

        return instance;
    }

    async findAll(paginationWithFiltering: PaginationWithFilteringDto): Promise<PaginatedResponseDto<ProductionInstance>> {
        const { page, quantity, filterType, filterObjectId } = paginationWithFiltering;
        const pagination: PaginationDto = { page, quantity };

        const options = this.paginationService.getPaginationOptions(pagination, {
            relations: this.getRelations(),
            order: this.getOrder(),
        });

        switch (filterType) {
            case '':
            case undefined:
            case null:
                break;
            case 'product': {
                if (filterObjectId === undefined || filterObjectId === null) {
                    throw new BadRequestException('filterObjectId is required when filtering by product');
                }

                await this.productService.findById(filterObjectId); // validate existence

                // Why this 2-step filter?
                // - We need: "production instances that included product X".
                // - Filtering by a OneToMany relation (ProductionInstance.details) with plain find options
                //   is not always reliable / supported without joins.
                // - Also, ProductionInstance.details is eager, so loading ProductionInstance entities while
                //   discovering IDs would be unnecessarily heavy.
                //
                // So we first read matching ProductionInstanceDetail rows and ask TypeORM to give us only
                // the productionInstance ID (loadRelationIds). Then we filter ProductionInstance with In(ids)
                // and load the full relations only once in the final findAndCount.
                const detailRows = await this.detailRepository.find({
                    where: { product: { id: filterObjectId } },
                    loadRelationIds: { relations: ['productionInstance'] },
                });

                const ids = [...new Set(
                    detailRows
                        .map(d => d.productionInstance as unknown as number | null | undefined)
                        .filter((v): v is number => typeof v === 'number'),
                )];

                if (ids.length === 0) {
                    return this.paginationService.createPaginatedResponse([], 0, pagination);
                }

                options.where = { id: In(ids) };
                break;
            }
            default:
                throw new BadRequestException('Invalid sort parameter');
        }

        const [data, total] = await this.repository.findAndCount(options);
        return this.paginationService.createPaginatedResponse(data, total, pagination);
    }

    private async createDetails(
        detailDtos: NewProductionInstanceDetailDto[],
        manager: EntityManager,
    ): Promise<ProductionInstanceDetail[]> {
        // `detailPromises` is an array (Promise<ProductionInstanceDetail>[]), not a function.
        // Because the map callback is `async`, each iteration returns a Promise.
        // `Promise.all(detailPromises)` waits for all of them concurrently and returns the created
        // details in the same order as `detailDtos`.
        const detailPromises = detailDtos.map(async (d) => {
            const productWithCosts = await this.productService.findByIdWithCosts(d.productId);
            const unitCost = productWithCosts.unitCost;

            return manager.create(ProductionInstanceDetail, {
                // TypeORM only needs the PK to persist the relation, and we also keep the loaded
                // recipeItems on the object for stock calculations.
                product: productWithCosts as any,
                quantity: d.quantity,
                unitCost,
            });
        });

        return await Promise.all(detailPromises);
    }

    private async updateStocksFromDetails(
        details: ProductionInstanceDetail[],
        manager: EntityManager,
        direction: 1 | -1 = 1,
    ): Promise<void> {
        // direction = 1 applies the production effect (increase product stock, consume ingredients).
        // direction = -1 reverts the production effect (decrease product stock, restore ingredients).
        // Primero acumulamos totales por producto/ingrediente; después aplicamos los deltas de stock.
        const producedByProductId = new Map<number, number>();
        const consumedByIngredientId = new Map<number, number>();

        for (const detail of details) {
            // Cada detalle representa “se produjeron N unidades del producto X”.
            const product = detail.product;
            if (!product) {
                // Sin producto no se puede calcular ni revertir stock de forma segura.
                throw new BadRequestException('ProductionInstanceDetail is missing its product relation');
            }

            const unitsPerRecipe = Number(product.unitsPerRecipe);
            if (!Number.isFinite(unitsPerRecipe) || unitsPerRecipe <= 0) {
                // Necesitamos unitsPerRecipe para traducir “unidades producidas” a “veces de receta”.
                throw new BadRequestException(`Product with ID ${product.id} has an invalid unitsPerRecipe`);
            }

            const producedQuantity = Number(detail.quantity);
            if (!Number.isFinite(producedQuantity) || producedQuantity <= 0) {
                throw new BadRequestException(`Invalid production quantity for product with ID ${product.id}`);
            }

            // Acumulamos cuántas unidades finales del producto se producen (puede repetirse el producto en varios detalles).
            producedByProductId.set(
                product.id,
                (producedByProductId.get(product.id) ?? 0) + producedQuantity,
            );

            // Convertimos unidades producidas a “multiplicador de receta” (p.ej. si unitsPerRecipe=10 y quantity=20 => 2 recetas).
            const recipesMultiplier = producedQuantity / unitsPerRecipe;
            for (const item of product.recipeItems ?? []) {
                // Cada recipeItem indica cuánto ingrediente se consume por 1 receta.
                const ingredientId = item.ingredient?.id;
                if (!ingredientId) {
                    // Si el item no tiene ingrediente asociado, no hay nada que descontar.
                    continue;
                }
                const perRecipeQuantity = Number(item.quantity);
                if (!Number.isFinite(perRecipeQuantity) || perRecipeQuantity < 0) {
                    throw new BadRequestException(`Invalid recipe item quantity for product with ID ${product.id}`);
                }
                // Consumo total del ingrediente = consumo por receta * multiplicador de receta.
                const consumed = perRecipeQuantity * recipesMultiplier;
                // Acumulamos el consumo por ingrediente (puede aparecer en distintas recetas/productos).
                consumedByIngredientId.set(ingredientId, (consumedByIngredientId.get(ingredientId) ?? 0) + consumed);
            }
        }

        for (const [productId, quantity] of producedByProductId.entries()) {
            // Aplicamos stock de productos: direction=1 suma; direction=-1 resta (reversión en delete).
            await this.productService.updateStock(productId, quantity * direction, manager);
        }

        for (const [ingredientId, quantity] of consumedByIngredientId.entries()) {
            // Aplicamos stock de ingredientes: en producción se consumen (delta negativo); al revertir se restauran.
            await this.ingredientService.updateStock(ingredientId, -quantity * direction, manager);
        }
    }

    async create(dto: NewProductionInstanceDto): Promise<ProductionInstance> {
        return this.repository.manager.transaction(async manager => {
            const instanceRepo = manager.getRepository(ProductionInstance);

            if (!dto.details?.length) {
                throw new BadRequestException('ProductionInstance must have at least one detail');
            }


            const normalizedDateTime = normalizeLocalDateTime(dto.dateTime);
            const details = await this.createDetails(dto.details, manager);

            const instance = instanceRepo.create({
                dateTime: normalizedDateTime,
                details,
            });

            const saved = await instanceRepo.save(instance);

            await this.updateStocksFromDetails(details, manager);

            return this.findByIdWithRelations(saved.id, manager); //para que venga con las relaciones
        });
    }

    async delete(id: number): Promise<{ message: string }> {
        await this.repository.manager.transaction(async manager => {
            const instanceRepo = manager.getRepository(ProductionInstance);

            const detailRepo = manager.getRepository(ProductionInstanceDetail);

            const instance = await this.findByIdWithRelations(id, manager);

            // Load details explicitly with the relations needed for stock calculations.
            // This avoids relying on nested eager loading when running inside transactions/tests.
            const details = await detailRepo.find({
                where: { productionInstance: { id } },
                relations: [
                    'product',
                    'product.unit',
                    'product.recipeItems',
                    'product.recipeItems.ingredient',
                ],
            });


            // Revert the stock effects of production.
            await this.updateStocksFromDetails(details, manager, -1);

            await instanceRepo.softRemove(instance);
        });

        return { message: `ProductionInstance with ID ${id} deleted successfully` };
    }
}
