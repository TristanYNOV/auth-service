import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { STATUS_CODES } from 'node:http';
import { Response, Request } from 'express';

function toMessageString(message: unknown): string {
  if (Array.isArray(message)) {
    return message.join('; ');
  }

  if (typeof message === 'string') {
    return message;
  }

  if (message === undefined || message === null) {
    return 'Unexpected error';
  }

  return String(message);
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const defaultError =
      STATUS_CODES[statusCode] ??
      STATUS_CODES[HttpStatus.INTERNAL_SERVER_ERROR] ??
      'Internal Server Error';

    let error = defaultError;
    let message = 'Unexpected error';

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else {
        const normalizedResponse = exceptionResponse as {
          message?: unknown;
          error?: unknown;
        };
        message = toMessageString(normalizedResponse.message);
        if (typeof normalizedResponse.error === 'string') {
          error = normalizedResponse.error;
        }
      }

      if (!message || message === 'Unexpected error') {
        message = exception.message;
      }
    }

    response.status(statusCode).json({
      statusCode,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
