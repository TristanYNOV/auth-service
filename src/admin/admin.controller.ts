import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import mongoose from 'mongoose';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { toUserPublicDto, UserPublicDto } from '../user/dto/UserPublic.dto';
import { AdminUpdateUserDto } from './dto/AdminUpdateUser.dto';
import { AuthenticatedRequest } from '../auth/types/authenticated-request.type';
import { encryptPassword } from '../utils/bcrypt';

function checkIDParam(id: string): void {
  const isValid = mongoose.Types.ObjectId.isValid(id);
  if (!isValid)
    throw new HttpException(
      `User ID: ${id} doesn't match format`,
      HttpStatus.BAD_REQUEST,
    );
}

function ensureAdminAccess(req: AuthenticatedRequest): void {
  if (!req.user.roles.includes('admin')) {
    throw new HttpException(
      'Admin role is required for this endpoint',
      HttpStatus.FORBIDDEN,
    );
  }
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async getAllUsers(
    @Req() req: AuthenticatedRequest,
  ): Promise<UserPublicDto[]> {
    ensureAdminAccess(req);
    const users = await this.adminService.getAllUsers();

    return users.map((user) => toUserPublicDto(user));
  }

  @Patch('users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() adminUpdateUserDto: AdminUpdateUserDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<UserPublicDto> {
    checkIDParam(id);
    ensureAdminAccess(req);

    const payload: AdminUpdateUserDto = { ...adminUpdateUserDto };
    if (payload.password) {
      payload.password = await encryptPassword(payload.password);
    }

    const user = await this.adminService.updateUserById(id, payload);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return toUserPublicDto(user);
  }

  @Delete('users/:id')
  async deleteUser(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ user: UserPublicDto; message: string }> {
    checkIDParam(id);
    ensureAdminAccess(req);

    const user = await this.adminService.deleteUserById(id);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return {
      user: toUserPublicDto(user),
      message: 'User Deleted',
    };
  }
}
