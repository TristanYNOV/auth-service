import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserService } from "../user/User.service";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "../schemas/User.schema";
import { JwtModule } from "@nestjs/jwt";
import * as process from "node:process";

@Module({
  imports: [
    MongooseModule.forFeature([{
      name: User.name,
      schema: UserSchema
    }]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret',
      signOptions: {expiresIn: '30d'}
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, UserService],
})
export class AuthModule {}
