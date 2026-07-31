import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContextService } from '@/common/tenant/tenant-context.service';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private readonly tenantContextService: TenantContextService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const staffUser = (req as any).user;
    const agencyId =
      staffUser?.agencyId || (req.headers['x-agency-id'] as string) || null;

    this.tenantContextService.run({ agencyId }, () => {
      next();
    });
  }
}
