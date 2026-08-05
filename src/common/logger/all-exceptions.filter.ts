import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import type { LoggerService } from '@nestjs/common';
import type { Request, Response } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

/**
 * Shape returned to the client for every error response.
 *
 * Example (4xx):
 * {
 *   "statusCode": 401,
 *   "error": "Unauthorized",
 *   "message": "Invalid credentials.",
 *   "timestamp": "2026-08-05T09:00:00.000Z",
 *   "path": "/auth/staff/login/password"
 * }
 *
 * Example (5xx — internal detail is intentionally hidden from clients):
 * {
 *   "statusCode": 500,
 *   "error": "Internal Server Error",
 *   "message": "An unexpected error occurred. Please try again later.",
 *   "timestamp": "...",
 *   "path": "..."
 * }
 */
export interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  timestamp: string;
  path: string;
}

const CONTEXT = 'ExceptionFilter';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const { method, url } = req;
    const timestamp = new Date().toISOString();

    let statusCode: number;
    let clientMessage: string | string[];

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();

      const responseBody = exception.getResponse();
      if (typeof responseBody === 'string') {
        clientMessage = responseBody;
      } else if (
        typeof responseBody === 'object' &&
        responseBody !== null &&
        'message' in responseBody
      ) {
        clientMessage = (responseBody as { message: string | string[] })
          .message;
      } else {
        clientMessage = exception.message;
      }
    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      clientMessage = 'An unexpected error occurred. Please try again later.';
    }

    if (statusCode >= 500) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      const detail =
        exception instanceof Error ? exception.message : String(exception);

      this.logger.error(
        `${method} ${url} → ${statusCode} | ${detail}`,
        stack,
        CONTEXT,
      );
    }
    const errorLabel =
      statusCode >= 500
        ? 'Internal Server Error'
        : (HttpStatus[statusCode] ?? 'Error').replace(/_/g, ' ');

    const body: ErrorResponse = {
      statusCode,
      error: errorLabel,
      message: clientMessage,
      timestamp,
      path: url,
    };

    res.status(statusCode).json(body);
  }
}
