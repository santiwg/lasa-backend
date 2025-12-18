import { Controller, Get, Post, Delete, Query, Body, Param } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaginationWithFilteringDto } from 'src/utilities/pagination/dtos/pagination-with-filters.dto';
import { NewPaymentDto } from './dtos/newPayment.dto';
import { Payment } from './payment.entity';
import { PaginatedResponseDto } from 'src/utilities/pagination/dtos/paginated-response.dto';

@Controller('payments')
export class PaymentController {

    constructor(private readonly paymentService: PaymentService) { }


    @Get()
    async findAll(@Query() pagination: PaginationWithFilteringDto): Promise<PaginatedResponseDto<Payment>> {
        return await this.paymentService.findAll(pagination);
    }
    @Post()
    async createPayment(@Body() paymentData: NewPaymentDto): Promise<Payment> {
        return await this.paymentService.create(paymentData);
    }
    @Delete(':id')
    async deletePayment(@Param('id') id: number): Promise<{ message: string }> {
        return await this.paymentService.delete(id);
    }
}


