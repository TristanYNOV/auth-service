import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthenticatedRequest } from '../types/authenticated-request.type';
import { UserRole } from '../types/role.type';

function normalizeRoles(rawRoles: unknown): UserRole[] {
  if (Array.isArray(rawRoles)) {
    return rawRoles.filter(
      (role): role is UserRole => role === 'admin' || role === 'user',
    );
  }

  if (typeof rawRoles === 'string') {
    if (rawRoles === 'admin' || rawRoles === 'user') {
      return [rawRoles];
    }
  }

  return [];
}

@Injectable()
export class AdminRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const roles = normalizeRoles(request.user?.roles);

    if (!roles.includes('admin')) {
      throw new ForbiddenException('Admin role is required for this endpoint');
    }

    return true;
  }
}
