import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantContextService } from './common/tenant/tenant-context.service';
import { TenantContextMiddleware } from './common/tenant/tenant-context.middleware';
import { Agency } from './common/entities/agency.entity';
import { AgencyPageSection } from './common/entities/agency-page-section.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
        entities: [Agency, AgencyPageSection],
        synchronize: config.get<boolean>('DB_SYNCHRONIZE', true),
        logging: config.get<boolean>('DB_LOGGING', false),
      }),
    }),
  ],
  providers: [TenantContextService],
  exports: [TenantContextService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}
