import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Prop } from '@nestjs/mongoose';

export class AuthPayloadDto {
  @IsEmail()
  @IsNotEmpty()
  @Prop({ unique: true, required: true })
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
