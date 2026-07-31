import { Entity, Column, DeleteDateColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '@/common/database/base.entity';
import { AgencyPageSection } from '@/modules/agencies/entities/agency-page-section.entity';

const decimalTransformer = {
  to: (value: number | null) => value,
  from: (value: string | null) => (value ? parseFloat(value) : null),
};

@Entity('agencies')
export class Agency extends BaseEntity {
  @Column({ default: 'Caselink' })
  name!: string;

  @Column({ name: 'logo_url', nullable: true })
  logoUrl!: string;

  @Column({ name: 'cover_url', nullable: true })
  coverUrl!: string;

  @Column({ name: 'short_description', type: 'text', nullable: true })
  shortDescription!: string;

  @Column({ name: 'long_description', type: 'text', nullable: true })
  longDescription!: string;

  @Column({ nullable: true })
  phone!: string;

  @Column({ nullable: true })
  email!: string;

  @Column({ nullable: true })
  telegram!: string;

  @Column({ nullable: true })
  whatsapp!: string;

  @Column({ nullable: true })
  website!: string;

  @Column({ nullable: true })
  city!: string;

  @Column({ name: 'office_address', type: 'text', nullable: true })
  officeAddress!: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
    transformer: decimalTransformer,
  })
  latitude!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
    transformer: decimalTransformer,
  })
  longitude!: number;

  @Column({ name: 'working_hours', type: 'jsonb', nullable: true })
  workingHours!: Record<string, any>;

  @Column({ name: 'min_review_stars', type: 'int', default: 1 })
  minReviewStars!: number;

  @Column({ name: 'max_reviews_shown', type: 'int', default: 10 })
  maxReviewsShown!: number;

  @Column({ name: 'max_packages_shown', type: 'int', default: 20 })
  maxPackagesShown!: number;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt!: Date;

  @OneToMany(() => AgencyPageSection, (section) => section.agency, {
    cascade: true,
  })
  sections!: AgencyPageSection[];
}
