import { Body, Controller, Get, Post, Put, Param } from '@nestjs/common';
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

    @Put(':id')
    update(@Param('id') id: number, @Body() updateEmployeeDto: NewEmployeeDto) {
        return this.employeeService.update(id, updateEmployeeDto);
    }
}
