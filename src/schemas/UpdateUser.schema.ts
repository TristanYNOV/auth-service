import { IsOptional, IsString, IsStrongPassword } from "class-validator";

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  pseudo: string;

  @IsOptional()
  @IsString()
  email: string;

  @IsStrongPassword({minLength: 8, minUppercase: 1, minNumbers: 1})
  password: string;
}
