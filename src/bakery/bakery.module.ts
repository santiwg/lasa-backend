import { Module } from '@nestjs/common';
import { BakeryController } from './bakery/bakery.controller';
import { BakeryService } from './bakery/bakery.service';
import { BranchController } from './branch/branch.controller';
import { BranchService } from './branch/branch.service';

@Module({
  controllers: [BakeryController, BranchController],
  providers: [BakeryService, BranchService]
})
export class BakeryModule {}
