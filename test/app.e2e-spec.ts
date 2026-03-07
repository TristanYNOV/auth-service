import { INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { randomUUID } from 'node:crypto';
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

type StoredUser = {
  _id: string;
  email: string;
  pseudo: string;
  password: string;
  roles: UserRole[];
};

function toPublicUser(user: StoredUser): Omit<StoredUser, 'password'> {
  return {
    _id: user._id,
    email: user.email,
    pseudo: user.pseudo,
    roles: user.roles,
  };
}

class InMemoryUserService {
  private readonly users = new Map<string, StoredUser>();

  async createUser(
    createUserDto: CreateUserDto & { roles?: string[] },
  ): Promise<StoredUser> {
    const id = randomUUID();
    const user: StoredUser = {
      _id: id,
      email: createUserDto.email,
      pseudo: createUserDto.pseudo,
      password: createUserDto.password,
      roles: ['user'],
    };

    this.users.set(id, user);

    return { ...user };
  }

  async createAdminUser(payload: {
    pseudo: string;
    email: string;
    password: string;
  }): Promise<StoredUser> {
    const id = randomUUID();
    const admin: StoredUser = {
      _id: id,
      email: payload.email,
      pseudo: payload.pseudo,
      password: payload.password,
      roles: ['admin'],
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
    updateUserDto: UpdateUserDto,
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
}

describe('Auth flow and RBAC (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'e2e-secret';
    process.env.JWT_EXPIRES_IN = '30d';

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
        AuthService,
        LocalStrategy,
        JwtStrategy,
        JwtGuard,
        RolesGuard,
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

  it('register -> login -> /me works with Bearer token', async () => {
    const email = `e2e_${Date.now()}@example.com`;
    const password = 'StrongPass1!';
    const pseudo = `e2e_user_${Date.now()}`;

    const registerResponse = await request(app.getHttpServer())
      .post('/users')
      .send({ email, password, pseudo })
      .expect(201);

    expect(registerResponse.body).toMatchObject({ email, pseudo });
    expect(registerResponse.body).not.toHaveProperty('password');

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    const token = loginResponse.text.trim().replace(/^"|"$/g, '');
    const decoded = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64url').toString('utf-8'),
    ) as { sub?: string; email?: string; pseudo?: string; roles?: string[] };

    expect(token).toBeTruthy();
    expect(decoded.sub).toBeTruthy();
    expect(decoded.roles).toEqual(['user']);

    const meResponse = await request(app.getHttpServer())
      .get('/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(meResponse.body).toMatchObject({ email, pseudo });
    expect(meResponse.body).toHaveProperty('id', decoded.sub);
    expect(meResponse.body).not.toHaveProperty('password');
  });

  it('register ignores client-provided roles and keeps user role only', async () => {
    const email = `role_${Date.now()}@example.com`;
    const password = 'StrongPass1!';
    const pseudo = `role_user_${Date.now()}`;

    await request(app.getHttpServer())
      .post('/users')
      .send({ email, password, pseudo, roles: ['admin'] })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    const token = loginResponse.text.trim().replace(/^"|"$/g, '');
    const decoded = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64url').toString('utf-8'),
    ) as { roles?: string[] };

    expect(decoded.roles).toEqual(['user']);
  });

  it('/admin/users returns 401 without token', async () => {
    const response = await request(app.getHttpServer())
      .get('/admin/users')
      .expect(401);

    expect(response.body).toMatchObject({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Unauthorized',
      path: '/admin/users',
    });
    expect(typeof response.body.timestamp).toBe('string');
  });

  it('/admin/users returns 403 with a user token', async () => {
    const email = `rbac_${Date.now()}@example.com`;
    const password = 'StrongPass1!';
    const pseudo = `rbac_user_${Date.now()}`;

    await request(app.getHttpServer())
      .post('/users')
      .send({ email, password, pseudo })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    const userToken = loginResponse.text.trim().replace(/^"|"$/g, '');

    const response = await request(app.getHttpServer())
      .get('/admin/users')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);

    expect(response.body).toMatchObject({
      statusCode: 403,
      error: 'Forbidden',
      message: 'Forbidden resource',
      path: '/admin/users',
    });
    expect(typeof response.body.timestamp).toBe('string');
  });

  it('login token uses HS256 algorithm', async () => {
    const email = `alg_${Date.now()}@example.com`;
    const password = 'StrongPass1!';
    const pseudo = `alg_user_${Date.now()}`;

    await request(app.getHttpServer())
      .post('/users')
      .send({ email, password, pseudo })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    const token = loginResponse.text.trim().replace(/^"|"$/g, '');
    const header = JSON.parse(
      Buffer.from(token.split('.')[0], 'base64url').toString('utf-8'),
    ) as { alg?: string };

    expect(header.alg).toBe('HS256');
  });

  it('invalid login keeps the exact unauthorized message', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'missing@example.com', password: 'wrong-password' })
      .expect(401);

    expect(response.body).toMatchObject({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Unauthorized: invalid credentials or user not found.',
      path: '/auth/login',
    });
    expect(typeof response.body.timestamp).toBe('string');
  });

  it('/admin/users returns 200 with an admin token', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'StrongPass1!' })
      .expect(201);

    const adminToken = loginResponse.text.trim().replace(/^"|"$/g, '');

    const response = await request(app.getHttpServer())
      .get('/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  it('removed /users endpoints return 404', async () => {
    await request(app.getHttpServer()).get('/users').expect(404);
    await request(app.getHttpServer()).get('/users/searchId/123').expect(404);
    await request(app.getHttpServer())
      .get('/users/searchPseudo/someone')
      .expect(404);
    await request(app.getHttpServer())
      .get('/users/searchEmail/test@example.com')
      .expect(404);
    await request(app.getHttpServer()).patch('/users/123').expect(404);
    await request(app.getHttpServer()).delete('/users/123').expect(404);
  });
});
