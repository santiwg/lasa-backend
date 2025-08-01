import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeRole } from './employee-role.entity';

@Injectable()
export class EmployeeRoleService {
    constructor(@InjectRepository(EmployeeRole) private repository: Repository<EmployeeRole>) { }
}
