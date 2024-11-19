import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "../schemas/User.schema";
import { UserService } from "./User.service";
import { UserController } from "./User.controller";

@Module({
  imports: [
    MongooseModule.forFeature([{
    name: User.name,
    schema: UserSchema
  }]),
  ],
  providers: [
    UserService
  ],
  controllers: [UserController],
})

export class UserModule {}