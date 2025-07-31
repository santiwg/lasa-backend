import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';
import { auth_module_entities } from '../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature(auth_module_entities)
  ],
  controllers: [UserController],
  providers: [UserService]
})
export class AuthModule {}
