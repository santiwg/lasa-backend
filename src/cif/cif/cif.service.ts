import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cif } from './cif.entity';

@Injectable()
export class CifService {
    constructor(@InjectRepository(Cif) private repository: Repository<Cif>) { }
}
