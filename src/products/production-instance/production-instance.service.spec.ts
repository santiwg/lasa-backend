import { Test, TestingModule } from '@nestjs/testing';
import { ProductionInstanceService } from './production-instance.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductionInstance } from './production-instance.entity';
import { ProductionInstanceDetail } from './production-instance-detail.entity';
import { ProductService } from '../product/product.service';
import { IngredientService } from '../ingredient/ingredient.service';
import { PaginationService } from 'src/utilities/pagination/pagination.service';

describe('ProductionInstanceService', () => {
  let service: ProductionInstanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductionInstanceService,
        {
          provide: getRepositoryToken(ProductionInstance),
          useValue: {},
        },
        {
          provide: getRepositoryToken(ProductionInstanceDetail),
          useValue: {},
        },
        {
          provide: ProductService,
          useValue: {},
        },
        {
          provide: IngredientService,
          useValue: {},
        },
        {
          provide: PaginationService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ProductionInstanceService>(ProductionInstanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
