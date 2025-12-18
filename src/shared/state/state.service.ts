import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { State } from './state.entity';

@Injectable()
export class StateService {

    constructor(@InjectRepository(State) private stateRepository) { }

    async findByName(name: string): Promise<State> {
        const state = await this.stateRepository.findOne({ where: { name } });
        if (!state) {
            throw new NotFoundException('State not found');
        }
        return state;
    }
    isPartiallyPayed(state: State): boolean {
        return state.name === 'Partially Payed';
    }
    isPending(state: State): boolean {
        return state.name === 'Pending';
    }
    findAll():Promise<State[]> {
        return this.stateRepository.find();
    }

}
