import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './User.schema';

export type RefreshSessionDocument = HydratedDocument<RefreshSession>;

@Schema({ versionKey: false })
export class RefreshSession {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  refreshTokenHash: string;

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true, index: true })
  expiresAt: Date;

  @Prop()
  revokedAt?: Date;

  @Prop()
  rotatedFromHash?: string;

  @Prop()
  userAgent?: string;

  @Prop()
  lastUsedAt?: Date;

  @Prop()
  deviceLabel?: string;
}

export const RefreshSessionSchema =
  SchemaFactory.createForClass(RefreshSession);

RefreshSessionSchema.index({ userId: 1 });
RefreshSessionSchema.index({ refreshTokenHash: 1 }, { unique: true });
RefreshSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
