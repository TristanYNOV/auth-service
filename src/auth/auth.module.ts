import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserService } from '../user/User.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../schemas/User.schema';
import {
  RefreshSession,
  RefreshSessionSchema,
} from '../schemas/RefreshSession.schema';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import * as process from 'node:process';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { InternalAuthController } from './internal-auth.controller';

function buildSignOptions(): JwtSignOptions {
  const signOptions: JwtSignOptions = {
    algorithm: 'HS256',
    expiresIn: process.env.JWT_EXPIRES_IN as string,
  };

  if (process.env.JWT_ISSUER) {
    signOptions.issuer = process.env.JWT_ISSUER;
  }

  if (process.env.JWT_AUDIENCE) {
    signOptions.audience = process.env.JWT_AUDIENCE;
  }

  return signOptions;
}

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: RefreshSession.name,
        schema: RefreshSessionSchema,
      },
    ]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET as string,
      signOptions: buildSignOptions(),
    }),
  ],
  controllers: [AuthController, InternalAuthController],
  providers: [AuthService, LocalStrategy, UserService, JwtStrategy],
})
export class AuthModule {}
