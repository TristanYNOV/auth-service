import { IsEmail, IsNotEmpty, IsString, IsStrongPassword } from "class-validator";
import { Prop } from "@nestjs/mongoose";

export class AuthPayloadDto {
  @IsString()
  @IsNotEmpty()
  @Prop({required: true})
  pseudo: string;

  @IsStrongPassword({minLength: 8, minUppercase: 1, minNumbers: 1})
  password: string;
}