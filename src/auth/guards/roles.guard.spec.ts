import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  function buildContext(roles?: string[]) {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: roles === undefined ? undefined : { roles },
        }),
      }),
    };
  }

  it('allows routes without role metadata', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    };
    const guard = new RolesGuard(reflector as unknown as Reflector);

    expect(guard.canActivate(buildContext(['user']) as never)).toBe(true);
  });

  it('allows users with one of the required roles', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['admin']),
    };
    const guard = new RolesGuard(reflector as unknown as Reflector);

    expect(guard.canActivate(buildContext(['user', 'admin']) as never)).toBe(
      true,
    );
  });

  it('rejects authenticated users without the required admin role', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['admin']),
    };
    const guard = new RolesGuard(reflector as unknown as Reflector);

    expect(() => guard.canActivate(buildContext(['user']) as never)).toThrow(
      ForbiddenException,
    );
  });

  it('rejects malformed roles instead of trusting arbitrary strings', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['admin']),
    };
    const guard = new RolesGuard(reflector as unknown as Reflector);

    expect(() =>
      guard.canActivate(buildContext(['admin', 'owner']) as never),
    ).toThrow(ForbiddenException);
  });
});
