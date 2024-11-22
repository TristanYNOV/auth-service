import { IsOptional, IsString, IsStrongPassword } from "class-validator";

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  pseudo: string;

  @IsOptional()
  @IsString()
  email: string;

  @IsStrongPassword()
  password: string;
}
