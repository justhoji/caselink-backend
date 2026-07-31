import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContextService } from '@/common/tenant/tenant-context.service';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private readonly tenantContextService: TenantContextService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // NOTE: Passport JWT guard runs AFTER middleware, so req.user is always
    // undefined here. For JWT-authenticated routes, tenant context is
    // re-populated by TenantContextInterceptor (which runs post-auth).
    // This middleware only handles explicit x-agency-id header requests.
    const agencyId = (req.headers['x-agency-id'] as string) || null;

    this.tenantContextService.run({ agencyId }, () => {
      next();
    });
  }
}

