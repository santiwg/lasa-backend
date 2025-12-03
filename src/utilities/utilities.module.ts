import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { shared_module_entities } from '../entities';
import { PaginationService } from './pagination/pagination.service';

@Module({
  imports: [
    TypeOrmModule.forFeature(shared_module_entities)
  ],
  providers: [PaginationService],
  exports: [PaginationService]
})
export class UtilitiesModule {}
