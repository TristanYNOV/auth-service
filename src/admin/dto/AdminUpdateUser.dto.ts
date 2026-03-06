import {
  IsArray,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsStrongPassword,
} from 'class-validator';
import { USER_ROLES, UserRole } from '../../auth/types/role.type';

export class AdminUpdateUserDto {
  @IsOptional()
  @IsString()
  pseudo?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsStrongPassword({ minLength: 8, minUppercase: 1, minNumbers: 1 })
  password?: string;

  @IsOptional()
  @IsArray()
  @IsIn(USER_ROLES, { each: true })
  roles?: UserRole[];
}
