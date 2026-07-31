import { Global, Module } from '@nestjs/common';
import { TenantContextService } from '@/common/tenant/tenant-context.service';
import { TenantContextInterceptor } from '@/common/tenant/tenant-context.interceptor';

@Global()
@Module({
  providers: [TenantContextService, TenantContextInterceptor],
  exports: [TenantContextService, TenantContextInterceptor],
})
export class TenantModule {}
