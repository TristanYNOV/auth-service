import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from './auth/guards/jwt.guard';
import { UserService } from './user/User.service';
import { UpdateUserDto } from './schemas/UpdateUser.schema';
import { encryptPassword } from './utils/bcrypt';
import { toUserPublicDto, UserPublicDto } from './user/dto/UserPublic.dto';
import { AuthenticatedRequest } from './auth/types/authenticated-request.type';
import { RolesGuard } from './auth/guards/roles.guard';
import { Roles } from './auth/decorators/roles.decorator';
import { UserDeletionService } from './user-deletion/user-deletion.service';

function getCurrentUserId(req: AuthenticatedRequest): string {
  const userId = req.user?.sub;
  if (!userId) {
    throw new HttpException(
      'Invalid token payload: missing user identifier',
      HttpStatus.UNAUTHORIZED,
    );
  }

  return userId;
}

@Controller()
@UseGuards(JwtGuard, RolesGuard)
@Roles('user')
export class MeController {
  constructor(
    private readonly userService: UserService,
    private readonly userDeletionService: UserDeletionService,
  ) {}

  @Get('me')
  async getMe(@Req() req: AuthenticatedRequest): Promise<UserPublicDto> {
    const user = await this.userService.getUserById(getCurrentUserId(req));
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    return toUserPublicDto(user);
  }

  @Patch('me')
  async updateMe(
    @Req() req: AuthenticatedRequest,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserPublicDto> {
    const userId = getCurrentUserId(req);
    const payload = { ...updateUserDto };

    if (payload.password) {
      payload.password = await encryptPassword(payload.password);
    }

    const updatedUser = await this.userService.updateUser(userId, payload);
    if (!updatedUser)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    return toUserPublicDto(updatedUser);
  }

  @Delete('me')
  async deleteMe(
    @Req() req: AuthenticatedRequest,
  ): Promise<{ user: UserPublicDto; message: string }> {
    const result = await this.userDeletionService.requestDeletion(
      getCurrentUserId(req),
      'self',
      'user_request',
    );
    if (!result)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    return {
      user: toUserPublicDto(result.user),
      message: 'User deletion workflow started',
    };
  }
}
