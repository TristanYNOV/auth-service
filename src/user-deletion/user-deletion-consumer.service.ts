import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  USER_DATA_ANONYMIZED,
  UserDataAnonymizedEvent,
} from '../events/event-contracts';
import { RabbitChannel, RabbitmqService } from '../events/rabbitmq.service';
import { UserDeletionService } from './user-deletion.service';

type RabbitMessage = {
  content: Buffer;
};

@Injectable()
export class UserDeletionConsumerService implements OnModuleInit {
  private readonly logger = new Logger(UserDeletionConsumerService.name);

  constructor(
    private readonly rabbitmqService: RabbitmqService,
    private readonly userDeletionService: UserDeletionService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.rabbitmqService.isConfigured || process.env.NODE_ENV === 'test') {
      this.logger.warn(
        'RabbitMQ consumer disabled: RABBITMQ_URL is not configured or NODE_ENV=test.',
      );
      return;
    }

    await this.rabbitmqService.consume(
      this.rabbitmqService.authQueue,
      USER_DATA_ANONYMIZED,
      (message, channel) => this.handleRabbitMessage(message, channel),
    );
    this.logger.log(
      `Listening for ${USER_DATA_ANONYMIZED} on ${this.rabbitmqService.authQueue}`,
    );
  }

  private async handleRabbitMessage(
    message: RabbitMessage,
    channel: RabbitChannel,
  ): Promise<void> {
    try {
      const event = JSON.parse(
        message.content.toString('utf8'),
      ) as UserDataAnonymizedEvent;
      await this.userDeletionService.handleDataAnonymized(event);
      channel.ack(message);
    } catch (error) {
      const messageText =
        error instanceof Error
          ? error.message
          : 'Unknown RabbitMQ consumer error';
      this.logger.error(
        `Failed to process ${USER_DATA_ANONYMIZED}: ${messageText}`,
      );

      if (messageText.startsWith('Invalid event')) {
        channel.ack(message);
        return;
      }

      channel.nack(message, false, true);
    }
  }
}
