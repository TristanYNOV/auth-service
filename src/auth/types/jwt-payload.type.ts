import { UserRole } from '../../schemas/User.schema';

export interface JwtPayload {
  sub: string;
  email: string;
  pseudo: string;
  roles: UserRole[];
  iat?: number;
  exp?: number;
}
