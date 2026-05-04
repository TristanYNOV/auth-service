import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from './User.service';
import { CreateUserDto } from './dto/CreateUser.dto';
import { encryptPassword } from '../utils/bcrypt';
import { toUserPublicDto, UserPublicDto } from './dto/UserPublic.dto';
import { authRegisterTotal } from '../observability/metrics';

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
    authRegisterTotal.labels('success').inc();
    return toUserPublicDto(createdUser);
  }
}
