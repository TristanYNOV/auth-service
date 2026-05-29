import { UnauthorizedException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  const userId = new Types.ObjectId('507f1f77bcf86cd799439011');

  function buildController() {
    const authService = {
      createRefreshToken: jest.fn().mockReturnValue('refresh-token-new'),
      hashRefreshToken: jest.fn((token: string) => `hash:${token}`),
      createRefreshSession: jest.fn().mockResolvedValue(undefined),
      findActiveRefreshSessionByHash: jest.fn(),
      buildAccessTokenForUserId: jest
        .fn()
        .mockResolvedValue('access-token-rotated'),
      revokeRefreshSessionByHash: jest.fn().mockResolvedValue(undefined),
      listUserSessions: jest.fn().mockResolvedValue([]),
      revokeUserSessionById: jest.fn().mockResolvedValue(undefined),
      revokeAllUserSessions: jest.fn().mockResolvedValue(undefined),
    };

    const response = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };

    return {
      controller: new AuthController(authService as unknown as AuthService),
      authService,
      response,
    };
  }

  function buildRequest(cookie?: string, userAgent = 'Jest') {
    return {
      headers: cookie ? { cookie } : {},
      get: jest.fn((header: string) =>
        header.toLowerCase() === 'user-agent' ? userAgent : undefined,
      ),
      user: {
        accessToken: 'access-token',
        userId,
        sub: userId.toString(),
      },
    };
  }

  it('creates a refresh session and sets an httpOnly cookie during login', async () => {
    const { controller, authService, response } = buildController();

    const result = await controller.login(
      buildRequest() as never,
      response as never,
    );

    expect(result).toEqual({ accessToken: 'access-token' });
    expect(authService.createRefreshSession).toHaveBeenCalledWith({
      userId,
      refreshTokenHash: 'hash:refresh-token-new',
      userAgent: 'Jest',
    });
    expect(response.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'refresh-token-new',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/auth',
      }),
    );
  });

  it('rotates a valid refresh token and revokes the old session', async () => {
    const { controller, authService, response } = buildController();
    authService.findActiveRefreshSessionByHash.mockResolvedValue({
      userId,
    });

    const result = await controller.refresh(
      buildRequest('refreshToken=refresh-token-old') as never,
      response as never,
    );

    expect(result).toEqual({ accessToken: 'access-token-rotated' });
    expect(authService.findActiveRefreshSessionByHash).toHaveBeenCalledWith(
      'hash:refresh-token-old',
    );
    expect(authService.createRefreshSession).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        refreshTokenHash: 'hash:refresh-token-new',
        rotatedFromHash: 'hash:refresh-token-old',
        lastUsedAt: expect.any(Date),
      }),
    );
    expect(authService.revokeRefreshSessionByHash).toHaveBeenCalledWith(
      'hash:refresh-token-old',
    );
    expect(response.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'refresh-token-new',
      expect.any(Object),
    );
  });

  it('rejects refresh without a refresh cookie', async () => {
    const { controller, response } = buildController();

    await expect(
      controller.refresh(buildRequest() as never, response as never),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('revokes the current refresh session and clears the cookie during logout', async () => {
    const { controller, authService, response } = buildController();

    const result = await controller.logout(
      buildRequest('refreshToken=refresh-token-old') as never,
      response as never,
    );

    expect(result).toEqual({ message: 'Logged out' });
    expect(authService.revokeRefreshSessionByHash).toHaveBeenCalledWith(
      'hash:refresh-token-old',
    );
    expect(response.clearCookie).toHaveBeenCalledWith(
      'refreshToken',
      expect.objectContaining({ path: '/auth' }),
    );
  });

  it('uses the JWT subject when listing and revoking user sessions', async () => {
    const { controller, authService, response } = buildController();

    await controller.listSessions(buildRequest() as never);
    await controller.revokeSessionById(buildRequest() as never, 'session-1');
    await controller.revokeAllSessions(
      buildRequest() as never,
      response as never,
    );

    expect(authService.listUserSessions).toHaveBeenCalledWith(
      userId.toString(),
    );
    expect(authService.revokeUserSessionById).toHaveBeenCalledWith(
      userId.toString(),
      'session-1',
    );
    expect(authService.revokeAllUserSessions).toHaveBeenCalledWith(
      userId.toString(),
    );
  });
});
