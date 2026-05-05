import { INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { Types } from 'mongoose';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { JwtGuard } from '../src/auth/guards/jwt.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { LocalStrategy } from '../src/auth/strategies/local.strategy';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { MeController } from '../src/me.controller';
import { UpdateUserDto } from '../src/schemas/UpdateUser.schema';
import { AdminController } from '../src/admin/admin.controller';
import { UserController } from '../src/user/User.controller';
import { UserService } from '../src/user/User.service';
import { CreateUserDto } from '../src/user/dto/CreateUser.dto';
import { UserRole } from '../src/schemas/User.schema';
import { encryptPassword } from '../src/utils/bcrypt';
import { RefreshSession } from '../src/schemas/RefreshSession.schema';
import { UserDeletionService } from '../src/user-deletion/user-deletion.service';

type StoredUser = {
  _id: string;
  email: string;
  pseudo: string;
  password: string;
  roles: UserRole[];
  status?: 'active' | 'pending_deletion' | 'deleted' | 'deletion_failed';
};

function toPublicUser(user: StoredUser): Omit<StoredUser, 'password'> {
  return {
    _id: user._id,
    email: user.email,
    pseudo: user.pseudo,
    roles: user.roles,
    status: user.status,
  };
}

function getSetCookieValues(headers: Record<string, unknown>): string[] {
  const headerValue = headers['set-cookie'];
  if (Array.isArray(headerValue)) {
    return headerValue.filter(
      (value): value is string => typeof value === 'string',
    );
  }

  if (typeof headerValue === 'string') {
    return [headerValue];
  }

  return [];
}

function extractAccessTokenFromResponse(response: request.Response): string {
  return response.body.accessToken as string;
}

class InMemoryUserService {
  private readonly users = new Map<string, StoredUser>();

  async createUser(
    createUserDto: CreateUserDto & { roles?: string[] },
  ): Promise<StoredUser> {
    const id = new Types.ObjectId().toString();
    const user: StoredUser = {
      _id: id,
      email: createUserDto.email,
      pseudo: createUserDto.pseudo,
      password: createUserDto.password,
      roles: ['user'],
      status: 'active',
    };

    this.users.set(id, user);

    return { ...user };
  }

  async createAdminUser(payload: {
    pseudo: string;
    email: string;
    password: string;
  }): Promise<StoredUser> {
    const id = new Types.ObjectId().toString();
    const admin: StoredUser = {
      _id: id,
      email: payload.email,
      pseudo: payload.pseudo,
      password: payload.password,
      roles: ['admin'],
      status: 'active',
    };

    this.users.set(id, admin);
    return { ...admin };
  }

  async countAdminUsers(): Promise<number> {
    return Array.from(this.users.values()).filter((u) =>
      u.roles.includes('admin'),
    ).length;
  }

  async getAllUsers(): Promise<Array<Omit<StoredUser, 'password'>>> {
    return Array.from(this.users.values()).map((u) => toPublicUser(u));
  }

  async getUserById(id: string): Promise<Omit<StoredUser, 'password'> | null> {
    const user = this.users.get(id);
    if (!user) return null;

    return toPublicUser(user);
  }

  async getUserByEmailWithPassword(email: string): Promise<StoredUser | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return { ...user };
      }
    }

    return null;
  }

  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto & Partial<StoredUser>,
  ): Promise<Omit<StoredUser, 'password'> | null> {
    const currentUser = this.users.get(id);
    if (!currentUser) return null;

    const nextUser: StoredUser = {
      ...currentUser,
      ...updateUserDto,
    };
    this.users.set(id, nextUser);

    return toPublicUser(nextUser);
  }

  async deleteUserById(
    id: string,
  ): Promise<Omit<StoredUser, 'password'> | null> {
    const currentUser = this.users.get(id);
    if (!currentUser) return null;

    this.users.delete(id);
    return toPublicUser(currentUser);
  }

  isUserActive(user: Pick<StoredUser, 'status'> | null | undefined): boolean {
    return !user?.status || user.status === 'active';
  }
}

class InMemoryUserDeletionService {
  constructor(private readonly userService: InMemoryUserService) {}

  async requestDeletion(
    userId: string,
    requestedBy: 'self' | 'admin' | 'system',
    reason: 'user_request' | 'admin_action' | 'test' | 'unknown',
  ) {
    const user = await this.userService.updateUser(userId, {
      status: 'pending_deletion',
    } as Partial<StoredUser> & UpdateUserDto);

    if (!user) {
      return null;
    }

    return {
      user,
      workflow: {
        userId,
        requestedBy,
        reason,
        status: 'anonymizing',
        correlationId: new Types.ObjectId().toString(),
      },
    };
  }
}

type RefreshSessionRecord = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  refreshTokenHash: string;
  createdAt: Date;
  expiresAt: Date;
  revokedAt?: Date;
  rotatedFromHash?: string;
  userAgent?: string;
  lastUsedAt?: Date;
  deviceLabel?: string;
  save: () => Promise<void>;
};

type RefreshSessionFilter = {
  userId?: Types.ObjectId;
  refreshTokenHash?: string;
  revokedAt?: { $eq: null };
  expiresAt?: { $gt: Date };
  _id?: { $in: Types.ObjectId[] };
};

function matchesFilter(
  session: RefreshSessionRecord,
  filter: RefreshSessionFilter,
): boolean {
  if (
    filter.refreshTokenHash &&
    session.refreshTokenHash !== filter.refreshTokenHash
  ) {
    return false;
  }

  if (filter.userId && session.userId.toString() !== filter.userId.toString()) {
    return false;
  }

  if (filter.revokedAt && filter.revokedAt.$eq === null && session.revokedAt) {
    return false;
  }

  if (filter.expiresAt && !(session.expiresAt > filter.expiresAt.$gt)) {
    return false;
  }

  if (
    filter._id &&
    !filter._id.$in.some((id) => id.toString() === session._id.toString())
  ) {
    return false;
  }

  return true;
}

class InMemoryRefreshSessionModel {
  private readonly sessions: RefreshSessionRecord[] = [];

  async create(
    data: Omit<RefreshSessionRecord, '_id' | 'save'>,
  ): Promise<RefreshSessionRecord> {
    const session: RefreshSessionRecord = {
      ...data,
      _id: new Types.ObjectId(),
      save: async () => Promise.resolve(),
    };
    this.sessions.push(session);
    return session;
  }

  findOne(filter: RefreshSessionFilter): {
    exec: () => Promise<RefreshSessionRecord | null>;
  } {
    return {
      exec: async () => {
        const found = this.sessions.find((session) =>
          matchesFilter(session, filter),
        );
        return found ?? null;
      },
    };
  }

  find(filter: RefreshSessionFilter): {
    sort: (value: { createdAt: 1 | -1 }) => {
      exec: () => Promise<RefreshSessionRecord[]>;
    };
    exec: () => Promise<RefreshSessionRecord[]>;
  } {
    const getFiltered = (): RefreshSessionRecord[] =>
      this.sessions.filter((session) => matchesFilter(session, filter));

    return {
      sort: (value: { createdAt: 1 | -1 }) => ({
        exec: async () => {
          const sorted = [...getFiltered()].sort((a, b) => {
            if (value.createdAt === 1) {
              return a.createdAt.getTime() - b.createdAt.getTime();
            }

            return b.createdAt.getTime() - a.createdAt.getTime();
          });

          return sorted;
        },
      }),
      exec: async () => getFiltered(),
    };
  }

  findById(id: string): { exec: () => Promise<RefreshSessionRecord | null> } {
    return {
      exec: async () => {
        const found = this.sessions.find(
          (session) => session._id.toString() === id,
        );
        return found ?? null;
      },
    };
  }

  updateOne(
    filter: RefreshSessionFilter,
    update: { $set: { revokedAt: Date } },
  ): { exec: () => Promise<void> } {
    return {
      exec: async () => {
        const found = this.sessions.find((session) =>
          matchesFilter(session, filter),
        );
        if (found) {
          found.revokedAt = update.$set.revokedAt;
        }
      },
    };
  }

  updateMany(
    filter: RefreshSessionFilter,
    update: { $set: { revokedAt: Date } },
  ): { exec: () => Promise<void> } {
    return {
      exec: async () => {
        this.sessions.forEach((session) => {
          if (matchesFilter(session, filter)) {
            session.revokedAt = update.$set.revokedAt;
          }
        });
      },
    };
  }
}

describe('Auth flow and RBAC (e2e)', () => {
  let app: INestApplication;
  let server: ReturnType<INestApplication['getHttpServer']>;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'e2e-secret';
    process.env.JWT_EXPIRES_IN = '15m';
    process.env.MAX_SESSIONS_PER_USER = '3';

    const refreshSessionModel = new InMemoryRefreshSessionModel();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({
          secret: process.env.JWT_SECRET,
          signOptions: {
            algorithm: 'HS256',
            expiresIn: process.env.JWT_EXPIRES_IN,
          },
        }),
      ],
      controllers: [
        UserController,
        AuthController,
        MeController,
        AdminController,
      ],
      providers: [
        { provide: UserService, useClass: InMemoryUserService },
        {
          provide: getModelToken(RefreshSession.name),
          useValue: refreshSessionModel,
        },
        AuthService,
        LocalStrategy,
        JwtStrategy,
        JwtGuard,
        RolesGuard,
        {
          provide: UserDeletionService,
          useFactory: (userService: InMemoryUserService) =>
            new InMemoryUserDeletionService(userService),
          inject: [UserService],
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
    server = app.getHttpServer();

    const userService = moduleFixture.get<UserService>(UserService);
    await userService.createAdminUser({
      email: 'admin@example.com',
      password: await encryptPassword('StrongPass1!'),
      pseudo: 'admin',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('login sets refresh cookie and refresh returns {accessToken}', async () => {
    const email = `refresh_${Date.now()}@example.com`;
    const password = 'StrongPass1!';
    const pseudo = `refresh_user_${Date.now()}`;

    await request(server)
      .post('/users')
      .send({ email, password, pseudo })
      .expect(201);

    const loginResponse = await request(server)
      .post('/auth/login')
      .set('User-Agent', 'e2e-agent')
      .send({ email, password })
      .expect(201);

    const refreshCookie = getSetCookieValues(loginResponse.headers).find(
      (cookie) => cookie.startsWith('refreshToken='),
    );

    expect(refreshCookie).toContain('HttpOnly');
    expect(refreshCookie).toContain('SameSite=Lax');
    expect(refreshCookie).toBeDefined();

    const refreshResponse = await request(server)
      .post('/auth/refresh')
      .set('Cookie', refreshCookie as string)
      .expect(200);

    expect(refreshResponse.body).toHaveProperty('accessToken');

    const rotatedCookie = getSetCookieValues(refreshResponse.headers).find(
      (cookie) => cookie.startsWith('refreshToken='),
    );
    expect(rotatedCookie).toBeDefined();

    await request(server)
      .post('/auth/refresh')
      .set('Cookie', refreshCookie as string)
      .expect(401);

    await request(server)
      .post('/auth/refresh')
      .set('Cookie', rotatedCookie as string)
      .expect(200);
  });

  it('login -> sessions returns at least one active session without token hash', async () => {
    const email = `sessions_${Date.now()}@example.com`;
    const password = 'StrongPass1!';
    const pseudo = `sessions_user_${Date.now()}`;

    await request(server)
      .post('/users')
      .send({ email, password, pseudo })
      .expect(201);

    const loginResponse = await request(server)
      .post('/auth/login')
      .set('User-Agent', 'sessions-agent')
      .send({ email, password })
      .expect(201);

    const accessToken = extractAccessTokenFromResponse(loginResponse);

    const sessionsResponse = await request(server)
      .get('/auth/sessions')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(sessionsResponse.body)).toBe(true);
    expect(sessionsResponse.body.length).toBeGreaterThan(0);
    expect(sessionsResponse.body[0]).toHaveProperty('id');
    expect(sessionsResponse.body[0]).toHaveProperty('createdAt');
    expect(sessionsResponse.body[0]).toHaveProperty('expiresAt');
    expect(sessionsResponse.body[0]).toHaveProperty('userAgent');
    expect(sessionsResponse.body[0]).not.toHaveProperty('refreshTokenHash');
  });

  it('revoke specific session removes it from active sessions', async () => {
    const email = `revoke_${Date.now()}@example.com`;
    const password = 'StrongPass1!';
    const pseudo = `revoke_user_${Date.now()}`;

    await request(server)
      .post('/users')
      .send({ email, password, pseudo })
      .expect(201);

    const loginA = await request(server)
      .post('/auth/login')
      .set('User-Agent', 'device-a')
      .send({ email, password })
      .expect(201);

    await request(server)
      .post('/auth/login')
      .set('User-Agent', 'device-b')
      .send({ email, password })
      .expect(201);

    const accessToken = extractAccessTokenFromResponse(loginA);

    const before = await request(server)
      .get('/auth/sessions')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const deviceB = before.body.find(
      (session: { userAgent?: string }) => session.userAgent === 'device-b',
    ) as { id: string } | undefined;

    expect(deviceB).toBeDefined();

    await request(server)
      .delete(`/auth/sessions/${deviceB?.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect({ message: 'Session revoked' });

    const after = await request(server)
      .get('/auth/sessions')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(
      after.body.some((session: { id: string }) => session.id === deviceB?.id),
    ).toBe(false);
  });

  it('logout all revokes active sessions and refresh fails with 401', async () => {
    const email = `logout_all_${Date.now()}@example.com`;
    const password = 'StrongPass1!';
    const pseudo = `logout_all_user_${Date.now()}`;

    await request(server)
      .post('/users')
      .send({ email, password, pseudo })
      .expect(201);

    const loginResponse = await request(server)
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    const accessToken = extractAccessTokenFromResponse(loginResponse);
    const refreshCookie = getSetCookieValues(loginResponse.headers).find(
      (cookie) => cookie.startsWith('refreshToken='),
    );

    expect(refreshCookie).toBeDefined();

    await request(server)
      .delete('/auth/sessions')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect({ message: 'Logged out' });

    const sessionsAfter = await request(server)
      .get('/auth/sessions')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(sessionsAfter.body).toEqual([]);

    await request(server)
      .post('/auth/refresh')
      .set('Cookie', refreshCookie as string)
      .expect(401);
  });

  it('session cap keeps only MAX_SESSIONS_PER_USER active sessions', async () => {
    const email = `cap_${Date.now()}@example.com`;
    const password = 'StrongPass1!';
    const pseudo = `cap_user_${Date.now()}`;

    await request(server)
      .post('/users')
      .send({ email, password, pseudo })
      .expect(201);

    const cookies: string[] = [];
    let accessToken = '';
    for (let index = 0; index < 5; index += 1) {
      const loginResponse = await request(server)
        .post('/auth/login')
        .set('User-Agent', `cap-device-${index}`)
        .send({ email, password })
        .expect(201);

      accessToken = extractAccessTokenFromResponse(loginResponse);
      const refreshCookie = getSetCookieValues(loginResponse.headers).find(
        (cookie) => cookie.startsWith('refreshToken='),
      );
      if (refreshCookie) {
        cookies.push(refreshCookie);
      }
    }

    const sessionsResponse = await request(server)
      .get('/auth/sessions')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(sessionsResponse.body.length).toBe(3);

    await request(server)
      .post('/auth/refresh')
      .set('Cookie', cookies[0])
      .expect(401);

    await request(server)
      .post('/auth/refresh')
      .set('Cookie', cookies[cookies.length - 1])
      .expect(200);
  });

  it('DELETE /me starts deletion workflow and blocks login, refresh, and protected routes', async () => {
    const email = `delete_me_${Date.now()}@example.com`;
    const password = 'StrongPass1!';
    const pseudo = `delete_me_user_${Date.now()}`;

    await request(server)
      .post('/users')
      .send({ email, password, pseudo })
      .expect(201);

    const loginResponse = await request(server)
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    const accessToken = extractAccessTokenFromResponse(loginResponse);
    const refreshCookie = getSetCookieValues(loginResponse.headers).find(
      (cookie) => cookie.startsWith('refreshToken='),
    );

    await request(server)
      .delete('/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.message).toBe('User deletion workflow started');
      });

    await request(server)
      .post('/auth/login')
      .send({ email, password })
      .expect(401);
    await request(server)
      .post('/auth/refresh')
      .set('Cookie', refreshCookie as string)
      .expect(401);
    await request(server)
      .get('/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(401);
  });

  it('DELETE /admin/users/:id starts deletion workflow for admins', async () => {
    const adminLogin = await request(server)
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'StrongPass1!' })
      .expect(201);

    const target = await request(server)
      .post('/users')
      .send({
        email: `admin_delete_${Date.now()}@example.com`,
        password: 'StrongPass1!',
        pseudo: `admin_delete_user_${Date.now()}`,
      })
      .expect(201);

    await request(server)
      .delete(`/admin/users/${target.body.id}`)
      .set(
        'Authorization',
        `Bearer ${extractAccessTokenFromResponse(adminLogin)}`,
      )
      .expect(200)
      .expect((response) => {
        expect(response.body.message).toBe('User deletion workflow started');
      });
  });
});
