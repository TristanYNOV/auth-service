import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedRequest } from '../types/authenticated-request.type';
import { UserRole } from '../../schemas/User.schema';

function isUserRole(value: string): value is UserRole {
  return value === 'user' || value === 'admin';
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const currentUser = request.user;

    if (!currentUser) {
      return true;
    }

    const userRoles = currentUser.roles;
    if (!Array.isArray(userRoles) || userRoles.length === 0) {
      throw new ForbiddenException('Forbidden resource');
    }

    const normalizedRoles = userRoles.filter((role) => isUserRole(role));
    if (normalizedRoles.length !== userRoles.length) {
      throw new ForbiddenException('Forbidden resource');
    }

    const hasRole = requiredRoles.some((role) => normalizedRoles.includes(role));
    if (!hasRole) {
      throw new ForbiddenException('Forbidden resource');
    }

    return true;
  }
}
