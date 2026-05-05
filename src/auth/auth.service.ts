import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthPayloadDto } from './dto/auth.dto';
import { UserService } from '../user/User.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from './types/jwt-payload.type';
import { InjectModel } from '@nestjs/mongoose';
import {
  RefreshSession,
  RefreshSessionDocument,
} from '../schemas/RefreshSession.schema';
import { FilterQuery, Model, Types } from 'mongoose';
import { createHash, randomBytes } from 'node:crypto';
import { LoginRequestUser } from './types/authenticated-request.type';

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const DEFAULT_MAX_SESSIONS_PER_USER = 10;

export type PublicRefreshSession = {
  id: string;
  createdAt: Date;
  expiresAt: Date;
  revokedAt?: Date;
  lastUsedAt?: Date;
  userAgent?: string;
};

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

    if (!this.userService.isUserActive(findUser)) {
      throw new UnauthorizedException('Unauthorized: user is not active.');
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

  private getMaxSessionsPerUser(): number {
    const rawValue = process.env.MAX_SESSIONS_PER_USER;
    const parsedValue = Number(rawValue);

    if (
      !rawValue ||
      !Number.isFinite(parsedValue) ||
      !Number.isInteger(parsedValue) ||
      parsedValue < 1
    ) {
      return DEFAULT_MAX_SESSIONS_PER_USER;
    }

    return parsedValue;
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
    lastUsedAt?: Date;
  }): Promise<void> {
    const createdSession = await this.refreshSessionModel.create({
      userId: payload.userId,
      refreshTokenHash: payload.refreshTokenHash,
      createdAt: new Date(),
      expiresAt: this.buildRefreshExpiryDate(),
      rotatedFromHash: payload.rotatedFromHash,
      userAgent: payload.userAgent,
      lastUsedAt: payload.lastUsedAt,
    });

    await this.enforceSessionCap(payload.userId.toString(), createdSession._id);
  }

  private async enforceSessionCap(
    userId: string,
    keepSessionId: Types.ObjectId,
  ): Promise<void> {
    const maxSessionsPerUser = this.getMaxSessionsPerUser();
    const activeSessions = await this.refreshSessionModel
      .find({
        userId: new Types.ObjectId(userId),
        revokedAt: { $eq: null },
        expiresAt: { $gt: new Date() },
      })
      .sort({ createdAt: 1 })
      .exec();

    if (activeSessions.length <= maxSessionsPerUser) {
      return;
    }

    const sessionsToRevokeCount = activeSessions.length - maxSessionsPerUser;
    const sessionsToRevoke = activeSessions
      .filter((session) => !session._id.equals(keepSessionId))
      .slice(0, sessionsToRevokeCount);

    if (sessionsToRevoke.length === 0) {
      return;
    }

    await this.refreshSessionModel
      .updateMany(
        {
          _id: {
            $in: sessionsToRevoke.map((session) => session._id),
          },
          revokedAt: { $eq: null },
        },
        {
          $set: {
            revokedAt: new Date(),
          },
        },
      )
      .exec();
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

    if (!this.userService.isUserActive(user)) {
      throw new UnauthorizedException(
        'User linked to refresh token is not active.',
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
  ): Promise<RefreshSessionDocument | null> {
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

  async listUserSessions(userId: string): Promise<PublicRefreshSession[]> {
    const sessions = await this.refreshSessionModel
      .find({
        userId: new Types.ObjectId(userId),
        revokedAt: { $eq: null },
        expiresAt: { $gt: new Date() },
      })
      .sort({ createdAt: -1 })
      .exec();

    return sessions.map((session) => this.toPublicSession(session));
  }

  async revokeUserSessionById(
    userId: string,
    sessionId: string,
  ): Promise<void> {
    const session = await this.refreshSessionModel.findById(sessionId).exec();

    if (!session) {
      return;
    }

    if (session.userId.toString() !== userId) {
      throw new ForbiddenException('Forbidden resource');
    }

    if (session.revokedAt || session.expiresAt <= new Date()) {
      return;
    }

    session.revokedAt = new Date();
    await session.save();
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.refreshSessionModel
      .updateMany(
        {
          userId: new Types.ObjectId(userId),
          revokedAt: { $eq: null },
          expiresAt: { $gt: new Date() },
        },
        {
          $set: {
            revokedAt: new Date(),
          },
        },
      )
      .exec();
  }

  private toPublicSession(
    session: RefreshSessionDocument,
  ): PublicRefreshSession {
    return {
      id: session._id.toString(),
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      revokedAt: session.revokedAt,
      lastUsedAt: session.lastUsedAt,
      userAgent: session.userAgent,
    };
  }
}
