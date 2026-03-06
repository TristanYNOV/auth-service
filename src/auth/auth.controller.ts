import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './guards/local.guard';
import { RequestWithTokenUser } from './types/authenticated-request.type';

@Controller('auth')
export class AuthController {
  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(@Req() req: RequestWithTokenUser): Promise<string> {
    return req.user;
  }
}
