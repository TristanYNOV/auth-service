import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
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
      user.email.toLowerCase(),
    );
    if (!findUser) {
      throw new HttpException(
        'Invalid credentials: user does not exist or provided credentials are incorrect',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const isPasswordValid = await bcrypt.compare(
      user.password,
      findUser.password,
    );
    if (!isPasswordValid) {
      throw new HttpException(
        'Invalid credentials: user does not exist or provided credentials are incorrect',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const payload: JwtPayload = {
      sub: findUser._id.toString(),
      pseudo: findUser.pseudo,
      email: findUser.email,
      roles: findUser.roles ?? ['user'],
    };

    return this.jwtService.sign(payload);
  }
}
