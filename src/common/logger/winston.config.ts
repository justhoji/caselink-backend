import { format, transports } from 'winston';
import type { WinstonModuleOptions } from 'nest-winston';

const { combine, timestamp, printf, colorize, errors, json, splat } = format;

// ─── Helpers ────────────────────────────────────────────────────────────────

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Human-readable, colorized format for local development.
 *
 * Example output:
 *   2026-08-04T11:30:00.000Z  INFO  [TokenService] Refresh-token cleanup: removed 3 expired tokens.
 */
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  errors({ stack: true }),
  splat(),
  printf(({ level, message, timestamp, context, stack, ...meta }) => {
    const ctx = context ? `[${context}]` : '';
    const extra =
      Object.keys(meta).length > 0
        ? `\n${JSON.stringify(meta, null, 2)}`
        : '';
    const stackTrace = stack ? `\n${stack}` : '';
    return `${timestamp}  ${level.padEnd(17)}  ${ctx} ${message}${extra}${stackTrace}`;
  }),
);

/**
 * Machine-readable JSON format for production / log aggregators.
 *
 * Every log line is a single JSON object:
 *   { "level":"info", "message":"...", "context":"TokenService", "timestamp":"..." }
 */
const prodFormat = combine(
  timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  errors({ stack: true }),
  splat(),
  json(),
);

// ─── Transport List ──────────────────────────────────────────────────────────

const devTransports = [
  new transports.Console({
    level: 'debug',
    format: devFormat,
  }),
];

const prodTransports = [
  // Structured JSON to stdout — let the container / log collector handle routing
  new transports.Console({
    level: 'info',
    format: prodFormat,
  }),
  // Keep the last 14 days of error logs on disk for post-mortem debugging
  new transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: prodFormat,
    maxsize: 10 * 1024 * 1024, // 10 MB per file
    maxFiles: 14,
  }),
  new transports.File({
    filename: 'logs/combined.log',
    level: 'info',
    format: prodFormat,
    maxsize: 10 * 1024 * 1024,
    maxFiles: 7,
  }),
];

// ─── Exported Config ─────────────────────────────────────────────────────────

export const winstonConfig: WinstonModuleOptions = {
  /**
   * Silent mode during unit tests to keep test output clean.
   * Override by setting NODE_ENV=test.
   */
  silent: process.env.NODE_ENV === 'test',

  transports: isProduction ? prodTransports : devTransports,
};
