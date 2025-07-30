import { Test, TestingModule } from '@nestjs/testing';
import { PaymentCollectionController } from './payment-collection.controller';

describe('PaymentCollectionController', () => {
  let controller: PaymentCollectionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentCollectionController],
    }).compile();

    controller = module.get<PaymentCollectionController>(PaymentCollectionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
