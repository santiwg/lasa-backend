import { Body, Controller, Get, Post, Put, Param } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { NewEmployeeDto } from './dtos/newEmployee.dto';

@Controller('employees')
export class EmployeeController {
    constructor(private readonly employeeService: EmployeeService) {}
    
    @Get()
    async findAll() {
        return await this.employeeService.findAll();
    }
    
    @Post()
    async create(@Body() createEmployeeDto: NewEmployeeDto) {
        return await this.employeeService.create(createEmployeeDto);
    }

    @Put(':id')
    async update(@Param('id') id: number, @Body() updateEmployeeDto: NewEmployeeDto) {
        return await this.employeeService.update(id, updateEmployeeDto);
    }
}
