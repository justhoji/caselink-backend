import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantContextService } from '@/common/tenant/tenant-context.service';

/**
 * Runs AFTER Passport JWT guard — reads agencyId from the authenticated user
 * and populates the async-local-storage tenant context for the request.
 * Apply this interceptor on any controller that needs tenant isolation.
 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(private readonly tenantContextService: TenantContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const agencyId: string | null =
      user?.agencyId ?? (request.headers['x-agency-id'] as string) ?? null;

    return new Observable((observer) => {
      this.tenantContextService.run({ agencyId }, () => {
        next.handle().subscribe({
          next: (value) => observer.next(value),
          error: (err) => observer.error(err),
          complete: () => observer.complete(),
        });
      });
    });
  }
}
