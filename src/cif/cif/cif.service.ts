import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThan, And } from 'typeorm';
import { Cif } from './cif.entity';
import { NewCifDto } from './dtos/newCif.dto';
import { CostTypeService } from '../cost-type/cost-type.service';
import { UnitService } from 'src/shared/unit/unit.service';

@Injectable()
export class CifService {
    constructor(@InjectRepository(Cif) private repository: Repository<Cif>,
                private readonly costTypeService: CostTypeService,
                private readonly unitService: UnitService) { }

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
    async findAll(): Promise<Cif[]> {
        return this.repository.find(); // No necesitamos relations porque costType y unit son eager
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
}
