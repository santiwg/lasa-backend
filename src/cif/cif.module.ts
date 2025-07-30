import { Module } from '@nestjs/common';
import { CifController } from './cif/cif.controller';
import { CifService } from './cif/cif.service';
import { CostTypeController } from './cost-type/cost-type.controller';
import { CostTypeService } from './cost-type/cost-type.service';

@Module({
  controllers: [CifController, CostTypeController],
  providers: [CifService, CostTypeService]
})
export class CifModule {}
