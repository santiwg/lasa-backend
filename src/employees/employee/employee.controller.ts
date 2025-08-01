import { Body, Controller, Get, Post } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { NewEmployeeDto } from './dtos/newEmployee.dto';

@Controller('employee')
export class EmployeeController {
    constructor(private readonly employeeService: EmployeeService) {}
    
    @Get()
    findAll() {
        return this.employeeService.findAll();
    }
    
    @Post()
    create(@Body() createEmployeeDto: NewEmployeeDto) {
        return this.employeeService.create(createEmployeeDto);
    }
}
