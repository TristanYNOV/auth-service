import { UserRole } from './role.type';

export interface JwtPayload {
  sub: string;
  email: string;
  pseudo: string;
  roles: UserRole[];
  iat?: number;
  exp?: number;
}
