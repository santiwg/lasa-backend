import { Module } from '@nestjs/common';
import { EmployeeController } from './employee/employee.controller';
import { EmployeeService } from './employee/employee.service';
import { EmployeeRoleController } from './employee-role/employee-role.controller';
import { EmployeeRoleService } from './employee-role/employee-role.service';

@Module({
  controllers: [EmployeeController, EmployeeRoleController],
  providers: [EmployeeService, EmployeeRoleService]
})
export class EmployeesModule {}
