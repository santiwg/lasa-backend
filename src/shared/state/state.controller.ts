import { Controller, Get, Param } from '@nestjs/common';
import { State } from './state.entity';
import { StateService } from './state.service';

@Controller('states')
export class StateController {

    constructor(private readonly stateService: StateService) { }

    @Get('/find-by-scope/:scope')
    async findByScope(@Param('scope') scope: string): Promise<State[]> {
        return await this.stateService.findByScope(scope);
    }

    @Get()
    async findAll(): Promise<State[]> {
        return await this.stateService.findAll();
    }
    

}
