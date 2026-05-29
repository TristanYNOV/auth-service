import { ConflictException } from '@nestjs/common';
import { UserService } from './User.service';

describe('UserService', () => {
  function buildUserModel(save: jest.Mock) {
    const UserModel = jest.fn().mockImplementation((payload) => ({
      payload,
      save: () => save(payload),
    }));
    Object.assign(UserModel, {
      countDocuments: jest.fn().mockReturnValue({ exec: jest.fn() }),
      find: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    });
    return UserModel;
  }

  it('forces the public registration role to user even when admin is provided', async () => {
    const save = jest.fn().mockResolvedValue({
      _id: 'user-1',
      email: 'coach@example.com',
      pseudo: 'coach',
      roles: ['user'],
    });
    const UserModel = buildUserModel(save);
    const service = new UserService(UserModel as never);

    await service.createUser({
      email: 'coach@example.com',
      pseudo: 'coach',
      password: 'Password1!',
      roles: ['admin'],
    });

    expect(UserModel).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'coach@example.com',
        roles: ['user'],
      }),
    );
  });

  it('keeps admin creation behind the internal admin path', async () => {
    const save = jest.fn().mockResolvedValue({ roles: ['admin'] });
    const UserModel = buildUserModel(save);
    const service = new UserService(UserModel as never);

    await service.createAdminUser({
      email: 'admin@example.com',
      pseudo: 'admin',
      password: 'Password1!',
    });

    expect(UserModel).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'admin@example.com',
        roles: ['admin'],
      }),
    );
  });

  it('maps duplicate email errors to ConflictException during registration', async () => {
    const save = jest.fn().mockRejectedValue({ code: 11000 });
    const UserModel = buildUserModel(save);
    const service = new UserService(UserModel as never);

    await expect(
      service.createUser({
        email: 'coach@example.com',
        pseudo: 'coach',
        password: 'Password1!',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
