import { Test, TestingModule } from '@nestjs/testing';
import { CostTypeService } from './cost-type.service';

describe('CostTypeService', () => {
  let service: CostTypeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CostTypeService],
    }).compile();

    service = module.get<CostTypeService>(CostTypeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
