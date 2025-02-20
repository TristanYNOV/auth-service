import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { AuthPayloadDto } from "./dto/auth.dto";
import { UserService } from "../user/User.service";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";


@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService, private readonly jwtService: JwtService) {}

  async validateUser(user: AuthPayloadDto) {
    console.log('user',user)
    const findUser = await this.userService.getUserByEmail(user.email);
    if(!findUser) return null;

    const isPasswordValid = await bcrypt.compare(user.password, findUser.password);
    if(isPasswordValid) {
      const {password,...user} = findUser;
      return this.jwtService.sign(user);
    } else throw new HttpException("Invalid credentials", HttpStatus.UNAUTHORIZED);
  }
}
