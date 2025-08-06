import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CifController } from './cif/cif.controller';
import { CifService } from './cif/cif.service';
import { CostTypeController } from './cost-type/cost-type.controller';
import { CostTypeService } from './cost-type/cost-type.service';
import { cif_module_entities } from '../entities';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    TypeOrmModule.forFeature(cif_module_entities),
    SharedModule
  ],
  controllers: [CifController, CostTypeController],
  providers: [CifService, CostTypeService],
  exports: [CifService]
})
export class CifModule {}
