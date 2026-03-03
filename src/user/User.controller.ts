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
} from '@nestjs/common';
import { UserService } from './User.service';
import { CreateUserDto } from './dto/CreateUser.dto';
import mongoose from 'mongoose';
import { UpdateUserDto } from '../schemas/UpdateUser.schema';
import { encryptPassword } from '../utils/bcrypt';
import { toUserPublicDto, UserPublicDto } from './dto/UserPublic.dto';

function checkIDParam(id: string) {
  const isValid = mongoose.Types.ObjectId.isValid(id);
  if (!isValid)
    throw new HttpException(
      `User ID: ${id} doesn't match format`,
      HttpStatus.BAD_REQUEST,
    );
}

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async createUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<UserPublicDto> {
    const hash = await encryptPassword(createUserDto.password);

    const createdUser = await this.userService.createUser({
      ...createUserDto,
      password: hash,
    });
    return toUserPublicDto(createdUser);
  }

  @Get()
  async getAllUser(): Promise<UserPublicDto[]> {
    const users = await this.userService.getAllUsers();
    return users.map((user) => toUserPublicDto(user));
  }

  @Get('searchId/:id')
  async getUserById(@Param('id') id: string): Promise<UserPublicDto> {
    checkIDParam(id);
    const user = await this.userService.getUserById(id);
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    return toUserPublicDto(user);
  }

  @Get('searchPseudo/:pseudo')
  async getUSerByPseudo(
    @Param('pseudo') pseudo: string,
  ): Promise<UserPublicDto> {
    const user = await this.userService.getUserByPseudo(pseudo);
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    return toUserPublicDto(user);
  }

  @Get('searchEmail/:email')
  async getUSerByEmail(@Param('email') email: string): Promise<UserPublicDto> {
    const user = await this.userService.getUserByEmail(email);
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    return toUserPublicDto(user);
  }

  @Delete(':id')
  async deleteUser(
    @Param('id') id: string,
  ): Promise<{ user: UserPublicDto; message: string }> {
    checkIDParam(id);

    const user = await this.userService.deleteUserById(id);
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    return {
      user: toUserPublicDto(user),
      message: 'User Deleted',
    };
  }

  @Patch(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUSerDto: UpdateUserDto,
  ): Promise<UserPublicDto> {
    checkIDParam(id);

    const payload = { ...updateUSerDto };
    if (payload.password) {
      payload.password = await encryptPassword(payload.password);
    }

    const user = await this.userService.updateUSer(id, payload);
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    return toUserPublicDto(user);
  }
}
