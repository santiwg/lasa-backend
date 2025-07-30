import { Test, TestingModule } from '@nestjs/testing';
import { ProductionInstanceService } from './production-instance.service';

describe('ProductionInstanceService', () => {
  let service: ProductionInstanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductionInstanceService],
    }).compile();

    service = module.get<ProductionInstanceService>(ProductionInstanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
