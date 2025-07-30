import { Test, TestingModule } from '@nestjs/testing';
import { CifController } from './cif.controller';

describe('CifController', () => {
  let controller: CifController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CifController],
    }).compile();

    controller = module.get<CifController>(CifController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
