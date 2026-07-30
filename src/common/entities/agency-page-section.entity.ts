import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TenantBaseEntity } from '../database/tenant-base.entity';
import { Agency } from './agency.entity';

@Entity('agency_page_sections')
export class AgencyPageSection extends TenantBaseEntity {
  @Column({ name: 'section_key' })
  sectionKey!: string;

  @Column({ name: 'is_visible', default: true })
  isVisible!: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @ManyToOne(() => Agency, (agency) => agency.sections, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agency_id' })
  agency!: Agency;
}
