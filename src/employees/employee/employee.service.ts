import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './employee.entity';
import { NewEmployeeDto } from './dtos/newEmployee.dto';
import { EmployeeRoleService } from '../employee-role/employee-role.service';

@Injectable()
export class EmployeeService {
    constructor(@InjectRepository(Employee) private repository: Repository<Employee>,
                private readonly employeeRoleService: EmployeeRoleService) { }

    async findAll(): Promise<Employee[]> {
        return this.repository.find();
    }
    async findById(id: number): Promise<Employee> {
        const employee = await this.repository.findOne({ where: { id } });
        if (!employee) {
            throw new NotFoundException(`Employee with ID ${id} not found`);
        }
        return employee;
    }
    async create(newEmployee: NewEmployeeDto): Promise<Employee> {
        // Validar que el rol existe
        const role = await this.employeeRoleService.findById(newEmployee.roleId);

        // Separar roleId del resto de datos
        const { roleId, ...employeeData } = newEmployee;

        // Crear empleado con datos válidos
        const employee = this.repository.create({
            ...employeeData,
            role
        });

        return this.repository.save(employee);
    }
    async getAverageHourlyWageByRole(roleId: number): Promise<number> {
        const employees = await this.repository.find({ where: { role: { id: roleId }, isActive: true } });
        
        if (employees.length === 0) {
            throw new NotFoundException(`No employees found for role ID ${roleId}`);
        }
        
        const totalWage = employees.reduce((sum, employee) => sum + employee.hourlyWage, 0);
        return totalWage / employees.length;
    }

    async getAverageHourlyWageByRoleName(roleName: string): Promise<number> {
        // Buscar el rol por nombre
        const role = await this.employeeRoleService.findByName(roleName);
        if (!role) {
            throw new NotFoundException(`Role '${roleName}' not found`);
        }
        
        // Usar el método existente con el ID del rol encontrado
        return this.getAverageHourlyWageByRole(role.id);
    }

    async update(id: number, updateEmployee: NewEmployeeDto): Promise<Employee> {
        const employee = await this.findById(id);

        // Validar que el rol existe
        const role = await this.employeeRoleService.findById(updateEmployee.roleId);

        // Separar roleId del resto de datos
        const { roleId, ...employeeData } = updateEmployee;

        // Actualizar empleado con datos válidos
        Object.assign(employee, employeeData, { role });

        return this.repository.save(employee);
    }

}
