import { Controller, Get, Post } from '@nestjs/common';
import { EmployeeRoleService } from './employee-role.service';
import { NewEmployeeRoleDto } from './dtos/newEmployeeRole.dto';

@Controller('employee-role')
export class EmployeeRoleController {
    constructor(private readonly employeeRoleService: EmployeeRoleService) {}

    @Get()
    findAll() {
        return this.employeeRoleService.findAll();
    }

    @Post()
    create(newRole: NewEmployeeRoleDto) {
        return this.employeeRoleService.create(newRole);
    }

}
