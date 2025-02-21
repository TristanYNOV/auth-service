import { Body, Controller, Get, HttpException, HttpStatus, Post, Req, Res, UseGuards } from "@nestjs/common";
import { AuthPayloadDto } from "./dto/auth.dto";
import { AuthService } from "./auth.service";
import { LocalGuard } from "./guards/local.guard";
import { JwtGuard } from "./guards/jwt.guard";

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}


  @Post('login')
  @UseGuards(LocalGuard)
  async login(@Req() req) {

    return req.user;
  }

  @Get('test')
  @UseGuards(JwtGuard)
  test(@Req() req: Request) {
    console.log('inside Auth controller and Get test', req)
  }

}
