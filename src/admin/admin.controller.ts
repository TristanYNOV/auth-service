import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserService } from '../user/User.service';
import { toUserPublicDto, UserPublicDto } from '../user/dto/UserPublic.dto';
import { UpdateUserDto } from '../schemas/UpdateUser.schema';
import { encryptPassword } from '../utils/bcrypt';
import mongoose from 'mongoose';

function checkIDParam(id: string) {
  const isValid = mongoose.Types.ObjectId.isValid(id);
  if (!isValid) {
    throw new HttpException(
      `User ID: ${id} doesn't match format`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

@Controller('admin')
@UseGuards(JwtGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly userService: UserService) {}

  @Get('users')
  async listUsers(): Promise<UserPublicDto[]> {
    const users = await this.userService.getAllUsers();
    return users.map((user) => toUserPublicDto(user));
  }

  @Patch('users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserPublicDto> {
    checkIDParam(id);

    const payload = { ...updateUserDto };
    if (payload.password) {
      payload.password = await encryptPassword(payload.password);
    }

    const updatedUser = await this.userService.updateUser(id, payload);
    if (!updatedUser) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return toUserPublicDto(updatedUser);
  }

  @Delete('users/:id')
  async deleteUser(
    @Param('id') id: string,
  ): Promise<{ user: UserPublicDto; message: string }> {
    checkIDParam(id);
    const deletedUser = await this.userService.deleteUserById(id);
    if (!deletedUser) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return {
      user: toUserPublicDto(deletedUser),
      message: 'User Deleted',
    };
  }
}
