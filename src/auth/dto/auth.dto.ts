import { IsEmail, IsNotEmpty, IsStrongPassword } from 'class-validator';
import { Prop } from '@nestjs/mongoose';

export class AuthPayloadDto {
  @IsEmail()
  @IsNotEmpty()
  @Prop({ unique: true, required: true })
  email: string;

  @IsStrongPassword({ minLength: 8, minUppercase: 1, minNumbers: 1 })
  password: string;
}
