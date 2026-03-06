import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/User.schema';
import { AdminUpdateUserDto } from './dto/AdminUpdateUser.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  getAllUsers(): Promise<User[]> {
    return this.userModel.find().select('-password').lean();
  }

  updateUserById(
    id: string,
    payload: AdminUpdateUserDto,
  ): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(id, payload, {
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
}
