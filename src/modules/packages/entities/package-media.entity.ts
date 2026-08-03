import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@/common/database/base.entity';
import { TourPackage } from '@/modules/packages/entities/tour-package.entity';
import { PackageMediaType } from '@/modules/packages/enums/package-media-type.enum';

@Entity('package_media')
export class PackageMedia extends BaseEntity {
  @Column({ name: 'package_id', type: 'uuid' })
  packageId!: string;

  @Column({ name: 'media_url' })
  mediaUrl!: string;

  @Column({
    name: 'media_type',
    type: 'enum',
    enum: PackageMediaType,
    default: PackageMediaType.IMAGE,
  })
  mediaType!: PackageMediaType;

  @Column({ nullable: true })
  caption!: string;

  @Column({ type: 'int', nullable: true })
  width!: number;

  @Column({ type: 'int', nullable: true })
  height!: number;

  @Column({ name: 'mime_type', nullable: true })
  mimeType!: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @ManyToOne(() => TourPackage, (pkg) => pkg.media, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'package_id' })
  package!: TourPackage;
}
