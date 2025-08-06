import { Controller, Get, Post, Body } from '@nestjs/common';
import { EmployeeRoleService } from './employee-role.service';
import { NewEmployeeRoleDto } from './dtos/newEmployeeRole.dto';

@Controller('employee-role')
export class EmployeeRoleController {
    constructor(private readonly employeeRoleService: EmployeeRoleService) {}

    @Get()
    async findAll() {
        return await this.employeeRoleService.findAll();
    }

    @Post()
    async create(@Body() newRole: NewEmployeeRoleDto) {
        return await this.employeeRoleService.create(newRole);
    }

}
