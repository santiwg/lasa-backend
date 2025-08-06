import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThan, And } from 'typeorm';
import { Cif } from './cif.entity';
import { NewCifDto } from './dtos/newCif.dto';
import { CostTypeService } from '../cost-type/cost-type.service';
import { UnitService } from 'src/shared/unit/unit.service';
import { Product } from 'src/products/product/product.entity';
import { PaginationService } from 'src/shared/pagination/pagination.service';
import { PaginatedResponseDto } from 'src/shared/pagination/dtos/paginated-response.dto';
import { PaginationDto } from 'src/shared/pagination/dtos/pagination.dto';

@Injectable()
export class CifService {
    constructor(@InjectRepository(Cif) private repository: Repository<Cif>,
                private readonly costTypeService: CostTypeService,
                private readonly unitService: UnitService,
                private readonly paginationService: PaginationService
            ) { }

    async createCif(newCif: NewCifDto): Promise<Cif> {
        const { costTypeId, unitId, ...cifData } = newCif;
        const costType = await this.costTypeService.findById(costTypeId);
        const unit = await this.unitService.findById(unitId);

        const cif = this.repository.create({
            ...cifData,
            costType,
            unit
        });
        // TypeORM añade automáticamente dateTime = NOW() si no le paso fecha
        return this.repository.save(cif);
    }
    // 1. Método SIN paginación (para uso interno, dropdowns, etc.)
    async findAll(): Promise<Cif[]> {
        return this.repository.find({
            order: { dateTime: 'DESC' }
        });
    }

    // 2. Método CON paginación (para listados de UI)
    async findAllPaginated(pagination: PaginationDto): Promise<PaginatedResponseDto<Cif>> {
        const options = this.paginationService.getPaginationOptions(pagination, {
            order: { dateTime: 'DESC' }
        });
        
        const [data, total] = await this.repository.findAndCount(options);
        
        return this.paginationService.createPaginatedResponse(data, total, pagination);
    }
    async getLastMonthTotal(): Promise<number> {
        const now = new Date();
        
        // Calcular mes anterior
        let previousMonth = now.getMonth() - 1;
        let year = now.getFullYear();
        
        // Si estamos en enero (mes 0), el mes anterior es diciembre del año pasado
        if (previousMonth < 0) {
            previousMonth = 11; // Diciembre
            year = year - 1;
        }
        
        // Crear fechas de inicio y fin del mes anterior
        const startOfPreviousMonth = new Date(year, previousMonth, 1);
        const startOfCurrentMonth = new Date(year, previousMonth + 1, 1);
        
        const cifEntries = await this.repository.find({
            where: { 
                dateTime: And(
                    MoreThanOrEqual(startOfPreviousMonth),
                    LessThan(startOfCurrentMonth)
                )
            }
        });
        return cifEntries.reduce((total, cif) => total + cif.unitPrice * cif.quantity, 0);
    }
    async getCurrentMonthTotal(): Promise<number> {
        const now = new Date();
        
        // Crear fecha de inicio del mes actual
        const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const cifEntries = await this.repository.find({
            where: {
                dateTime: MoreThanOrEqual(startOfCurrentMonth)
            }
        });
        return cifEntries.reduce((total, cif) => total + cif.unitPrice * cif.quantity, 0);
    }
    async getUnitaryCif(product: Product, allProducts: Product[]): Promise<number> {
        const weightedTotal = this.getWeightedTotal(allProducts);
        if (weightedTotal === 0) return 0; // Evitar división por cero

        //kg × factor de cada producto es la ponderacion
        const productWeight = product.expectedKilosPerMonth * product.complexityFactor;
        const percentage = productWeight / weightedTotal; // Porcentaje del producto respecto al total ponderado
        
        //usamos el total de CIF del mes anterior, pues en el mes actual aún no necesariamente se registraron todos los cif y puede ser engañoso
        const totalCif = await this.getLastMonthTotal();
        const totalCifForProduct = totalCif * percentage; // CIF asignado a este producto
        // Coste CIF unitario = CIF asignado al producto / producción esperada del producto
        const unitaryCif = totalCifForProduct / product.expectedKilosPerMonth;
        return unitaryCif;
    }
    getWeightedTotal(products: Product[]): number {
        //∑ kg × factor de cada producto
        //suma de la cantidad ponderada de cada producto
        return products.reduce((total, product) => total + product.expectedKilosPerMonth * product.complexityFactor, 0);
    }
}
