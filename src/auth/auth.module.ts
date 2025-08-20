import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { authEntities } from './entities/index';
import { AuthGuard } from './middlewares/auth.middleware';
import { JwtService } from './jwt/jwt.service';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';
import { RolesController } from './roles/roles.controller';
import { PermissionsController } from './permissions/permissions.controller';
import { PermissionsService } from './permissions/permissions.service';
import { RolesService } from './roles/roles.service';

//Este modulo es reutilizado por lo que se maneja distinto
@Module({
  imports: [
    TypeOrmModule.forFeature(authEntities),
  ],
  controllers: [UsersController, RolesController, PermissionsController],
  providers: [AuthGuard, JwtService, UsersService, PermissionsService, RolesService],
})
export class AuthModule {}
