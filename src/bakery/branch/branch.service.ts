import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from './branch.entity';

@Injectable()
export class BranchService {
    constructor(@InjectRepository(Branch) private repository: Repository<Branch>) { }
}
