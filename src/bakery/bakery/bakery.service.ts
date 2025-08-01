import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bakery } from './bakery.entity';

@Injectable()
export class BakeryService {
    constructor(@InjectRepository(Bakery) private repository: Repository<Bakery>) { }
}
