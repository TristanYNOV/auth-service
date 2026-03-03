import { INestApplication } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { randomUUID } from 'node:crypto';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { JwtGuard } from '../src/auth/guards/jwt.guard';
import { LocalStrategy } from '../src/auth/strategies/local.strategy';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { MeController } from '../src/me.controller';
import { UpdateUserDto } from '../src/schemas/UpdateUser.schema';
import { UserController } from '../src/user/User.controller';
import { UserService } from '../src/user/User.service';
import { CreateUserDto } from '../src/user/dto/CreateUser.dto';

type StoredUser = {
  _id: string;
  email: string;
  pseudo: string;
  password: string;
};

function toPublicUser(user: StoredUser): Omit<StoredUser, 'password'> {
  return {
    _id: user._id,
    email: user.email,
    pseudo: user.pseudo,
  };
}

class InMemoryUserService {
  private readonly users = new Map<string, StoredUser>();

  async createUser(createUserDto: CreateUserDto): Promise<StoredUser> {
    const id = randomUUID();
    const user: StoredUser = {
      _id: id,
      email: createUserDto.email,
      pseudo: createUserDto.pseudo,
      password: createUserDto.password,
    };

    this.users.set(id, user);

    return { ...user };
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

  async updateUSer(
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

describe('Auth flow (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'e2e-secret';
    process.env.JWT_EXPIRES_IN = '30d';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({
          secret: process.env.JWT_SECRET,
          signOptions: { expiresIn: process.env.JWT_EXPIRES_IN },
        }),
      ],
      controllers: [UserController, AuthController, MeController],
      providers: [
        { provide: UserService, useClass: InMemoryUserService },
        AuthService,
        LocalStrategy,
        JwtStrategy,
        JwtGuard,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
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
    ) as { sub?: string; email?: string; pseudo?: string };

    expect(token).toBeTruthy();
    expect(decoded.sub).toBeTruthy();

    const meResponse = await request(app.getHttpServer())
      .get('/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(meResponse.body).toMatchObject({ email, pseudo });
    expect(meResponse.body).toHaveProperty('id', decoded.sub);
    expect(meResponse.body).not.toHaveProperty('password');
  });
});
