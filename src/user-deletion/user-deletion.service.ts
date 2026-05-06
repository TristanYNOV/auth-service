import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'node:crypto';
import { HydratedDocument, Model, Types } from 'mongoose';
import { RabbitmqService } from '../events/rabbitmq.service';
import {
  USER_DATA_ANONYMIZED,
  USER_DELETED,
  USER_DELETION_REQUESTED,
  UserDataAnonymizedEvent,
  UserDeletedEvent,
  UserDeletionRequestedEvent,
} from '../events/event-contracts';
import { RefreshSession } from '../schemas/RefreshSession.schema';
import { User } from '../schemas/User.schema';
import {
  UserDeletionRequestedBy,
  UserDeletionWorkflow,
  UserDeletionWorkflowDocument,
} from '../schemas/UserDeletionWorkflow.schema';

const REQUIRED_SERVICES = ['analysis-store-service'];

@Injectable()
export class UserDeletionService {
  private readonly logger = new Logger(UserDeletionService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(RefreshSession.name)
    private readonly refreshSessionModel: Model<RefreshSession>,
    @InjectModel(UserDeletionWorkflow.name)
    private readonly workflowModel: Model<UserDeletionWorkflow>,
    private readonly rabbitmqService: RabbitmqService,
  ) {}

  async requestDeletion(
    userId: string,
    requestedBy: UserDeletionRequestedBy,
    reason: 'user_request' | 'admin_action' | 'test' | 'unknown',
  ): Promise<{
    user: HydratedDocument<User>;
    workflow: UserDeletionWorkflow;
  } | null> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      return null;
    }

    const existingWorkflow = await this.workflowModel
      .findOne({
        userId,
        status: {
          $in: ['pending', 'anonymizing', 'ready_to_delete', 'deleted'],
        },
      })
      .exec();

    if (existingWorkflow) {
      return { user, workflow: existingWorkflow };
    }

    const now = new Date();
    const workflow = await this.workflowModel.create({
      userId,
      status: 'pending',
      correlationId: randomUUID(),
      requestedBy,
      reason,
      requiredServices: REQUIRED_SERVICES,
      completedServices: [],
      failedServices: [],
      requestedAt: now,
      finalizedAt: null,
    });

    user.status = 'pending_deletion';
    user.deletionRequestedAt = now;
    await user.save();
    await this.revokeActiveRefreshSessions(userId);

    const event: UserDeletionRequestedEvent = {
      eventId: randomUUID(),
      eventType: USER_DELETION_REQUESTED,
      version: 1,
      occurredAt: now.toISOString(),
      producer: 'auth-service',
      correlationId: workflow.correlationId,
      data: {
        userId,
        requestedBy,
        reason,
      },
    };

    try {
      await this.rabbitmqService.publish(USER_DELETION_REQUESTED, event);
      workflow.status = 'anonymizing';
      await workflow.save();
      this.logger.log(
        `Published ${USER_DELETION_REQUESTED} for user ${userId}`,
      );
      return { user, workflow };
    } catch (error) {
      workflow.status = 'failed';
      workflow.failedServices = ['rabbitmq'];
      await workflow.save();
      user.status = 'deletion_failed';
      await user.save();

      const message =
        error instanceof Error
          ? error.message
          : 'Unknown RabbitMQ publish error';
      this.logger.error(
        `Failed to publish ${USER_DELETION_REQUESTED} for user ${userId}: ${message}`,
      );
      throw new ServiceUnavailableException(
        'User deletion workflow could not be started.',
      );
    }
  }

  async handleDataAnonymized(
    event: UserDataAnonymizedEvent,
  ): Promise<UserDeletedEvent | null> {
    this.assertValidDataAnonymizedEvent(event);

    const workflow = await this.workflowModel
      .findOne({
        $or: [
          { correlationId: event.correlationId },
          { userId: event.data.userId },
        ],
      })
      .exec();

    if (!workflow) {
      this.logger.warn(
        `Ignoring ${USER_DATA_ANONYMIZED}: workflow not found for ${event.correlationId}`,
      );
      return null;
    }

    if (workflow.status === 'deleted') {
      this.logger.log(
        `Ignoring ${USER_DATA_ANONYMIZED}: workflow already deleted for ${workflow.userId}`,
      );
      return null;
    }

    if (!workflow.completedServices.includes(event.data.service)) {
      workflow.completedServices.push(event.data.service);
    }

    const isComplete = workflow.requiredServices.every((service) =>
      workflow.completedServices.includes(service),
    );
    if (!isComplete) {
      await workflow.save();
      return null;
    }

    workflow.status = 'ready_to_delete';
    await workflow.save();

    return this.finalizeWorkflow(workflow);
  }

  private async finalizeWorkflow(
    workflow: UserDeletionWorkflowDocument,
  ): Promise<UserDeletedEvent> {
    const deletedAt = new Date();
    await this.userModel
      .findByIdAndUpdate(workflow.userId, {
        $set: {
          status: 'deleted',
          pseudo: 'Utilisateur supprime',
          email: `deleted-${workflow.userId}@deleted.local`,
          deletionRequestedAt: workflow.requestedAt,
          deletedAt,
        },
      })
      .exec();
    await this.revokeActiveRefreshSessions(workflow.userId);

    const event: UserDeletedEvent = {
      eventId: randomUUID(),
      eventType: USER_DELETED,
      version: 1,
      occurredAt: deletedAt.toISOString(),
      producer: 'auth-service',
      correlationId: workflow.correlationId,
      data: {
        userId: workflow.userId,
        deletedAt: deletedAt.toISOString(),
      },
    };

    try {
      await this.rabbitmqService.publish(USER_DELETED, event);
      workflow.status = 'deleted';
      workflow.finalizedAt = deletedAt;
      await workflow.save();
      this.logger.log(
        `Workflow complete for user ${workflow.userId}; published ${USER_DELETED}`,
      );
      return event;
    } catch (error) {
      workflow.status = 'failed';
      workflow.failedServices = ['rabbitmq'];
      await workflow.save();
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown RabbitMQ publish error';
      this.logger.error(
        `Failed to publish ${USER_DELETED} for user ${workflow.userId}: ${message}`,
      );
      throw error;
    }
  }

  private async revokeActiveRefreshSessions(userId: string): Promise<void> {
    await this.refreshSessionModel
      .updateMany(
        {
          userId: new Types.ObjectId(userId),
          revokedAt: { $eq: null },
          expiresAt: { $gt: new Date() },
        },
        {
          $set: {
            revokedAt: new Date(),
          },
        },
      )
      .exec();
  }

  private assertValidDataAnonymizedEvent(event: UserDataAnonymizedEvent): void {
    if (
      !event ||
      event.eventType !== USER_DATA_ANONYMIZED ||
      event.version !== 1 ||
      !event.eventId ||
      !event.correlationId ||
      !event.data?.userId ||
      event.data.service !== 'analysis-store-service'
    ) {
      throw new Error(`Invalid event ${USER_DATA_ANONYMIZED}`);
    }
  }
}
