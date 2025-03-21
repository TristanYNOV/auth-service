import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserService } from "../user/User.service";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "../schemas/User.schema";
import { JwtModule } from "@nestjs/jwt";
import * as process from "node:process";
import { PassportModule } from "@nestjs/passport";
import { LocalStrategy } from "./strategies/local.strategy";
import { JwtStrategy } from "./strategies/jwt.strategy";

@Module({
  imports: [
    MongooseModule.forFeature([{
      name: User.name,
      schema: UserSchema
    }]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret',
      signOptions: {expiresIn: process.env.JWT_EXPIRES_IN || '30d'}
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy ,UserService, JwtStrategy],
})
export class AuthModule {}
