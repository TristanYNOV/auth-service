import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as process from 'node:process';
import { Injectable } from '@nestjs/common';
import { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process?.env.JWT_SECRET ?? 'secret',
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    return payload;
  }
}
