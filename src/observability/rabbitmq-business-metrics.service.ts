import { Injectable } from '@nestjs/common';
import {
  rabbitmqBusinessEventProcessingDurationSeconds,
  rabbitmqBusinessEventPublishDurationSeconds,
  rabbitmqBusinessEventsConsumedTotal,
  rabbitmqBusinessEventsPublishedTotal,
  userDeletionWorkflowDurationSeconds,
  userDeletionWorkflowsCompletedTotal,
  userDeletionWorkflowsFailedTotal,
  userDeletionWorkflowsStartedTotal,
} from './metrics';

type PublishResult = 'success' | 'failure';
type ConsumeResult =
  | 'success'
  | 'failure'
  | 'ignored'
  | 'duplicate'
  | 'invalid';
type WorkflowResult = 'completed' | 'failed';
type WorkflowFailureStep =
  | 'publish_requested_event'
  | 'consume_anonymized_event'
  | 'finalize_user'
  | 'publish_deleted_event'
  | 'unknown';

const EVENT_TYPES = new Set([
  'user.deletion.requested',
  'user.data.anonymized',
  'user.deleted',
]);
const ROUTING_KEYS = EVENT_TYPES;
const REQUESTED_BY_VALUES = new Set(['self', 'admin', 'system']);
const REASON_VALUES = new Set([
  'user_request',
  'admin_action',
  'test',
  'unknown',
]);
const FAILURE_STEPS = new Set([
  'publish_requested_event',
  'consume_anonymized_event',
  'finalize_user',
  'publish_deleted_event',
  'unknown',
]);

@Injectable()
export class RabbitmqBusinessMetricsService {
  recordPublishedEvent(
    eventType: string,
    routingKey: string,
    result: PublishResult,
  ): void {
    safeRecord(() => {
      rabbitmqBusinessEventsPublishedTotal
        .labels(eventLabel(eventType), routingKeyLabel(routingKey), result)
        .inc();
    });
  }

  recordConsumedEvent(
    eventType: string,
    routingKey: string,
    result: ConsumeResult,
  ): void {
    safeRecord(() => {
      rabbitmqBusinessEventsConsumedTotal
        .labels(eventLabel(eventType), routingKeyLabel(routingKey), result)
        .inc();
    });
  }

  startPublishTimer(
    eventType: string,
    routingKey: string,
  ): (result: PublishResult) => void {
    const start = process.hrtime.bigint();
    return (result) => {
      safeRecord(() => {
        rabbitmqBusinessEventPublishDurationSeconds
          .labels(eventLabel(eventType), routingKeyLabel(routingKey), result)
          .observe(durationSecondsSince(start));
      });
    };
  }

  startProcessingTimer(
    eventType: string,
    routingKey: string,
  ): (result: ConsumeResult) => void {
    const start = process.hrtime.bigint();
    return (result) => {
      safeRecord(() => {
        rabbitmqBusinessEventProcessingDurationSeconds
          .labels(eventLabel(eventType), routingKeyLabel(routingKey), result)
          .observe(durationSecondsSince(start));
      });
    };
  }

  recordWorkflowStarted(requestedBy: string, reason: string): void {
    safeRecord(() => {
      userDeletionWorkflowsStartedTotal
        .labels(requestedByLabel(requestedBy), reasonLabel(reason))
        .inc();
    });
  }

  recordWorkflowCompleted(): void {
    safeRecord(() => {
      userDeletionWorkflowsCompletedTotal.inc();
    });
  }

  recordWorkflowFailed(failureStep: WorkflowFailureStep): void {
    safeRecord(() => {
      userDeletionWorkflowsFailedTotal
        .labels(failureStepLabel(failureStep))
        .inc();
    });
  }

  observeWorkflowDuration(startedAt: Date, result: WorkflowResult): void {
    safeRecord(() => {
      userDeletionWorkflowDurationSeconds
        .labels(result)
        .observe(durationSecondsBetween(startedAt, new Date()));
    });
  }
}

function safeRecord(record: () => void): void {
  try {
    record();
  } catch {
    // Metrics must never affect the application flow.
  }
}

function eventLabel(value: string): string {
  return EVENT_TYPES.has(value) ? value : 'unknown';
}

function routingKeyLabel(value: string): string {
  return ROUTING_KEYS.has(value) ? value : 'unknown';
}

function requestedByLabel(value: string): string {
  return REQUESTED_BY_VALUES.has(value) ? value : 'unknown';
}

function reasonLabel(value: string): string {
  return REASON_VALUES.has(value) ? value : 'unknown';
}

function failureStepLabel(value: WorkflowFailureStep): string {
  return FAILURE_STEPS.has(value) ? value : 'unknown';
}

function durationSecondsSince(start: bigint): number {
  return Number(process.hrtime.bigint() - start) / 1e9;
}

function durationSecondsBetween(start: Date, end: Date): number {
  return Math.max(0, (end.getTime() - start.getTime()) / 1000);
}
