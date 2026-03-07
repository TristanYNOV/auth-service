import { Request } from 'express';
import { JwtPayload } from './jwt-payload.type';
import { Types } from 'mongoose';

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

export interface LoginRequestUser {
  accessToken: string;
  userId: Types.ObjectId;
}

export interface RequestWithTokenUser extends Request {
  user: LoginRequestUser;
}
