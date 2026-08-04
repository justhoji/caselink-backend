import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';
import * as Joi from 'joi';
import { join } from 'path';
import { TenantContextMiddleware } from '@/common/tenant/tenant-context.middleware';
import { TenantModule } from '@/common/tenant/tenant.module';
import { LoggerModule } from '@/common/logger';
import { AgenciesModule } from '@/modules/agencies/agencies.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { UsersModule } from '@/modules/users/users.module';
import { EmailModule } from '@/modules/email/email.module';
import { SmsModule } from '@/modules/sms/sms.module';
import { MediaModule } from '@/modules/media/media.module';
import { PackagesModule } from '@/modules/packages/packages.module';

@Module({
  imports: [
    // LoggerModule must come first so the global Winston logger
    // is available to all modules that follow.
    LoggerModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().default(3000),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().default(5432),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
        DB_LOGGING: Joi.boolean().default(false),
        JWT_STAFF_SECRET: Joi.string().min(32).required(),
        JWT_ACCESS_EXPIRATION: Joi.string().default('15m'),
        JWT_ACCESS_EXPIRATION_SECONDS: Joi.number().default(900),
        JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),
        JWT_REFRESH_EXPIRATION_DAYS: Joi.number().default(7),
        AUTH_MAX_FAILED_ATTEMPTS: Joi.number().default(5),
        AUTH_LOCKOUT_MINUTES: Joi.number().default(15),
        OTP_COOLDOWN_SECONDS: Joi.number().default(60),
        OTP_EXPIRATION_MINUTES: Joi.number().default(5),
        THROTTLE_TTL: Joi.number().default(60000),
        THROTTLE_LIMIT: Joi.number().default(100),
        SMTP_HOST: Joi.string().optional().default('smtp.gmail.com'),
        SMTP_PORT: Joi.number().optional().default(465),
        SMTP_USER: Joi.string().optional().allow(''),
        SMTP_PASS: Joi.string().optional().allow(''),
        SMTP_SECURE: Joi.boolean().optional().default(true),
        EMAIL_FROM: Joi.string()
          .optional()
          .default('Caselink <noreply@caselink.uz>'),
        SMS_GATEWAY_URL: Joi.string()
          .optional()
          .default('http://10.1.1.97:3000/api/v2'),
        SMS_API_KEY: Joi.string().optional().allow(''),
        SMS_API_SECRET: Joi.string().optional().allow(''),
        SMS_TEMPLATE_ID: Joi.number().optional().default(10),
        HOST: Joi.string().uri().optional().default('http://localhost:3000'),
        AUTH_OTP_MAX_ATTEMPTS: Joi.number().default(5),
      }),
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL', 60000),
          limit: config.get<number>('THROTTLE_LIMIT', 100),
        },
      ],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    ScheduleModule.forRoot(),
    TenantModule,
    EmailModule,
    SmsModule,
    MediaModule,
    AgenciesModule,
    AuthModule,
    UsersModule,
    PackagesModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE'),
        autoLoadEntities: true,
        // Never let TypeORM auto-mutate the schema — use migrations instead.
        synchronize: false,
        logging: config.get<boolean>('DB_LOGGING', false),
        /**
         * Explicit pg connection-pool settings.
         *
         * Without these, TypeORM lets pg use its own defaults and during the
         * synchronize/schema-introspection phase it can fire several queries on
         * the same client before the previous one resolves — triggering the
         * pg@8 "client already executing a query" DeprecationWarning.
         *
         * Setting a proper pool size forces each query to acquire its own
         * dedicated client from the pool, eliminating the race condition.
         */
        extra: {
          // Max number of clients in the pool.
          max: 10,
          // Close idle clients after 30 s to avoid holding stale connections.
          idleTimeoutMillis: 30_000,
          // Fail fast if a new connection cannot be established within 5 s.
          connectionTimeoutMillis: 5_000,
        },
      }),
    }),
  ],
  providers: [],
  exports: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}
