import { NextFunction, Request, Response } from 'express';
import { httpRequestDurationSeconds, httpRequestsTotal } from './metrics';
import {
  hasHttpMetricsRecorded,
  normalizeRoute,
  RequestWithRoute,
} from './http-metrics.utils';

export function httpMetricsFallbackMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.path === '/metrics') {
    next();
    return;
  }

  const method = req.method;
  const start = process.hrtime.bigint();

  res.once('finish', () => {
    if (hasHttpMetricsRecorded(res)) {
      return;
    }

    const route = normalizeRoute(req as RequestWithRoute);
    const statusCode = String(res.statusCode || 500);
    const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;

    httpRequestsTotal.labels(method, route, statusCode).inc();
    httpRequestDurationSeconds
      .labels(method, route, statusCode)
      .observe(durationSeconds);
  });

  next();
}
