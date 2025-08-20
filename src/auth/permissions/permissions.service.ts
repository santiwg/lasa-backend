import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
    import { PermissionEntity } from '../entities/permission.entity';
import { Repository, In } from 'typeorm';
import { CreatePermissionDto } from './permissionsDto';

@Injectable()
export class PermissionsService {

    constructor(@InjectRepository(PermissionEntity) private repository: Repository<PermissionEntity>,
                ) {}
    async findPermissionsByNames(permissionNames: string[]): Promise<PermissionEntity[]> {
        return await this.repository.find({ where: { name: In(permissionNames), },
        });
    }

    async createPermission(permission: CreatePermissionDto): Promise<PermissionEntity> {
        return await this.repository.save(permission)
    }

}