import { Module } from '@nestjs/common';
import { RabbitmqBusinessMetricsService } from '../observability/rabbitmq-business-metrics.service';
import { RabbitmqService } from './rabbitmq.service';

@Module({
  providers: [RabbitmqBusinessMetricsService, RabbitmqService],
  exports: [RabbitmqBusinessMetricsService, RabbitmqService],
})
export class EventsModule {}
