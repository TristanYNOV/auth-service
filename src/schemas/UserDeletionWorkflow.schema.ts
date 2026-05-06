import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDeletionWorkflowDocument =
  HydratedDocument<UserDeletionWorkflow>;
export type UserDeletionWorkflowStatus =
  | 'pending'
  | 'anonymizing'
  | 'ready_to_delete'
  | 'deleted'
  | 'failed';
export type UserDeletionRequestedBy = 'self' | 'admin' | 'system';

@Schema({ collection: 'user_deletion_workflows', versionKey: false })
export class UserDeletionWorkflow {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({
    type: String,
    enum: ['pending', 'anonymizing', 'ready_to_delete', 'deleted', 'failed'],
    default: 'pending',
    index: true,
  })
  status: UserDeletionWorkflowStatus;

  @Prop({ required: true, unique: true, index: true })
  correlationId: string;

  @Prop({ type: String, enum: ['self', 'admin', 'system'], required: true })
  requestedBy: UserDeletionRequestedBy;

  @Prop({ required: true })
  reason: string;

  @Prop({ type: [String], default: ['analysis-store-service'] })
  requiredServices: string[];

  @Prop({ type: [String], default: [] })
  completedServices: string[];

  @Prop({ type: [String], default: [] })
  failedServices: string[];

  @Prop({ required: true })
  requestedAt: Date;

  @Prop()
  finalizedAt?: Date | null;
}

export const UserDeletionWorkflowSchema =
  SchemaFactory.createForClass(UserDeletionWorkflow);

UserDeletionWorkflowSchema.index({ userId: 1, status: 1 });
UserDeletionWorkflowSchema.index({ correlationId: 1 }, { unique: true });
