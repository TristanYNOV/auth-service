import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { LocalAuthGuard } from './guards/local.guard';
import {
  AuthenticatedRequest,
  RequestWithTokenUser,
} from './types/authenticated-request.type';
import { AuthService, PublicRefreshSession } from './auth.service';
import { Request, Response } from 'express';
import { JwtGuard } from './guards/jwt.guard';

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function readCookie(req: Request, cookieName: string): string | undefined {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) {
    return undefined;
  }

  const cookiePairs = cookieHeader.split(';');
  for (const pair of cookiePairs) {
    const [key, ...valueParts] = pair.trim().split('=');
    if (key === cookieName) {
      return decodeURIComponent(valueParts.join('='));
    }
  }

  return undefined;
}

function getCurrentUserId(req: AuthenticatedRequest): string {
  const userId = req.user?.sub;
  if (!userId) {
    throw new UnauthorizedException(
      'Invalid token payload: missing user identifier',
    );
  }

  return userId;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setRefreshCookie(res: Response, refreshToken: string): void {
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/auth',
      maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    });
  }

  private clearRefreshCookie(res: Response): void {
    res.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/auth',
    });
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(
    @Req() req: RequestWithTokenUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const refreshToken = this.authService.createRefreshToken();
    const refreshTokenHash = this.authService.hashRefreshToken(refreshToken);

    await this.authService.createRefreshSession({
      userId: req.user.userId,
      refreshTokenHash,
      userAgent: req.get('user-agent'),
    });

    this.setRefreshCookie(res, refreshToken);

    return { accessToken: req.user.accessToken };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const refreshToken = readCookie(req, REFRESH_COOKIE_NAME);
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token cookie.');
    }

    const oldHash = this.authService.hashRefreshToken(refreshToken);
    const oldSession =
      await this.authService.findActiveRefreshSessionByHash(oldHash);

    if (!oldSession) {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    const accessToken = await this.authService.buildAccessTokenForUserId(
      oldSession.userId.toString(),
    );

    const newRefreshToken = this.authService.createRefreshToken();
    const newHash = this.authService.hashRefreshToken(newRefreshToken);

    await this.authService.createRefreshSession({
      userId: oldSession.userId,
      refreshTokenHash: newHash,
      rotatedFromHash: oldHash,
      userAgent: req.get('user-agent'),
      lastUsedAt: new Date(),
    });
    await this.authService.revokeRefreshSessionByHash(oldHash);

    this.setRefreshCookie(res, newRefreshToken);

    return { accessToken };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const refreshToken = readCookie(req, REFRESH_COOKIE_NAME);
    if (refreshToken) {
      const refreshTokenHash = this.authService.hashRefreshToken(refreshToken);
      await this.authService.revokeRefreshSessionByHash(refreshTokenHash);
    }

    this.clearRefreshCookie(res);
    return { message: 'Logged out' };
  }

  @Get('sessions')
  @UseGuards(JwtGuard)
  async listSessions(
    @Req() req: AuthenticatedRequest,
  ): Promise<PublicRefreshSession[]> {
    return this.authService.listUserSessions(getCurrentUserId(req));
  }

  @Delete('sessions/:id')
  @UseGuards(JwtGuard)
  @HttpCode(200)
  async revokeSessionById(
    @Req() req: AuthenticatedRequest,
    @Param('id') sessionId: string,
  ): Promise<{ message: string }> {
    await this.authService.revokeUserSessionById(
      getCurrentUserId(req),
      sessionId,
    );
    return { message: 'Session revoked' };
  }

  @Delete('sessions')
  @UseGuards(JwtGuard)
  @HttpCode(200)
  async revokeAllSessions(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    await this.authService.revokeAllUserSessions(getCurrentUserId(req));
    this.clearRefreshCookie(res);
    return { message: 'Logged out' };
  }
}
