import { BadRequestException, Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, MoreThan, Not, Repository } from 'typeorm';
import { Payment } from './payment.entity';
import { Purchase } from '../purchase/purchase.entity';
import { PaymentMethodService } from 'src/shared/payment-method/payment-method.service';
import { PaymentDetail } from './payment-detail.entity';
import { Supplier } from '../supplier/supplier.entity';
import { PaginatedResponseDto } from 'src/utilities/pagination/dtos/paginated-response.dto';
import { PaginationWithFilteringDto } from 'src/utilities/pagination/dtos/pagination-with-filters.dto';
import { PaginationDto } from 'src/utilities/pagination/dtos/pagination.dto';
import { PaginationService } from 'src/utilities/pagination/pagination.service';
import { NewPaymentDto } from './dtos/newPayment.dto';
import { SupplierService } from '../supplier/supplier.service';
import { PurchaseService } from '../purchase/purchase.service';

@Injectable()
export class PaymentService {
    constructor(
        @Inject(forwardRef(() => PurchaseService)) private purchaseService: PurchaseService,
        @Inject(forwardRef(() => SupplierService)) private supplierService: SupplierService,
        private paginationService: PaginationService,
        private paymentMethodService: PaymentMethodService,
        @InjectRepository(Payment) private repository: Repository<Payment>,
        @InjectRepository(PaymentDetail) private paymentDetailRepository: Repository<PaymentDetail>
    ) { }

    getTotalPaymentsForSupplier(supplierId: number): Promise<number> {
        return this.repository.find({ where: { supplier: { id: supplierId } }, relations: ['details'] })
            .then(payments => payments.reduce((total, payment) => total + this.getTotalPaymentAmount(payment), 0));
    }
    getTotalPaymentAmount(payment: Payment): number {
        const detailTotal = this.getTotalDetailsAmount(payment.details ?? []);
        return detailTotal + payment.unassignedAmount;
        //el total está formado por los montos de los detalles más el monto no asignado
    }
    getTotalDetailsAmount(details: Array<PaymentDetail | Partial<PaymentDetail>>): number {
        return details.reduce((total, detail) => total + (detail.amount ?? 0), 0);
    }
    async createInitialPaymentForPurchase(purchase: Purchase, paidAmount: number, paymentMethodId: number, supplier: Supplier, date?: Date, manager?: EntityManager): Promise<Payment> {
        const paymentMethod = await this.paymentMethodService.findById(paymentMethodId);
        const details = this.createInitialPaymentDetailsForPurchase(purchase, paidAmount);
        const paymentRepository = manager ? manager.getRepository(Payment) : this.repository;
        const unassignedAmount = paidAmount - this.getTotalDetailsAmount(details);
        const newPayment = paymentRepository.create({
            dateTime: date || new Date(), supplier, paymentMethod, details, unassignedAmount
        });
        return paymentRepository.save(newPayment);
    }

    async deletePayments(payments: Payment[], manager?: EntityManager): Promise<void> {
        //En este método no se actualiza el estado de las ventas correspondientes
        if (!payments.length) {
            return;
        }
        const paymentRepository = manager ? manager.getRepository(Payment) : this.repository;
        await paymentRepository.remove(payments);
    }
    // Remove payments that became orphaned after deleting a purchase; keep shared payments intact.
    async handlePaymentsAfterPurchaseDeletion(paymentDetails: PaymentDetail[], manager?: EntityManager): Promise<void> {
        const paymentRepository = manager ? manager.getRepository(Payment) : this.repository;
        const paymentDetailRepository = manager
            ? manager.getRepository(PaymentDetail)
            : this.repository.manager.getRepository(PaymentDetail);
        const processedPaymentIds = new Set<number>();

        for (const detail of paymentDetails) {
            const payment = detail.payment;
            if (!payment || processedPaymentIds.has(payment.id)) {
                continue;
            }

            processedPaymentIds.add(payment.id);

            // Count how many details from this purchase referenced the payment.
            const purchaseSpecificCount = paymentDetails.filter(
                (item) => item.payment?.id === payment.id
            ).length;

            // Cross-check how many total details the payment still has in the database.
            const totalCount = await paymentDetailRepository.count({
                where: { payment: { id: payment.id } }
            });

            // Remove the payment only when the deleted purchase contributed all remaining details.
            if (totalCount === purchaseSpecificCount) {
                await paymentRepository.remove([payment]);
            }
        }
    }
    createInitialPaymentDetailsForPurchase(purchase: Purchase, paidAmount: number): Partial<PaymentDetail>[] {
        const purchaseTotal = this.purchaseService.getTotalPurchaseAmount(purchase);
        if (paidAmount <= 0) {
            return [];
        } else if (paidAmount >= purchaseTotal) {
            return [{ amount: purchaseTotal, purchase: purchase }];
        } else {
            return [{ amount: paidAmount, purchase: purchase }];
        }
    }
    async findAll(paginationWithFiltering: PaginationWithFilteringDto): Promise<PaginatedResponseDto<Payment>> {
        const { page, quantity, filterType, filterObjectId } = paginationWithFiltering;
        const pagination: PaginationDto = { page, quantity };
        const options = this.paginationService.getPaginationOptions(pagination, {
            relations: ['supplier', 'paymentMethod', 'details'], order: { dateTime: 'DESC' }
        });

        switch (filterType) {
            case '':
                break;
            case 'supplier':
                options.where = { supplier: { id: filterObjectId } };
                break;
            case 'paymentMethod':
                options.where = { paymentMethod: { id: filterObjectId } };
                break;
            default:
                throw new BadRequestException('Invalid sort parameter');
        }
        const [data, total] = await this.repository.findAndCount(options);
        return this.paginationService.createPaginatedResponse(data, total, pagination);

    }
    async create(newPayment: NewPaymentDto): Promise<Payment> {
        //Extraigo propiedades del dto y obtengo entidades necesarias
        const { supplierId, paymentMethodId, paidAmount, ...paymentData } = newPayment;
        const supplier = await this.supplierService.findById(supplierId);
        const paymentMethod = await this.paymentMethodService.findById(paymentMethodId);

        return this.repository.manager.transaction(async (manager) => {

            //Creo los detalles de pago en base al monto pagado y las compras pendientes del proveedor y calculo el sobrante
            const details = await this.createDetailsForPayment(supplierId, paidAmount, manager);
            const unassignedAmount = paidAmount - this.getTotalDetailsAmount(details);

            //Creo y guardo el pago
            const paymentRepository = manager.getRepository(Payment);
            const createdPayment = paymentRepository.create({
                ...paymentData,
                ...(paymentData.dateTime ? { dateTime: paymentData.dateTime } : { dateTime: new Date() }),
                supplier,
                paymentMethod,
                details,
                unassignedAmount,
            });

            const savedPayment = await paymentRepository.save(createdPayment);

            //Actualizo el estado de las compras pagadas
            await this.updatePaidPurchasesStates(savedPayment, manager);

            return savedPayment;
        });
    }
    // Build payment details in FIFO order of unpaid purchases until the paid amount is exhausted.
    async createDetailsForPayment(supplierId: number, paidAmount: number, manager?: EntityManager): Promise<Partial<PaymentDetail>[]> {
        const details: Partial<PaymentDetail>[] = [];
        const unpaidPurchases = await this.purchaseService.findUnpaidPurchasesBySupplier(supplierId, manager);
        let remainingAmount = paidAmount;
        while (remainingAmount > 0 && unpaidPurchases.length > 0) {
            const purchase = unpaidPurchases.shift()!; //Removes the first element from an array and returns it. If the array is empty, undefined is returned and the array is not modified.
            const totalPurchaseAmount = this.purchaseService.getTotalPurchaseAmount(purchase);
            const alreadyPaid =
                this.purchaseService.getTotalPaidAmountForPurchase(purchase);
            const remainingForPurchase = totalPurchaseAmount - alreadyPaid;

            // Puede haber estado desactualizado el estado; por seguridad saltamos si ya está totalmente paga
            if (remainingForPurchase <= 0) {
                continue;
            }

            const detailAmount = Math.min(remainingAmount, remainingForPurchase);
            details.push({ amount: detailAmount, purchase });
            remainingAmount -= detailAmount;
        }
        return details;

    }

    async useUnassignedAmountForSupplier(supplierId: number, purchase: Purchase, manager?: EntityManager): Promise<void> {
        const paymentRepository = manager ? manager.getRepository(Payment) : this.repository;
        const paymentDetailRepository = manager ? manager.getRepository(PaymentDetail) : this.paymentDetailRepository;
        const amountToPay =
            this.purchaseService.getTotalPurchaseAmount(purchase) -
            this.purchaseService.getTotalPaidAmountForPurchase(purchase);

        if (amountToPay <= 0) {
            return;
        }
        //obtenga los pagos con monto no asignado para el proveedor y el total restante a pagar por la venta
        const paymentsWithUnassignedAmount = await paymentRepository.find({
            where: { supplier: { id: supplierId }, unassignedAmount: MoreThan(0) }
        })
        let remainingAmount = amountToPay;
        while (remainingAmount > 0 && paymentsWithUnassignedAmount.length > 0) {
            const payment = paymentsWithUnassignedAmount.shift()!;
            const amountUsed = Math.min(remainingAmount, payment.unassignedAmount);
            //Creo un nuevo detalle de pago
            const newDetail = paymentDetailRepository.create({
                amount: amountUsed,
                purchase,
                payment,
            });
            payment.details = payment.details ? [...payment.details, newDetail] : [newDetail];
            //Actualizo el monto no asignado
            payment.unassignedAmount -= amountUsed;
            //Guardo los cambios
            await paymentRepository.save(payment);

            //Actualizo el estado de la compra
            await this.purchaseService.updatePurchaseState(purchase, manager);
            //Actualizo el monto restante por pagar
            remainingAmount -= amountUsed;
        }
    }

    async updatePaidPurchasesStates(payment: Payment, manager?: EntityManager): Promise<void> {
        for (const detail of payment.details) {
            await this.purchaseService.updatePurchaseState(detail.purchase, manager);
        }
    }
    async delete(id: number): Promise<{ message: string }> {
        return this.repository.manager.transaction(async (manager) => {
            const payment = await this.findById(id, manager);

            // Guardamos IDs (no entidades) para evitar usar relaciones stale en memoria
            const relatedPurchaseIds = [
                ...new Set(
                    (payment.details ?? [])
                        .map((d) => d.purchase?.id)
                        .filter((x): x is number => typeof x === 'number'),
                ),
            ];

            await manager.remove(payment); // DB elimina payment-details por CASCADE (si el FK existe)

            // Re-cargar compras ya sin esos payment-details y recién ahí recalcular estado

            for (const purchaseId of relatedPurchaseIds) {
                const freshPurchase = await this.purchaseService.findById(purchaseId, manager);
                if (freshPurchase) {
                    await this.purchaseService.updatePurchaseState(freshPurchase, manager);
                }
            }

            return { message: `Payment with id ${id} deleted successfully` };
        });
    }
    async findById(id: number, manager?: EntityManager): Promise<Payment> {
        const repo = manager ? manager.getRepository(Payment) : this.repository;
        const payment = await repo.findOne({
            where: { id },
            relations: ['supplier', 'paymentMethod', 'details', 'details.purchase', 'details.purchase.state', 'details.purchase.paymentDetails']
        });
        if (!payment) {
            throw new NotFoundException(`Payment with id ${id} not found`);
        }
        return payment;
    }
}
