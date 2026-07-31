import { Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export abstract class TenantBaseEntity extends BaseEntity {
  @Index()
  @Column({ name: 'agency_id', type: 'uuid' })
  agencyId!: string;
}