import { Module, Global } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './winston.config';

/**
 * GlobalLoggerModule — registers the Winston-backed NestJS logger globally.
 * Import once in AppModule; every service that injects `Logger` or
 * `WINSTON_MODULE_PROVIDER` will receive the shared Winston instance.
 */
@Global()
@Module({
  imports: [WinstonModule.forRoot(winstonConfig)],
  exports: [WinstonModule],
})
export class LoggerModule {}
