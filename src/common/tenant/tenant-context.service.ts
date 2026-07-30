import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  agencyId: string | null;
}

@Injectable()
export class TenantContextService {
  private static readonly asyncLocalStorage =
    new AsyncLocalStorage<TenantContext>();

  /**
   * Runs request execution inside a tenant store context.  
   */
  run<R>(context: TenantContext, callback: () => R): R {
    return TenantContextService.asyncLocalStorage.run(context, callback);
  }

  /**
   * Retrieves current request's agencyId.  
   */
  getAgencyId(): string | null {
    const store = TenantContextService.asyncLocalStorage.getStore();
    return store?.agencyId ?? null;
  }

  /**
   * Retrieves agencyId or throws if no tenant context is active.  
   */
  getRequiredAgencyId(): string {
    const agencyId = this.getAgencyId();
    if (!agencyId) {
      throw new Error(
        'Tenant Context Error: Operation requires an active agency_id in context.',
      );
    }
    return agencyId;
  }
}
