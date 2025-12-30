import { BadRequestException, Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from './supplier.entity';
import { PaginationWithSortingDto } from 'src/utilities/pagination/dtos/pagination-with-sorting.dto';
import { PaginationDto } from 'src/utilities/pagination/dtos/pagination.dto';
import { PaginationService } from 'src/utilities/pagination/pagination.service';
import { error } from 'console';
import { SupplierWithBalance } from './dtos/supplierWithBalance.interface';
import { PurchaseService } from '../purchase/purchase.service';
import { PaymentService } from '../payment/payment.service';
import { PaginatedResponseDto } from 'src/utilities/pagination/dtos/paginated-response.dto';
import { NewSupplierDto } from './dtos/newSupplier.dto';

@Injectable()
export class SupplierService {

    constructor(
        @Inject(forwardRef(() => PaymentService)) private readonly paymentService: PaymentService,
        @Inject(forwardRef(() => PurchaseService)) private readonly purchaseService: PurchaseService,
        private readonly paginationService: PaginationService,
        @InjectRepository(Supplier) private repository: Repository<Supplier>
    ) { }

    async findAllWithBalance(paginationWithSortingDto: PaginationWithSortingDto): Promise<PaginatedResponseDto<SupplierWithBalance>> {
        const { page, quantity, sort, order } = paginationWithSortingDto;
        const pagination: PaginationDto = { page, quantity };
        switch (sort) {
            case '':
                return this.findAllSortedByBusinessName(pagination, order);
            case 'businessName':
                return this.findAllSortedByBusinessName(pagination, order);
            case 'balance':
                return this.findAllSortedByBalance(pagination, order);
            default:
                throw new BadRequestException('Invalid sort parameter');
        }
    }
    async findAll(pagination: PaginationDto): Promise<PaginatedResponseDto<Supplier>> {
        const options = this.paginationService.getPaginationOptions(pagination, {order:{ businessName: 'ASC' }});
        const [data, total] = await this.repository.findAndCount(options);
        return this.paginationService.createPaginatedResponse(data, total, pagination);
    }
    async findAllSortedByBusinessName(pagination: PaginationDto, order: 'asc' | 'desc' = 'asc'): Promise<PaginatedResponseDto<SupplierWithBalance>> {
        //Al filtrar por nombre se hace de forma ascendente por lo general
        const options = this.paginationService.getPaginationOptions(pagination, {
            order: { businessName: order }
        });
        const [data, total] = await this.repository.findAndCount(options);

        const supplierswithBalance: SupplierWithBalance[] = [];
        for (const supplier of data) {
            const supplierWithBalance = await this.convertToSupplierWithBalance(supplier);
            supplierswithBalance.push(supplierWithBalance);
        }
        return this.paginationService.createPaginatedResponse(supplierswithBalance, total, pagination);

    }
    async findAllSortedByBalance(pagination: PaginationDto, order: 'asc' | 'desc' = 'asc'): Promise<PaginatedResponseDto<SupplierWithBalance>> {
        //Orden ascendente por defecto para que aparezcan primero los valores negativos ( a los que más se le debe)
        const [data, total] = await this.repository.findAndCount();

        const supplierswithBalance: SupplierWithBalance[] = [];
        for (const supplier of data) {
            const supplierWithBalance = await this.convertToSupplierWithBalance(supplier);
            supplierswithBalance.push(supplierWithBalance);
        }
        const sortedSuppliers = this.sortByBalance(supplierswithBalance, order);
        const paginatedSuppliers = this.paginationService.manualPagination(sortedSuppliers, pagination);
        return this.paginationService.createPaginatedResponse(paginatedSuppliers, total, pagination);

    }
    sortByBalance(suppliers: SupplierWithBalance[], order: 'asc' | 'desc' = 'desc'): SupplierWithBalance[] {
        suppliers.sort((a, b) => {
            if (order === 'asc') {
                return a.balancePayable - b.balancePayable;
            } else { //order === 'desc'
                return b.balancePayable - a.balancePayable;
            }
        });
        return suppliers;
    }
    async convertToSupplierWithBalance(supplier: Supplier): Promise<SupplierWithBalance> {
        const totalPurchases = await this.getTotalPurchasesForSupplier(supplier.id);
        const totalPayments = await this.getTotalPaymentsForSupplier(supplier.id);
        const balance = totalPurchases - totalPayments;

        return {
            ...supplier,
            balancePayable: balance,
        };
    }
    getTotalPurchasesForSupplier(supplierId: number): Promise<number> {
        return this.purchaseService.getTotalPurchasesForSupplier(supplierId);
    }
    getTotalPaymentsForSupplier(supplierId: number): Promise<number> {
        return this.paymentService.getTotalPaymentsForSupplier(supplierId);
    }

    async create(supplier: NewSupplierDto): Promise<SupplierWithBalance> {
        const newSupplier = this.repository.create(supplier);
        const savedSupplier = await this.repository.save(newSupplier);
        return this.convertToSupplierWithBalance(savedSupplier);
    }
    async update(id: number, supplier: NewSupplierDto): Promise<SupplierWithBalance> {
        const existingSupplier = await this.findById(id);
        Object.assign(existingSupplier, supplier);
        const updatedSupplier = await this.repository.save(existingSupplier);
        return this.convertToSupplierWithBalance(updatedSupplier);
    }
    async delete(id: number): Promise<{ message: string; }> {
        const supplier = await this.findById(id);
        if ((supplier.purchases && supplier.purchases.length > 0)||(supplier.payments && supplier.payments.length > 0)) {
            throw new BadRequestException(`Cannot delete supplier with ID ${id} because it has associated purchases or payments.`);
        }
        await this.repository.softRemove(supplier);
        return { message: `Supplier with ID ${id} deleted successfully` };
    }

    async findById(id: number): Promise<Supplier> {
        const supplier = await this.repository.findOne({ where: { id } , relations: ['purchases','payments'] });
        if (!supplier) {
            throw new NotFoundException(`Supplier with ID ${id} not found`);
        }
        return supplier;
    }
    async findByIdWithoutRelations(id: number): Promise<Supplier> {
        const supplier = await this.repository.findOne({ where: { id } });
        if (!supplier) {
            throw new NotFoundException(`Supplier with ID ${id} not found`);
        }
        return supplier;
    }
}