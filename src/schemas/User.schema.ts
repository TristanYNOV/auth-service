import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import { IsEmail, IsNotEmpty, IsStrongPassword } from "class-validator";

@Schema({versionKey: false})
export class User {
  @Prop({required: true})
  @IsNotEmpty()
  pseudo: string

  @Prop({unique:true, required: true})
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @Prop({required: true, immutable: true})
  @IsStrongPassword()
  password: string;
}

export const UserSchema = SchemaFactory.createForClass(User);