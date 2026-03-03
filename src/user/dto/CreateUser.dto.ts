import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
} from 'class-validator';
import { Prop } from '@nestjs/mongoose';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Prop({ required: true })
  pseudo: string;

  @IsEmail()
  @IsNotEmpty()
  @Prop({ unique: true, required: true })
  email: string;

  @IsStrongPassword({ minLength: 8, minUppercase: 1, minNumbers: 1 })
  password: string;
}
