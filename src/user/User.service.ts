import { Injectable } from "@nestjs/common";
import { User } from "../schemas/User.schema";
import { Model } from "mongoose";
import { CreateUserDto } from "./dto/CreateUser.dto";
import { InjectModel } from "@nestjs/mongoose";

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
}