import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import * as process from 'node:process';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtPayload } from '../types/jwt-payload.type';
import { UserService } from '../../user/User.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UserService) {
    const strategyOptions: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET as string,
      algorithms: ['HS256'],
    };

    if (process.env.JWT_ISSUER) {
      strategyOptions.issuer = process.env.JWT_ISSUER;
    }

    if (process.env.JWT_AUDIENCE) {
      strategyOptions.audience = process.env.JWT_AUDIENCE;
    }

    super(strategyOptions);
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const user = await this.userService.getUserById(payload.sub);
    if (!this.userService.isUserActive(user)) {
      throw new UnauthorizedException('Unauthorized: user is not active.');
    }

    return payload;
  }
}
