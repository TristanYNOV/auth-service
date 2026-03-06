import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthPayloadDto } from './dto/auth.dto';
import { UserService } from '../user/User.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from './types/jwt-payload.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(user: AuthPayloadDto): Promise<string> {
    const findUser = await this.userService.getUserByEmailWithPassword(
      user.email,
    );
    if (!findUser) {
      throw new UnauthorizedException(
        'Unauthorized: invalid credentials or user not found.',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      user.password,
      findUser.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Unauthorized: invalid credentials or user not found.',
      );
    }

    const payload: JwtPayload = {
      sub: findUser._id.toString(),
      pseudo: findUser.pseudo,
      email: findUser.email,
      roles: findUser.roles,
    };

    return this.jwtService.sign(payload);
  }
}
