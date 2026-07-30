import {
  Repository,
  FindManyOptions,
  FindOneOptions,
  SelectQueryBuilder,
  DeepPartial,
} from 'typeorm';
import { TenantBaseEntity } from '../database/tenant-base.entity';
import { TenantContextService } from './tenant-context.service';

export class TenantRepository<T extends TenantBaseEntity> {
  constructor(
    private readonly repository: Repository<T>,
    private readonly tenantContextService: TenantContextService,
  ) {}

  private getAgencyId(): string {
    return this.tenantContextService.getRequiredAgencyId();
  }

  create(entityLike?: DeepPartial<T>): T {
    const entity = entityLike
      ? this.repository.create(entityLike)
      : this.repository.create();

    entity.agencyId = this.getAgencyId();
    return entity;
  }

  async save(entity: DeepPartial<T>): Promise<T> {
    entity.agencyId = this.getAgencyId();
    return this.repository.save(entity as T);
  }

  find(options: FindManyOptions<T> = {}): Promise<T[]> {
    const agencyId = this.getAgencyId();
    options.where = { ...options.where, agencyId } as any;
    return this.repository.find(options);
  }

  findOne(options: FindOneOptions<T>): Promise<T | null> {
    const agencyId = this.getAgencyId();
    options.where = { ...options.where, agencyId } as any;
    return this.repository.findOne(options);
  }

  createQueryBuilder(alias: string): SelectQueryBuilder<T> {
    const agencyId = this.getAgencyId();
    return this.repository
      .createQueryBuilder(alias)
      .andWhere(`${alias}.agency_id = :agencyId`, { agencyId });
  }
}
