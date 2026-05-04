import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { Injectable } from '@nestjs/common';
import {
  authLoginAttemptsTotal,
  authLoginFailedTotal,
  authLoginSuccessTotal,
} from '../../observability/metrics';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(username: string, password: string) {
    try {
      const user = await this.authService.validateUser({
        email: username,
        password: password,
      });

      authLoginAttemptsTotal.labels('success', 'unknown').inc();
      authLoginSuccessTotal.labels('success').inc();
      return user;
    } catch (error) {
      authLoginAttemptsTotal.labels('failure', 'invalid_credentials').inc();
      authLoginFailedTotal.labels('failure', 'invalid_credentials').inc();
      throw error;
    }
  }
}
