import { BadRequestException, Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Purchase } from './purchase.entity';
import { NewPurchaseDto } from './dtos/newPurchase.dto';
import { PaginationWithFilteringDto } from 'src/utilities/pagination/dtos/pagination-with-filters.dto';
import { PaginationDto } from 'src/utilities/pagination/dtos/pagination.dto';
import { PaginationService } from 'src/utilities/pagination/pagination.service';
import { PaginatedResponseDto } from 'src/utilities/pagination/dtos/paginated-response.dto';
import { SupplierService } from '../supplier/supplier.service';
import { PaymentService } from '../payment/payment.service';
import { PurchaseDetail } from './purchase-detail.entity';
import { NewPurchaseDetailDto } from './dtos/newPurchaseDetail.dto';
import { IngredientService } from 'src/products/ingredient/ingredient.service';
import { State } from 'src/shared/state/state.entity';
import { StateService } from 'src/shared/state/state.service';

@Injectable()
export class PurchaseService {
    constructor(
        private stateService: StateService,
        private ingredientService: IngredientService,
        @Inject(forwardRef(() => PaymentService)) private paymentService: PaymentService,
        private paginationService: PaginationService,
        @Inject(forwardRef(() => SupplierService)) private supplierService: SupplierService,
        @InjectRepository(Purchase) private repository: Repository<Purchase>
    ) { }

    getTotalPurchasesForSupplier(supplierId: number): Promise<number> {
        return this.repository.find({ where: { supplier: { id: supplierId } }, relations: ['details'] })
            .then(purchases => purchases.reduce((total, purchase) => total + this.getTotalPurchaseAmount(purchase), 0));
        }
    getTotalPurchaseAmount(purchase:Purchase):number{
        return purchase.details.reduce((total, detail) => total + detail.historicalUnitPrice*detail.quantity, 0);
    }
    async findAll(paginationWithFiltering: PaginationWithFilteringDto): Promise<PaginatedResponseDto<Purchase>> {
        const { page, quantity, filterType, filterObjectId } = paginationWithFiltering;
            const pagination: PaginationDto = { page, quantity };
            const options = this.paginationService.getPaginationOptions(pagination, {
                        relations:['supplier', 'state', 'details'], order: { dateTime: 'DESC' }
                    });       
            
            switch (filterType) {
                    case '':
                        break;
                    case 'supplier':
                        if (filterObjectId === undefined || filterObjectId === null) {
                            throw new BadRequestException('filterObjectId is required when filtering by supplier');
                        }
                        await this.supplierService.findById(filterObjectId); //Para que de error si no existe
                        options.where = { supplier: { id: filterObjectId } };
                        break;
                    case 'state':
                        if (filterObjectId === undefined || filterObjectId === null) {
                            throw new BadRequestException('filterObjectId is required when filtering by state');
                        }
                        await this.stateService.findById(filterObjectId);//Para que de error si no existe
                        options.where = { state: { id: filterObjectId } };
                        break;
                    default:
                        throw new BadRequestException('Invalid sort parameter');
                }
            const [data, total] = await this.repository.findAndCount(options);
            return this.paginationService.createPaginatedResponse(data, total, pagination);
    
    }
    

    async create(purchase: NewPurchaseDto): Promise<Purchase> {
        const { supplierId, details, paidAmount, paymentMethodId, ...purchaseData } = purchase;
        const supplier = await this.supplierService.findById(supplierId);

        // Wrap the entire creation flow so purchase, payment, and stock changes commit atomically.
        return this.repository.manager.transaction(async (manager) => {
            const purchaseDetails = await this.createDetails(details, manager);
            const initialState = await this.defineInitialState(purchaseDetails, paidAmount ?? 0);
            const newPurchase = manager.create(Purchase, {
                ...purchaseData,
                dateTime: purchaseData.dateTime ?? new Date(),
                supplier,
                state: initialState,
                details: purchaseDetails
            });

            const savedPurchase = await manager.save(newPurchase);

            if (paidAmount && paidAmount > 0) {
                await this.paymentService.createInitialPaymentForPurchase(
                    savedPurchase,
                    paidAmount,
                    paymentMethodId!,
                    supplier,
                    purchaseData.dateTime ?? undefined,
                    manager
                );
            }
            await this.paymentService.useUnassignedAmountForSupplier(supplierId, savedPurchase, manager);
            await this.updateIngredientStockAndPrice(purchaseDetails, manager);

            //AGREGAR LA PARTE DE ASIGNAR EL SALDO A FAVOR SI ES QUE HAY

            return savedPurchase;
        });
    }
    async findUnpaidPurchasesBySupplier(supplierId: number, manager?: EntityManager): Promise<Purchase[]> {
        const repo = manager ? manager.getRepository(Purchase) : this.repository;
        return repo.find({
            where: [{
                supplier: { id: supplierId }, state: { name: 'Pendiente' }
            },{ supplier: { id: supplierId }, state: { name: 'Parcialmente pagado' } }],
        relations: ['details', 'paymentDetails', 'state'],
        order: { dateTime: 'ASC', id: 'ASC' }, // FIFO
        });
    }
    async updateIngredientStockAndPrice(details: Partial<PurchaseDetail>[], manager?: EntityManager): Promise<void> {
        for (const detail of details) {
            await this.ingredientService.updateStock(detail.ingredient!.id, (detail.quantity!), manager); //la quantity se pasa positiva pues se suma al stock
            await this.ingredientService.updateIngredientPrice(detail.ingredient!.id, detail.historicalUnitPrice!, manager);
        }
    }
    async defineInitialState(details:Partial<PurchaseDetail>[],paidAmount:number):Promise<State> {
        
        //Si el monto pagado es igual o mayor al total queda pagado
        if (paidAmount && paidAmount>= this.getTotalFromDetails(details)) {
            return this.stateService.findByName('Pagado');
        }
        //Si se pagó un monto pero no llega al total (no entró al condicional anterior), queda parcialmente pagado
        else if (paidAmount && paidAmount>0){
            return this.stateService.findByName('Parcialmente pagado');
        }
        //Si no se pagó nada queda pendiente
        return this.stateService.findByName('Pendiente');
    }
    getTotalFromDetails(details:Partial<PurchaseDetail>[]):number {
        return details.reduce((total, detail) => total + detail.historicalUnitPrice!*detail.quantity!, 0);
    }
    async createDetails(details: NewPurchaseDetailDto[], manager?: EntityManager): Promise<Partial<PurchaseDetail>[]> {
        
        const purchaseDetails: Partial<PurchaseDetail>[] = [];

        for (const detail of details) {
            const ingredient = await this.ingredientService.findById(detail.ingredientId, manager);
                purchaseDetails.push({
                    ingredient,
                    quantity: detail.quantity,
                    historicalUnitPrice: detail.historicalUnitPrice,
                    // No incluimos id ni purchase porque se asignarán automáticamente
                });
        }
        return purchaseDetails;
    }
    
    
    async delete(id: number): Promise<{ message: string }> {
        return this.repository.manager.transaction(async (manager) => {
            const purchase = await this.findById(id, manager);

            // Restore inventory before removing persisted purchase data.
            for (const detail of purchase.details) {
                await this.ingredientService.updateStock(detail.ingredient.id, -detail.quantity, manager); //restamos la cantidad pues al eliminar la compra se reduce el stock
            }

            await this.paymentService.handlePaymentsAfterPurchaseDeletion(purchase.paymentDetails ?? [], manager);

            await manager.remove(purchase);

            return { message: `Purchase with ID ${id} deleted successfully` };
        });
    }
    async findById(id: number, manager?: EntityManager): Promise<Purchase> {
        const repo = manager ? manager.getRepository(Purchase) : this.repository;
        const purchase = await repo.findOne({
            where: { id },
            relations: ['supplier', 'state', 'details', 'details.ingredient', 'paymentDetails', 'paymentDetails.payment']
        });
        if (!purchase) {
            throw new NotFoundException(`Purchase with ID ${id} not found`);
        } else{
            return purchase;
        }
    }
    async updatePurchaseState(purchase:Purchase, manager?: EntityManager):Promise<Purchase>{
        const repo = manager ? manager.getRepository(Purchase) : this.repository;
        const purchaseWithPayments = purchase.paymentDetails
            ? purchase
            : await repo.findOne({
                  where: { id: purchase.id },
                  relations: ['paymentDetails', 'state']
              });

        if (!purchaseWithPayments) {
            throw new NotFoundException(`Purchase with ID ${purchase.id} not found`);
        }

        //Obtengo el total de la compra y cuanto se ha pagado de ella.
        const totalPurchaseAmount = this.getTotalPurchaseAmount(purchaseWithPayments);
        const totalPaidAmount = this.getTotalPaidAmountForPurchase(purchaseWithPayments);
        if (totalPaidAmount==0){
            if (this.stateService.isPending(purchaseWithPayments.state)){
                //si ya se encuentra en este estado no hace falta cambiarlo
                return purchaseWithPayments 
            }
            const pendingState = await this.stateService.findByName('Pendiente');
            purchaseWithPayments.state = pendingState;
            return repo.save(purchaseWithPayments);
        }
        else if (totalPaidAmount>=totalPurchaseAmount){
            //El estado debe ser "Pagado"
            const payedState = await this.stateService.findByName('Pagado');
            purchaseWithPayments.state = payedState;
            return repo.save(purchaseWithPayments);
        }
        else{ //Entrará a este bloque si 0 < totalPaidAmount < totalPurchaseAmount
            //El estado debe ser "Parcialmente pagado"
            if (this.stateService.isPartiallyPayed(purchaseWithPayments.state)){
                //si ya se encuentra en este estado no hace falta cambiarlo
                return purchaseWithPayments 
            }
            const partiallyPayedState = await this.stateService.findByName('Parcialmente pagado');
            purchaseWithPayments.state = partiallyPayedState;
            return repo.save(purchaseWithPayments);
        }
    }
    getTotalPaidAmountForPurchase(purchase:Purchase):number{
        return purchase.paymentDetails?.reduce((total, detail) => total + detail.amount, 0) ?? 0;
        //The nullish coalescing ( ?? ) operator is a logical operator that returns its right-hand side operand when its left-hand side operand is null or undefined.
    }
}
