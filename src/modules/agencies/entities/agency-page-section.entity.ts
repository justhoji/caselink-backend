import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TenantBaseEntity } from '@/common/database/tenant-base.entity';
import { Agency } from '@/modules/agencies/entities/agency.entity';
import { PageSectionKey } from '@/modules/agencies/enums/page-section-key.enum';

@Entity('agency_page_sections')
export class AgencyPageSection extends TenantBaseEntity {
  @Column({ name: 'section_key', type: 'enum', enum: PageSectionKey })
  sectionKey!: PageSectionKey;

  @Column({ name: 'is_visible', default: true })
  isVisible!: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @ManyToOne(() => Agency, (agency) => agency.sections, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agency_id' })
  agency!: Agency;
}
