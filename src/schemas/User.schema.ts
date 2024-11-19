import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";

@Schema()
export class User {
  @Prop({required: true})
  pseudo: string;

  @Prop({unique:true, required: true})
  email: string;

  @Prop({required: true})
  password: string;
}

export const UserSchema = SchemaFactory.createForClass(User);