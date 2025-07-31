import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeController } from './employee/employee.controller';
import { EmployeeService } from './employee/employee.service';
import { EmployeeRoleController } from './employee-role/employee-role.controller';
import { EmployeeRoleService } from './employee-role/employee-role.service';
import { employees_module_entities } from '../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature(employees_module_entities)
  ],
  controllers: [EmployeeController, EmployeeRoleController],
  providers: [EmployeeService, EmployeeRoleService]
})
export class EmployeesModule {}
