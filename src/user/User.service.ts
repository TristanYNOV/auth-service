import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { User, UserDocument } from '../schemas/User.schema';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/CreateUser.dto';
import { InjectModel } from '@nestjs/mongoose';
import { UpdateUserDto } from '../schemas/UpdateUser.schema';
import { UserRole } from '../auth/types/role.type';

export type CreateUserInput = CreateUserDto & { roles?: UserRole[] };

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  createUser(createUserDto: CreateUserInput): Promise<UserDocument> {
    const roles = createUserDto.roles?.length ? createUserDto.roles : ['user'];
    const newUser = new this.userModel({ ...createUserDto, roles });

    return newUser.save();
  }

  getAllUsers(): Promise<User[]> {
    return this.userModel.find().select('-password').lean();
  }

  getUserById(id: string): Promise<User | null> {
    return this.userModel.findById(id).select('-password').lean();
  }

  async getUserByEmail(email: string): Promise<User> {
    try {
      const response = await this.userModel
        .findOne({ email })
        .select('-password')
        .lean()
        .exec();
      if (!response)
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);

      return response;
    } catch {
      throw new HttpException(
        'Failed to get user by email',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getUserByEmailWithPassword(
    email: string,
  ): Promise<UserDocument | null> {
    const exactMatch = await this.userModel.findOne({ email }).exec();
    if (exactMatch) {
      return exactMatch;
    }

    const escapedEmail = escapeRegExp(email.trim());

    return this.userModel
      .findOne({ email: { $regex: `^${escapedEmail}$`, $options: 'i' } })
      .exec();
  }

  async getUserByPseudo(pseudo: string): Promise<User> {
    try {
      const response = await this.userModel
        .findOne({ pseudo })
        .select('-password')
        .lean()
        .exec();
      if (!response)
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);

      return response;
    } catch {
      throw new HttpException(
        'Failed to get user by alias',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(id, updateUserDto, {
      new: true,
      lean: true,
      overwriteImmutable: true,
      projection: { password: 0 },
    });
  }

  deleteUserById(id: string): Promise<User | null> {
    return this.userModel
      .findByIdAndDelete(id, { projection: { password: 0 } })
      .lean();
  }

  async ensureAdminRoleByEmail(email: string): Promise<void> {
    await this.userModel.updateOne(
      { email },
      { $addToSet: { roles: 'admin' } },
    );
  }

  async ensureAdminAccount(
    email: string,
    hashedPassword: string,
    pseudo: string,
  ): Promise<void> {
    const existingUser = await this.userModel.findOne({ email }).exec();

    if (!existingUser) {
      await this.userModel.create({
        email,
        password: hashedPassword,
        pseudo,
        roles: ['admin'],
      });

      return;
    }

    await this.userModel.updateOne(
      { email },
      {
        $set: {
          password: hashedPassword,
          pseudo,
        },
        $addToSet: { roles: 'admin' },
      },
    );
  }
}
