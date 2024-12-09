import { Injectable } from "@nestjs/common";
import { User } from "../schemas/User.schema";
import { Model } from "mongoose";
import { CreateUserDto } from "./dto/CreateUser.dto";
import { InjectModel } from "@nestjs/mongoose";
import { UpdateUserDto } from "../schemas/UpdateUser.schema";

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}

  createUser(createUserDto: CreateUserDto){
    const newUser = new this.userModel(createUserDto);

    return newUser.save();
  }

  getAllUsers() {
    return this.userModel.find();
  }

  getUserById(id: string) {
    return this.userModel.findById(id)
  }
x
  // TODO: Manage immutable Password better with dto (maybe new route for update userPassword)
  updateUSer(id:string, updateUserDto: UpdateUserDto) {
    return this.userModel.findByIdAndUpdate(id, updateUserDto, {new: true, lean: true, overwriteImmutable: true});
  }

  deleteUserById(id: string) {
    return this.userModel.findByIdAndDelete(id);
  }
}