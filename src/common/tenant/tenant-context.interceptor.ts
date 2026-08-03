import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantContextService } from '@/common/tenant/tenant-context.service';

interface RequestWithUser {
  user?: { agencyId?: string };
  headers: Record<string, string | string[] | undefined>;
}

/**
 * Runs AFTER Passport JWT guard — reads agencyId from the authenticated user
 * and populates the async-local-storage tenant context for the request.
 * Apply this interceptor on any controller that needs tenant isolation.
 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(private readonly tenantContextService: TenantContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    const headerAgencyId = request.headers['x-agency-id'];
    const agencyId: string | null =
      user?.agencyId ??
      (typeof headerAgencyId === 'string' ? headerAgencyId : null);

    return new Observable((observer) => {
      this.tenantContextService.run({ agencyId }, () => {
        next.handle().subscribe({
          next: (value) => observer.next(value),
          error: (err: unknown) => observer.error(err),
          complete: () => observer.complete(),
        });
      });
    });
  }
}
