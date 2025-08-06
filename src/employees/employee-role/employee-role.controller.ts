import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { EmployeeRoleService } from './employee-role.service';
import { NewEmployeeRoleDto } from './dtos/newEmployeeRole.dto';
import { EmployeeService } from '../employee/employee.service';

@Controller('employee-roles')
export class EmployeeRoleController {
    constructor(private readonly employeeRoleService: EmployeeRoleService,
                private readonly employeeService: EmployeeService) {}

    @Get()
    async findAll() {
        return await this.employeeRoleService.findAll();
    }

    @Post()
    async create(@Body() newRole: NewEmployeeRoleDto) {
        return await this.employeeRoleService.create(newRole);
    }

    @Get(':roleName/average-wage')
    async getAverageWageByRoleName(@Param('roleName') roleName: string) {
        const averageWage = await this.employeeService.getAverageHourlyWageByRoleName(roleName);
        return {
            roleName,
            averageHourlyWage: averageWage
        };
    }
}
