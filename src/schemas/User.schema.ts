import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { IsEmail, IsIn, IsNotEmpty, IsStrongPassword } from 'class-validator';

export type UserRole = 'user' | 'admin';

@Schema({ versionKey: false })
export class User {
  @Prop({ required: true })
  @IsNotEmpty()
  pseudo: string;

  @Prop({ unique: true, required: true })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @Prop({ required: true, immutable: true })
  @IsStrongPassword()
  password: string;

  @Prop({ type: [String], enum: ['user', 'admin'], default: ['user'] })
  @IsIn(['user', 'admin'], { each: true })
  roles: UserRole[];
}

export const UserSchema = SchemaFactory.createForClass(User);
