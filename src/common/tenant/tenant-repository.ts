import {
  Repository,
  FindManyOptions,
  FindOneOptions,
  SelectQueryBuilder,
  DeepPartial,
  FindOptionsWhere,
  UpdateResult,
  DeleteResult,
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

  private scopeWhere(
    where?: FindOptionsWhere<T> | FindOptionsWhere<T>[],
  ): FindOptionsWhere<T> | FindOptionsWhere<T>[] {
    const agencyId = this.getAgencyId();
    if (Array.isArray(where)) {
      return where.map((w) => ({ ...w, agencyId }));
    }
    return { ...where, agencyId } as FindOptionsWhere<T>;
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
    options.where = this.scopeWhere(options.where);
    return this.repository.find(options);
  }

  findOne(options: FindOneOptions<T>): Promise<T | null> {
    options.where = this.scopeWhere(options.where);
    return this.repository.findOne(options);
  }

  findAndCount(options: FindManyOptions<T> = {}): Promise<[T[], number]> {
    options.where = this.scopeWhere(options.where);
    return this.repository.findAndCount(options);
  }

  count(options: FindManyOptions<T> = {}): Promise<number> {
    options.where = this.scopeWhere(options.where);
    return this.repository.count(options);
  }

  exists(options: FindManyOptions<T> = {}): Promise<boolean> {
    options.where = this.scopeWhere(options.where);
    return this.repository.exists(options);
  }

  async update(
    criteria: string | number | FindOptionsWhere<T>,
    partialEntity: QueryDeepPartialEntity<T>,
  ): Promise<UpdateResult> {
    const agencyId = this.getAgencyId();
    const scopedCriteria: FindOptionsWhere<T> =
      typeof criteria === 'object'
        ? { ...criteria, agencyId }
        : ({ id: criteria, agencyId } as unknown as FindOptionsWhere<T>);
    return this.repository.update(scopedCriteria, partialEntity);
  }

  async delete(
    criteria: string | number | FindOptionsWhere<T>,
  ): Promise<DeleteResult> {
    const agencyId = this.getAgencyId();
    const scopedCriteria: FindOptionsWhere<T> =
      typeof criteria === 'object'
        ? { ...criteria, agencyId }
        : ({ id: criteria, agencyId } as unknown as FindOptionsWhere<T>);
    return this.repository.delete(scopedCriteria);
  }

  async softDelete(
    criteria: string | number | FindOptionsWhere<T>,
  ): Promise<UpdateResult> {
    const agencyId = this.getAgencyId();
    const scopedCriteria: FindOptionsWhere<T> =
      typeof criteria === 'object'
        ? { ...criteria, agencyId }
        : ({ id: criteria, agencyId } as unknown as FindOptionsWhere<T>);
    return this.repository.softDelete(scopedCriteria);
  }

  async restore(
    criteria: string | number | FindOptionsWhere<T>,
  ): Promise<UpdateResult> {
    const agencyId = this.getAgencyId();
    const scopedCriteria: FindOptionsWhere<T> =
      typeof criteria === 'object'
        ? { ...criteria, agencyId }
        : ({ id: criteria, agencyId } as unknown as FindOptionsWhere<T>);
    return this.repository.restore(scopedCriteria);
  }

  createQueryBuilder(alias: string): SelectQueryBuilder<T> {
    const agencyId = this.getAgencyId();
    return this.repository
      .createQueryBuilder(alias)
      .andWhere(`${alias}.agency_id = :agencyId`, { agencyId });
  }
}
