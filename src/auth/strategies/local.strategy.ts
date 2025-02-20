import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { Injectable } from '@nestjs/common';
import { AuthPayloadDto } from '../dto/auth.dto';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({usernameField: 'pseudo'});
  }

  async validate(authPayloadDto: AuthPayloadDto) {
    console.log('Haaaaa')
    return await this.authService.validateUser(authPayloadDto);
  }
}