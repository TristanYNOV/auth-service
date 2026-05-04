import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable, catchError, finalize, throwError } from 'rxjs';
import {
  httpRequestDurationSeconds,
  httpRequestsInFlight,
  httpRequestsTotal,
} from './metrics';
import {
  markHttpMetricsRecorded,
  normalizeRoute,
  RequestWithRoute,
} from './http-metrics.utils';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<RequestWithRoute>();
    const res = http.getResponse<Response>();

    if (req.path === '/metrics') {
      return next.handle();
    }

    const method = req.method;
    const route = normalizeRoute(req);
    const start = process.hrtime.bigint();
    let errorStatusCode: number | null = null;

    httpRequestsInFlight.labels(method, route).inc();
    markHttpMetricsRecorded(res);

    return next.handle().pipe(
      catchError((error: unknown) => {
        errorStatusCode = getErrorStatusCode(error, res.statusCode);
        return throwError(() => error);
      }),
      finalize(() => {
        const finalStatusCode = String(
          errorStatusCode ?? res.statusCode ?? 500,
        );
        const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;

        httpRequestsInFlight.labels(method, route).dec();
        httpRequestsTotal.labels(method, route, finalStatusCode).inc();
        httpRequestDurationSeconds
          .labels(method, route, finalStatusCode)
          .observe(durationSeconds);
      }),
    );
  }
}

function getErrorStatusCode(error: unknown, fallback: number): number {
  if (error instanceof HttpException) {
    return error.getStatus();
  }

  return fallback >= 400 ? fallback : 500;
}
