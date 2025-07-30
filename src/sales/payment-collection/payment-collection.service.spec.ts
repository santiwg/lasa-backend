import { Test, TestingModule } from '@nestjs/testing';
import { PaymentCollectionService } from './payment-collection.service';

describe('PaymentCollectionService', () => {
  let service: PaymentCollectionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentCollectionService],
    }).compile();

    service = module.get<PaymentCollectionService>(PaymentCollectionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
