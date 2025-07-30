import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeRoleController } from './employee-role.controller';

describe('EmployeeRoleController', () => {
  let controller: EmployeeRoleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeRoleController],
    }).compile();

    controller = module.get<EmployeeRoleController>(EmployeeRoleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
