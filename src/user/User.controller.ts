import { Body, Controller, Get, HttpException, HttpStatus, NotFoundException, Param, Post } from "@nestjs/common";
import { UserService } from "./User.service";
import { CreateUserDto } from "./dto/CreateUser.dto";
import mongoose from "mongoose";

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
    const isValid = mongoose.Types.ObjectId.isValid(id);
    if (!isValid) throw new HttpException(`User ID: ${id} doesn't match format`, HttpStatus.NOT_FOUND);
    const foundUser = await this.userService.getUserById(id);
    if(!foundUser) throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    return foundUser;
  }
}