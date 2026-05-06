import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  USER_DATA_ANONYMIZED,
  UserDataAnonymizedEvent,
} from '../events/event-contracts';
import { RabbitChannel, RabbitmqService } from '../events/rabbitmq.service';
import { RabbitmqBusinessMetricsService } from '../observability/rabbitmq-business-metrics.service';
import { UserDeletionService } from './user-deletion.service';

type RabbitMessage = {
  content: Buffer;
};

@Injectable()
export class UserDeletionConsumerService implements OnModuleInit {
  private readonly logger = new Logger(UserDeletionConsumerService.name);
  private consumerStarted = false;

  constructor(
    private readonly rabbitmqService: RabbitmqService,
    private readonly userDeletionService: UserDeletionService,
    private readonly metrics: RabbitmqBusinessMetricsService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.rabbitmqService.isConfigured || process.env.NODE_ENV === 'test') {
      this.logger.warn(
        'RabbitMQ consumer disabled: RABBITMQ_URL is not configured or NODE_ENV=test.',
      );
      return;
    }

    void this.startConsumerWithRetry();
  }

  private async handleRabbitMessage(
    message: RabbitMessage,
    channel: RabbitChannel,
  ): Promise<void> {
    const endTimer = this.metrics.startProcessingTimer(
      USER_DATA_ANONYMIZED,
      USER_DATA_ANONYMIZED,
    );
    let parsed = false;

    try {
      const event = JSON.parse(
        message.content.toString('utf8'),
      ) as UserDataAnonymizedEvent;
      parsed = true;
      const publishedEvent =
        await this.userDeletionService.handleDataAnonymized(event);
      const result = publishedEvent ? 'success' : 'ignored';
      this.metrics.recordConsumedEvent(
        USER_DATA_ANONYMIZED,
        USER_DATA_ANONYMIZED,
        result,
      );
      endTimer(result);
      channel.ack(message);
    } catch (error) {
      const messageText =
        error instanceof Error
          ? error.message
          : 'Unknown RabbitMQ consumer error';
      this.logger.error(
        `Failed to process ${USER_DATA_ANONYMIZED}: ${messageText}`,
      );

      if (!parsed || messageText.startsWith('Invalid event')) {
        this.metrics.recordConsumedEvent(
          USER_DATA_ANONYMIZED,
          USER_DATA_ANONYMIZED,
          'invalid',
        );
        endTimer('invalid');
        channel.ack(message);
        return;
      }

      this.metrics.recordConsumedEvent(
        USER_DATA_ANONYMIZED,
        USER_DATA_ANONYMIZED,
        'failure',
      );
      this.metrics.recordWorkflowFailed('consume_anonymized_event');
      endTimer('failure');
      channel.nack(message, false, true);
    }
  }

  private async startConsumerWithRetry(): Promise<void> {
    let attempt = 1;

    while (!this.consumerStarted) {
      try {
        await this.rabbitmqService.consume(
          this.rabbitmqService.authQueue,
          USER_DATA_ANONYMIZED,
          (message, channel) => this.handleRabbitMessage(message, channel),
        );
        this.consumerStarted = true;
        this.logger.log(
          `Listening for ${USER_DATA_ANONYMIZED} on ${this.rabbitmqService.authQueue}`,
        );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Unknown RabbitMQ connection error';
        const delayMs = Math.min(30000, attempt * 2000);
        this.logger.warn(
          `RabbitMQ consumer startup failed (attempt ${attempt}): ${message}. Retrying in ${delayMs}ms.`,
        );
        await this.delay(delayMs);
        attempt += 1;
      }
    }
  }

  private delay(delayMs: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, delayMs);
    });
  }
}
