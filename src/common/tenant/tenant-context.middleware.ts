import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContextService } from '@/common/tenant/tenant-context.service';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private readonly tenantContextService: TenantContextService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Always initialise the AsyncLocalStorage context for every request so
    // that downstream services (TenantContextService) never encounter a
    // missing store. For unauthenticated routes agencyId will be null here;
    // it gets overwritten to the real value by TenantContextInterceptor once
    // the Passport JWT guard has run and populated req.user.
    const agencyId = (req.headers['x-agency-id'] as string) || null;

    this.tenantContextService.run({ agencyId }, () => {
      next();
    });
  }
}
