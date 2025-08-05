import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeRole } from './employee-role.entity';
import { NewEmployeeRoleDto } from './dtos/newEmployeeRole.dto';

@Injectable()
export class EmployeeRoleService {
    constructor(@InjectRepository(EmployeeRole) private repository: Repository<EmployeeRole>) { }
    async findAll(): Promise<EmployeeRole[]> {
        return this.repository.find();
    }
    async findById(id: number): Promise<EmployeeRole> {
        const role = await this.repository.findOne({ where: { id } });
        if (!role) {
            throw new NotFoundException(`Employee role with ID ${id} not found`);
        }
        return role;
    }
    
    async findByName(name: string): Promise<EmployeeRole> {
        const role = await this.repository.findOne({ where: { name } });
        if (!role) {
            throw new NotFoundException(`Employee role with name '${name}' not found`);
        }
        return role;
    }
    
    async create(newRole: NewEmployeeRoleDto): Promise<EmployeeRole> {
        const role = this.repository.create(newRole);
        return this.repository.save(role);
    }
}
