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
