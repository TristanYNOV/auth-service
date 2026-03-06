import { JwtService } from '@nestjs/jwt';
import { HttpException, HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UserService } from '../user/User.service';

describe('AuthService', () => {
  const jwtSecret = 'test-secret';
  const jwtService = new JwtService({ secret: jwtSecret });

  const userServiceMock: Pick<UserService, 'getUserByEmailWithPassword'> = {
    getUserByEmailWithPassword: jest.fn(),
  };

  const authService = new AuthService(
    userServiceMock as UserService,
    jwtService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('signs jwt containing roles claim', async () => {
    const plainPassword = 'StrongPass2!';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    (userServiceMock.getUserByEmailWithPassword as jest.Mock).mockResolvedValue(
      {
        _id: { toString: () => '507f1f77bcf86cd799439011' },
        email: 'admin@example.com',
        pseudo: 'admin',
        password: hashedPassword,
        roles: ['admin'],
      },
    );

    const token = await authService.validateUser({
      email: 'admin@example.com',
      password: plainPassword,
    });

    const payload = jwtService.verify(token, { secret: jwtSecret }) as {
      sub: string;
      email: string;
      pseudo: string;
      roles: string[];
    };

    expect(payload.sub).toBe('507f1f77bcf86cd799439011');
    expect(payload.roles).toEqual(['admin']);
  });

  it('throws 401 with explicit message on invalid credentials', async () => {
    (userServiceMock.getUserByEmailWithPassword as jest.Mock).mockResolvedValue(
      null,
    );

    await expect(
      authService.validateUser({ email: 'missing@example.com', password: 'x' }),
    ).rejects.toEqual(
      new HttpException(
        'Invalid credentials: user does not exist or provided credentials are incorrect',
        HttpStatus.UNAUTHORIZED,
      ),
    );
  });
});
