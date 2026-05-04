import { NextFunction, Request, Response } from 'express';
import {
  httpRequestDurationSeconds,
  httpRequestsInFlight,
  httpRequestsTotal,
} from './metrics';

type RequestWithRoute = Request & {
  route?: {
    path?: string | RegExp | Array<string | RegExp>;
  };
};

const UUID_PATTERN =
  /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi;
const OBJECT_ID_PATTERN = /(?<=\/)[0-9a-f]{24}(?=\/|$)/gi;

export function httpMetricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.path === '/metrics') {
    next();
    return;
  }

  const method = req.method;
  const inFlightRoute = '/pending';
  const start = process.hrtime.bigint();

  httpRequestsInFlight.labels(method, inFlightRoute).inc();

  res.once('finish', () => {
    const route = normalizeRoute(req);
    const statusCode = String(res.statusCode);
    const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;

    httpRequestsInFlight.labels(method, inFlightRoute).dec();
    httpRequestsTotal.labels(method, route, statusCode).inc();
    httpRequestDurationSeconds
      .labels(method, route, statusCode)
      .observe(durationSeconds);
  });

  next();
}

function normalizeRoute(req: RequestWithRoute): string {
  const routePath = toRoutePath(req.route?.path);
  if (routePath) {
    return normalizePath(`${req.baseUrl ?? ''}${routePath}`);
  }

  return normalizePath(req.path || req.originalUrl || req.url || '/');
}

function toRoutePath(
  routePath?: string | RegExp | Array<string | RegExp>,
): string | null {
  if (Array.isArray(routePath)) {
    return toRoutePath(routePath[0]);
  }

  if (typeof routePath === 'string') {
    return routePath;
  }

  return null;
}

function normalizePath(path: string): string {
  const withoutQuery = path.split('?')[0] || '/';
  const normalized = withoutQuery
    .replace(UUID_PATTERN, ':id')
    .replace(OBJECT_ID_PATTERN, ':id')
    .replace(/\/+/g, '/');

  if (normalized.length > 1 && normalized.endsWith('/')) {
    return normalized.slice(0, -1);
  }

  return normalized;
}
