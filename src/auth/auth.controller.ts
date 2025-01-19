import { Body, Controller, HttpException, HttpStatus, Post } from "@nestjs/common";
import { AuthPayloadDto } from "./dto/auth.dto";
import { AuthService } from "./auth.service";
import { HttpErrorByCode } from "@nestjs/common/utils/http-error-by-code.util";

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}


  @Post('login')
  async login(@Body() authPayload: AuthPayloadDto) {
    const user = await this.authService.validateUser(authPayload);
    if(!user) throw new HttpException("Invalid token", HttpStatus.UNAUTHORIZED);

    return user;
  }

}
