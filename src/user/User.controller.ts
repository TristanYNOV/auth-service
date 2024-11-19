import { Body, Controller, Post } from "@nestjs/common";
import { UserService } from "./User.service";
import { CreateUserDto } from "./dto/CreateUser.dto";

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  createUser(@Body() createUserDto: CreateUserDto) {
    console.log(createUserDto);

    return this.userService.createUser(createUserDto);
  }
}