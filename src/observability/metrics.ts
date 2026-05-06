import {
  collectDefaultMetrics,
  Counter,
  Gauge,
  Histogram,
  register,
} from 'prom-client';

export const SERVICE_NAME = 'auth-service';

let defaultMetricsStarted = false;

export function setupMetrics(): void {
  register.setDefaultLabels({ service: SERVICE_NAME });

  if (
    defaultMetricsStarted ||
    register.getSingleMetric('process_cpu_user_seconds_total')
  ) {
    return;
  }

  collectDefaultMetrics({
    register,
    eventLoopMonitoringPrecision: 20,
  });
  defaultMetricsStarted = true;
}

function counter(name: string, help: string, labelNames: string[]): Counter {
  return (
    (register.getSingleMetric(name) as Counter | undefined) ??
    new Counter({ name, help, labelNames, registers: [register] })
  );
}

function gauge(name: string, help: string, labelNames: string[]): Gauge {
  return (
    (register.getSingleMetric(name) as Gauge | undefined) ??
    new Gauge({ name, help, labelNames, registers: [register] })
  );
}

function histogram(
  name: string,
  help: string,
  labelNames: string[],
): Histogram {
  return (
    (register.getSingleMetric(name) as Histogram | undefined) ??
    new Histogram({
      name,
      help,
      labelNames,
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [register],
    })
  );
}

export const httpRequestsTotal = counter(
  'http_requests_total',
  'Total number of HTTP requests.',
  ['method', 'route', 'status_code'],
);

export const httpRequestDurationSeconds = histogram(
  'http_request_duration_seconds',
  'HTTP request duration in seconds.',
  ['method', 'route', 'status_code'],
);

export const httpRequestsInFlight = gauge(
  'http_requests_in_flight',
  'Number of HTTP requests currently in flight.',
  ['method', 'route'],
);

export const rabbitmqBusinessEventsPublishedTotal = counter(
  'rabbitmq_business_events_published_total',
  'Total number of RabbitMQ business events published.',
  ['event_type', 'routing_key', 'result'],
);

export const rabbitmqBusinessEventsConsumedTotal = counter(
  'rabbitmq_business_events_consumed_total',
  'Total number of RabbitMQ business events consumed.',
  ['event_type', 'routing_key', 'result'],
);

export const rabbitmqBusinessEventPublishDurationSeconds = histogram(
  'rabbitmq_business_event_publish_duration_seconds',
  'RabbitMQ business event publish duration in seconds.',
  ['event_type', 'routing_key', 'result'],
);

export const rabbitmqBusinessEventProcessingDurationSeconds = histogram(
  'rabbitmq_business_event_processing_duration_seconds',
  'RabbitMQ business event consumer processing duration in seconds.',
  ['event_type', 'routing_key', 'result'],
);

export const userDeletionWorkflowsStartedTotal = counter(
  'user_deletion_workflows_started_total',
  'Total number of user deletion workflows started.',
  ['requested_by', 'reason'],
);

export const userDeletionWorkflowsCompletedTotal = counter(
  'user_deletion_workflows_completed_total',
  'Total number of user deletion workflows completed.',
  [],
);

export const userDeletionWorkflowsFailedTotal = counter(
  'user_deletion_workflows_failed_total',
  'Total number of failed user deletion workflows.',
  ['failure_step'],
);

export const userDeletionWorkflowDurationSeconds = histogram(
  'user_deletion_workflow_duration_seconds',
  'User deletion workflow duration in seconds.',
  ['result'],
);
