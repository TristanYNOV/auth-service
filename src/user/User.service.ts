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

  createUser(createUserDto: CreateUserDto) {
    const newUser = new this.userModel(createUserDto);

    return newUser.save();
  }

  getAllUsers() {
    return this.userModel.find().select('-password').lean();
  }

  getUserById(id: string) {
    return this.userModel.findById(id).select('-password').lean();
  }

  async getUserByEmail(email: string) {
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

  getUserByEmailWithPassword(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  async getUserByPseudo(pseudo: string) {
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

  // TODO: Manage immutable Password better with dto (maybe new route for update userPassword)
  updateUSer(id: string, updateUserDto: UpdateUserDto) {
    return this.userModel.findByIdAndUpdate(id, updateUserDto, {
      new: true,
      lean: true,
      overwriteImmutable: true,
      projection: { password: 0 },
    });
  }

  deleteUserById(id: string) {
    return this.userModel
      .findByIdAndDelete(id, { projection: { password: 0 } })
      .lean();
  }
}
