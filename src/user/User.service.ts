import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { User } from '../schemas/User.schema';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/CreateUser.dto';
import { InjectModel } from '@nestjs/mongoose';
import { UpdateUserDto } from '../schemas/UpdateUser.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  createUser(createUserDto: CreateUserDto & { roles?: string[] }) {
    const newUser = new this.userModel({
      ...createUserDto,
      roles: ['user'],
    });

    return newUser.save();
  }

  createAdminUser(payload: {
    pseudo: string;
    email: string;
    password: string;
  }) {
    const newAdmin = new this.userModel({
      ...payload,
      roles: ['admin'],
    });

    return newAdmin.save();
  }

  countAdminUsers() {
    return this.userModel.countDocuments({ roles: { $in: ['admin'] } }).exec();
  }

  getAllUsers() {
    return this.userModel.find().select('-password').lean();
  }

  getUserById(id: string) {
    return this.userModel.findById(id).select('-password').lean();
  }

  getUserByEmailWithPassword(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    try {
      return await this.userModel.findByIdAndUpdate(id, updateUserDto, {
        new: true,
        lean: true,
        overwriteImmutable: true,
        projection: { password: 0 },
      });
    } catch {
      throw new HttpException('Failed to update user', HttpStatus.BAD_REQUEST);
    }
  }

  deleteUserById(id: string) {
    return this.userModel
      .findByIdAndDelete(id, { projection: { password: 0 } })
      .lean();
  }
}
