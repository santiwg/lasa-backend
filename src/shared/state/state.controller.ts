import { Controller, Get, Param } from '@nestjs/common';
import { State } from './state.entity';
import { StateService } from './state.service';

@Controller('states')
export class StateController {

    constructor(private readonly stateService: StateService) { }

    @Get(':name')
    async findByName(@Param('name') name: string): Promise<State> {
        return await this.stateService.findByName(name);
    }

    @Get()
    async findAll(): Promise<State[]> {
        return await this.stateService.findAll();
    }

}
