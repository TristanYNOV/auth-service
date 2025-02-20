import { Body, Controller, HttpException, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { AuthPayloadDto } from "./dto/auth.dto";
import { AuthService } from "./auth.service";
import { LocalGuard } from "./guards/local.guard";

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}


  @Post('login')
  @UseGuards(LocalGuard)
  async login(@Body() authPayload: AuthPayloadDto) {
    const user = await this.authService.validateUser(authPayload);
    if(!user) throw new HttpException("Invalid token", HttpStatus.UNAUTHORIZED);

    return user;
  }

}
