import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { UserService } from "./User.service";
import { CreateUserDto } from "./dto/CreateUser.dto";
import mongoose from "mongoose";
import { UpdateUserDto } from "../schemas/UpdateUser.schema";

function checkIDParam(id: string) {
  const isValid = mongoose.Types.ObjectId.isValid(id);
  if(!isValid) throw new HttpException(`User ID: ${id} doesn't match format`, HttpStatus.BAD_REQUEST);
}

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @Get()
  getAllUser() {
    return this.userService.getAllUsers();
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    checkIDParam(id);
    const user = await this.userService.getUserById(id);
    if(!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    return user;
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    checkIDParam(id);

    const user = await this.userService.deleteUserById(id);
    if(!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    return {
      user: user,
      message: 'User Deleted'
    }
  }

  @Patch(':id')
  updateUser(@Param('id') id: string, @Body() updateUSerDto: UpdateUserDto) {
    checkIDParam(id);

    return this.userService.updateUSer(id, updateUSerDto);
  }
}