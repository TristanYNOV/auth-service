import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthPayloadDto } from './dto/auth.dto';
import { UserService } from '../user/User.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from './types/jwt-payload.type';
import { InjectModel } from '@nestjs/mongoose';
import { RefreshSession } from '../schemas/RefreshSession.schema';
import { FilterQuery, Model, Types } from 'mongoose';
import { createHash, randomBytes } from 'node:crypto';
import { LoginRequestUser } from './types/authenticated-request.type';

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @InjectModel(RefreshSession.name)
    private readonly refreshSessionModel: Model<RefreshSession>,
  ) {}

  async validateUser(user: AuthPayloadDto): Promise<LoginRequestUser> {
    const findUser = await this.userService.getUserByEmailWithPassword(
      user.email,
    );
    if (!findUser) {
      throw new UnauthorizedException(
        'Unauthorized: invalid credentials or user not found.',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      user.password,
      findUser.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Unauthorized: invalid credentials or user not found.',
      );
    }

    const payload: JwtPayload = {
      sub: findUser._id.toString(),
      pseudo: findUser.pseudo,
      email: findUser.email,
      roles: findUser.roles,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      userId: new Types.ObjectId(findUser._id),
    };
  }

  createRefreshToken(): string {
    return randomBytes(48).toString('base64url');
  }

  hashRefreshToken(refreshToken: string): string {
    return createHash('sha256').update(refreshToken).digest('hex');
  }

  buildRefreshExpiryDate(): Date {
    return new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
  }

  async createRefreshSession(payload: {
    userId: Types.ObjectId;
    refreshTokenHash: string;
    userAgent?: string;
    rotatedFromHash?: string;
  }): Promise<void> {
    await this.refreshSessionModel.create({
      userId: payload.userId,
      refreshTokenHash: payload.refreshTokenHash,
      createdAt: new Date(),
      expiresAt: this.buildRefreshExpiryDate(),
      rotatedFromHash: payload.rotatedFromHash,
      userAgent: payload.userAgent,
    });
  }

  signAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload);
  }

  async buildAccessTokenForUserId(userId: string): Promise<string> {
    const user = await this.userService.getUserById(userId);
    if (!user) {
      throw new UnauthorizedException(
        'User linked to refresh token not found.',
      );
    }

    const payload: JwtPayload = {
      sub: userId,
      pseudo: user.pseudo,
      email: user.email,
      roles: user.roles,
    };

    return this.signAccessToken(payload);
  }

  async findActiveRefreshSessionByHash(
    refreshTokenHash: string,
  ): Promise<RefreshSession | null> {
    const filter: FilterQuery<RefreshSession> = {
      refreshTokenHash,
      revokedAt: { $eq: null },
      expiresAt: { $gt: new Date() },
    };

    return this.refreshSessionModel.findOne(filter).exec();
  }

  async revokeRefreshSessionByHash(refreshTokenHash: string): Promise<void> {
    await this.refreshSessionModel
      .updateOne(
        {
          refreshTokenHash,
          revokedAt: { $eq: null },
        },
        { $set: { revokedAt: new Date() } },
      )
      .exec();
  }
}
