import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../schemas/User.schema';
import { UserService } from './User.service';
import { UserController } from './User.controller';
import { MeController } from '../me.controller';
import { AdminController } from '../admin/admin.controller';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminBootstrapProvider } from './providers/admin-bootstrap.provider';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],
  providers: [UserService, RolesGuard, AdminBootstrapProvider],
  controllers: [UserController, MeController, AdminController],
  exports: [UserService],
})
export class UserModule {}
