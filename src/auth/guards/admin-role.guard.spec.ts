import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AdminRoleGuard } from './admin-role.guard';

function createExecutionContext(roles: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        user: { roles },
      }),
    }),
  } as ExecutionContext;
}

describe('AdminRoleGuard', () => {
  it('allows admin users', () => {
    const guard = new AdminRoleGuard();

    const canActivate = guard.canActivate(createExecutionContext(['admin']));

    expect(canActivate).toBe(true);
  });

  it('rejects non-admin users', () => {
    const guard = new AdminRoleGuard();

    expect(() => guard.canActivate(createExecutionContext(['user']))).toThrow(
      ForbiddenException,
    );
  });

  it('rejects request without roles', () => {
    const guard = new AdminRoleGuard();

    expect(() => guard.canActivate(createExecutionContext(undefined))).toThrow(
      ForbiddenException,
    );
  });
});
