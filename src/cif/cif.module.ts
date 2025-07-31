import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CifController } from './cif/cif.controller';
import { CifService } from './cif/cif.service';
import { CostTypeController } from './cost-type/cost-type.controller';
import { CostTypeService } from './cost-type/cost-type.service';
import { cif_module_entities } from '../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature(cif_module_entities)
  ],
  controllers: [CifController, CostTypeController],
  providers: [CifService, CostTypeService]
})
export class CifModule {}
