import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../schemas/User.schema';
import { UserService } from './User.service';
import { UserController } from './User.controller';
import { MeController } from '../me.controller';
import { AdminRoleGuard } from '../auth/guards/admin-role.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],
  providers: [UserService, AdminRoleGuard],
  controllers: [UserController, MeController],
  exports: [UserService],
})
export class UserModule {}
