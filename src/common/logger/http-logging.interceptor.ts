import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import type { LoggerService } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

/** Paths whose traffic is too noisy to log (Swagger UI assets, health checks). */
const SKIP_PATHS = ['/api/docs', '/favicon.ico'];

const CONTEXT = 'HTTP';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const { method, url } = req;

    // Skip noisy paths
    if (SKIP_PATHS.some((p) => url.startsWith(p))) {
      return next.handle();
    }

    const ip = this.extractIp(req);
    const userAgent = req.get('user-agent') ?? '-';
    const agencyId = (req.headers['x-agency-id'] as string | undefined) ?? '-';
    const startedAt = Date.now();

    // ── Incoming request ────────────────────────────────────────────────────
    this.logger.log(
      `→ ${method} ${url} | ip=${ip} agency=${agencyId} ua="${userAgent}"`,
      CONTEXT,
    );

    return next.handle().pipe(
      tap({
        // ── Successful response ──────────────────────────────────────────────
        next: () => {
          const ms = Date.now() - startedAt;
          const { statusCode } = res;
          this.logger.log(`← ${method} ${url} ${statusCode} ${ms}ms`, CONTEXT);
        },

        // ── Error response (4xx / 5xx) ───────────────────────────────────────
        error: (err: unknown) => {
          const ms = Date.now() - startedAt;
          const status: number =
            err != null &&
            typeof err === 'object' &&
            'status' in err &&
            typeof err.status === 'number'
              ? (err as { status: number }).status
              : 500;
          const message = err instanceof Error ? err.message : String(err);
          const stack = err instanceof Error ? err.stack : undefined;

          if (status >= 500) {
            // 5xx — log as error with stack trace
            this.logger.error(
              `← ${method} ${url} ${status} ${ms}ms | ${message}`,
              stack,
              CONTEXT,
            );
          } else {
            // 4xx — log as warn (expected client errors, no stack needed)
            this.logger.warn(
              `← ${method} ${url} ${status} ${ms}ms | ${message}`,
              CONTEXT,
            );
          }
        },
      }),
    );
  }

  /**
   * Resolves the real client IP, respecting common reverse-proxy headers.
   * Falls back to the socket remote address.
   */
  private extractIp(req: Request): string {
    const forwarded = req.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return req.socket?.remoteAddress ?? req.ip ?? 'unknown';
  }
}
