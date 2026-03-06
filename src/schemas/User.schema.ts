import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { IsEmail, IsNotEmpty, IsStrongPassword } from 'class-validator';
import { USER_ROLES, UserRole } from '../auth/types/role.type';

export type UserDocument = HydratedDocument<User>;

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

  @Prop({
    type: [String],
    enum: USER_ROLES,
    default: ['user'],
    required: true,
  })
  roles: UserRole[];
}

export const UserSchema = SchemaFactory.createForClass(User);
