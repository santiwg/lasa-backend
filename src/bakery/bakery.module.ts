import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BakeryController } from './bakery/bakery.controller';
import { BakeryService } from './bakery/bakery.service';
import { BranchController } from './branch/branch.controller';
import { BranchService } from './branch/branch.service';
import { bakery_module_entities } from '../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature(bakery_module_entities)
  ],
  controllers: [BakeryController, BranchController],
  providers: [BakeryService, BranchService]
})
export class BakeryModule {}
