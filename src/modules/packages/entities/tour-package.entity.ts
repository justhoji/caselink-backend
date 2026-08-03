import { Entity, Column, OneToMany, DeleteDateColumn, Index } from 'typeorm';
import { TenantBaseEntity } from '@/common/database/tenant-base.entity';
import { PackageHotel } from '@/modules/packages/entities/package-hotel.entity';
import { PackageMedia } from '@/modules/packages/entities/package-media.entity';
import { PackageFlight } from '@/modules/packages/entities/package-flight.entity';
import { PackageExtra } from '@/modules/packages/entities/package-extra.entity';

@Entity('tour_packages')
export class TourPackage extends TenantBaseEntity {
  @Column()
  title!: string;

  @Index({ unique: true, where: 'deleted_at IS NULL' })
  @Column()
  slug!: string;

  @Column()
  destination!: string;

  @Column({ name: 'cover_image_url', nullable: true })
  coverImageUrl!: string;

  // Unified Description
  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ name: 'is_published', default: false })
  isPublished!: boolean;

  @Column({ name: 'is_featured', default: false })
  isFeatured!: boolean;

  @Column({ name: 'start_date', type: 'date' })
  startDate!: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate!: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt!: Date;

  @OneToMany(() => PackageHotel, (hotel) => hotel.package, {
    cascade: true,
  })
  hotels!: PackageHotel[];

  @OneToMany(() => PackageMedia, (media) => media.package, {
    cascade: true,
  })
  media!: PackageMedia[];

  @OneToMany(() => PackageFlight, (flight) => flight.package, {
    cascade: true,
  })
  flights!: PackageFlight[];

  @OneToMany(() => PackageExtra, (extra) => extra.package, {
    cascade: true,
  })
  extras!: PackageExtra[];
}
