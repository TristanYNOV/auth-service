import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsModule } from '../events/events.module';
import {
  RefreshSession,
  RefreshSessionSchema,
} from '../schemas/RefreshSession.schema';
import { User, UserSchema } from '../schemas/User.schema';
import {
  UserDeletionWorkflow,
  UserDeletionWorkflowSchema,
} from '../schemas/UserDeletionWorkflow.schema';
import { UserDeletionConsumerService } from './user-deletion-consumer.service';
import { UserDeletionService } from './user-deletion.service';

@Module({
  imports: [
    EventsModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: RefreshSession.name, schema: RefreshSessionSchema },
      { name: UserDeletionWorkflow.name, schema: UserDeletionWorkflowSchema },
    ]),
  ],
  providers: [UserDeletionService, UserDeletionConsumerService],
  exports: [UserDeletionService],
})
export class UserDeletionModule {}
