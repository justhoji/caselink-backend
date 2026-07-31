import {
  Repository,
  FindManyOptions,
  FindOneOptions,
  SelectQueryBuilder,
  DeepPartial,
  FindOptionsWhere,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { TenantBaseEntity } from '@/common/database/tenant-base.entity';
import { TenantContextService } from '@/common/tenant/tenant-context.service';

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

  findAndCount(options: FindManyOptions<T> = {}): Promise<[T[], number]> {
    const agencyId = this.getAgencyId();
    options.where = { ...options.where, agencyId } as any;
    return this.repository.findAndCount(options);
  }

  count(options: FindManyOptions<T> = {}): Promise<number> {
    const agencyId = this.getAgencyId();
    options.where = { ...options.where, agencyId } as any;
    return this.repository.count(options);
  }

  exists(options: FindManyOptions<T> = {}): Promise<boolean> {
    const agencyId = this.getAgencyId();
    options.where = { ...options.where, agencyId } as any;
    return this.repository.exists(options);
  }

  async update(
    criteria: string | number | FindOptionsWhere<T>,
    partialEntity: QueryDeepPartialEntity<T>,
  ): Promise<any> {
    const agencyId = this.getAgencyId();
    const scopedCriteria =
      typeof criteria === 'object'
        ? { ...criteria, agencyId }
        : { id: criteria, agencyId };
    return this.repository.update(scopedCriteria as any, partialEntity as any);
  }

  async delete(criteria: string | number | FindOptionsWhere<T>): Promise<any> {
    const agencyId = this.getAgencyId();
    const scopedCriteria =
      typeof criteria === 'object'
        ? { ...criteria, agencyId }
        : { id: criteria, agencyId };
    return this.repository.delete(scopedCriteria as any);
  }

  async softDelete(
    criteria: string | number | FindOptionsWhere<T>,
  ): Promise<any> {
    const agencyId = this.getAgencyId();
    const scopedCriteria =
      typeof criteria === 'object'
        ? { ...criteria, agencyId }
        : { id: criteria, agencyId };
    return this.repository.softDelete(scopedCriteria as any);
  }

  async restore(
    criteria: string | number | FindOptionsWhere<T>,
  ): Promise<any> {
    const agencyId = this.getAgencyId();
    const scopedCriteria =
      typeof criteria === 'object'
        ? { ...criteria, agencyId }
        : { id: criteria, agencyId };
    return this.repository.restore(scopedCriteria as any);
  }

  createQueryBuilder(alias: string): SelectQueryBuilder<T> {
    const agencyId = this.getAgencyId();
    return this.repository
      .createQueryBuilder(alias)
      .andWhere(`${alias}.agency_id = :agencyId`, { agencyId });
  }
}
