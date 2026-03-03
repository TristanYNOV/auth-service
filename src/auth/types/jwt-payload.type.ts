export interface JwtPayload {
  sub: string;
  email: string;
  pseudo: string;
  iat?: number;
  exp?: number;
}
