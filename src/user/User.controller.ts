import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './User.service';
import { CreateUserDto } from './dto/CreateUser.dto';
import mongoose from 'mongoose';
import { UpdateUserDto } from '../schemas/UpdateUser.schema';
import { encryptPassword } from '../utils/bcrypt';
import { toUserPublicDto, UserPublicDto } from './dto/UserPublic.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/types/authenticated-request.type';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

function checkIDParam(id: string): void {
  const isValid = mongoose.Types.ObjectId.isValid(id);
  if (!isValid)
    throw new HttpException(
      `User ID: ${id} doesn't match format`,
      HttpStatus.BAD_REQUEST,
    );
}

function canManageUser(
  req: AuthenticatedRequest,
  targetUserId: string,
): boolean {
  const isAdmin = req.user.roles.includes('admin');
  const isSelf = req.user.sub === targetUserId;

  return isAdmin || isSelf;
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
      roles: ['user'],
    });
    return toUserPublicDto(createdUser);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getAllUser(): Promise<UserPublicDto[]> {
    const users = await this.userService.getAllUsers();
    return users.map((user) => toUserPublicDto(user));
  }

  @Get('searchId/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getUserById(@Param('id') id: string): Promise<UserPublicDto> {
    checkIDParam(id);
    const user = await this.userService.getUserById(id);
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    return toUserPublicDto(user);
  }

  @Get('searchPseudo/:pseudo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getUserByPseudo(
    @Param('pseudo') pseudo: string,
  ): Promise<UserPublicDto> {
    const user = await this.userService.getUserByPseudo(pseudo);
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    return toUserPublicDto(user);
  }

  @Get('searchEmail/:email')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getUserByEmail(@Param('email') email: string): Promise<UserPublicDto> {
    const user = await this.userService.getUserByEmail(email);
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    return toUserPublicDto(user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteUser(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ user: UserPublicDto; message: string }> {
    checkIDParam(id);

    if (!canManageUser(req, id)) {
      throw new ForbiddenException(
        'Only admins or resource owners can delete users',
      );
    }

    const user = await this.userService.deleteUserById(id);
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    return {
      user: toUserPublicDto(user),
      message: 'User Deleted',
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateUser(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserPublicDto> {
    checkIDParam(id);

    if (!canManageUser(req, id)) {
      throw new ForbiddenException(
        'Only admins or resource owners can update users',
      );
    }

    const payload: UpdateUserDto = { ...updateUserDto };
    if (payload.password) {
      payload.password = await encryptPassword(payload.password);
    }

    const user = await this.userService.updateUser(id, payload);
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    return toUserPublicDto(user);
  }
}
