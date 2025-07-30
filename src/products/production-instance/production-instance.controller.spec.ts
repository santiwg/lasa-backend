import { Test, TestingModule } from '@nestjs/testing';
import { ProductionInstanceController } from './production-instance.controller';

describe('ProductionInstanceController', () => {
  let controller: ProductionInstanceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductionInstanceController],
    }).compile();

    controller = module.get<ProductionInstanceController>(ProductionInstanceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
