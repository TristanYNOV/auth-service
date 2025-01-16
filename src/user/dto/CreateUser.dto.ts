import { IsEmail, IsNotEmpty, IsString, IsStrongPassword } from "class-validator";

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  pseudo: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsStrongPassword({minLength: 8, minUppercase: 1, minNumbers: 1})
  password: string;
}