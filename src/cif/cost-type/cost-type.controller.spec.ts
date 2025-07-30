import { Test, TestingModule } from '@nestjs/testing';
import { CostTypeController } from './cost-type.controller';

describe('CostTypeController', () => {
  let controller: CostTypeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CostTypeController],
    }).compile();

    controller = module.get<CostTypeController>(CostTypeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
