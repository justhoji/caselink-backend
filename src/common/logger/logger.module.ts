import { Module, Global } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './winston.config';
import { HttpLoggingInterceptor } from './http-logging.interceptor';
import { AllExceptionsFilter } from './all-exceptions.filter';

@Global()
@Module({
  imports: [WinstonModule.forRoot(winstonConfig)],
  providers: [HttpLoggingInterceptor, AllExceptionsFilter],
  exports: [WinstonModule, HttpLoggingInterceptor, AllExceptionsFilter],
})
export class LoggerModule {}
