import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductWithCosts } from './dtos/productWithCost.interface';
import { NewProductDto } from './dtos/newProduct.dto';

@Controller('products')
export class ProductController {
    constructor(private readonly productService: ProductService) {}
    
    @Get()
    async findAll(): Promise<ProductWithCosts[]> {
        return await this.productService.findAllWithCosts();
    }

    @Get(':id')
    async findById(@Param('id') id: number): Promise<ProductWithCosts> {
        return await this.productService.findByIdWithCosts(id);
    }

    @Post()
    async create(@Body() product: NewProductDto): Promise<ProductWithCosts> {
        return await this.productService.createWithCosts(product);
    }
    @Put(':id')
    async update(@Param('id') id: number, @Body() product: NewProductDto): Promise<ProductWithCosts> {
        return await this.productService.updateWithCosts(id, product);
    }
}
