import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import { IsEmail, IsStrongPassword } from "class-validator";

@Schema({versionKey: false})
export class User {
  @Prop({required: true})
  pseudo: string

  @Prop({unique:true, required: true})
  @IsEmail()
  email: string;

  @Prop({required: true, immutable: true})
  @IsStrongPassword()
  password: string;
}

export const UserSchema = SchemaFactory.createForClass(User);