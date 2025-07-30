import { Test, TestingModule } from '@nestjs/testing';
import { CifService } from './cif.service';

describe('CifService', () => {
  let service: CifService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CifService],
    }).compile();

    service = module.get<CifService>(CifService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
