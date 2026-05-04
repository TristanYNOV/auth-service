import { Request, Response } from 'express';

export const HTTP_METRICS_RECORDED_KEY = 'httpMetricsRecorded';

export type RequestWithRoute = Request & {
  route?: {
    path?: string | RegExp | Array<string | RegExp>;
  };
};

const UUID_PATTERN =
  /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi;
const OBJECT_ID_PATTERN = /(?<=\/)[0-9a-f]{24}(?=\/|$)/gi;

export function markHttpMetricsRecorded(res: Response): void {
  res.locals[HTTP_METRICS_RECORDED_KEY] = true;
}

export function hasHttpMetricsRecorded(res: Response): boolean {
  return res.locals[HTTP_METRICS_RECORDED_KEY] === true;
}

export function normalizeRoute(req: RequestWithRoute): string {
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
