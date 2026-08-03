import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@/common/database/base.entity';
import { TourPackage } from '@/modules/packages/entities/tour-package.entity';

const decimalTransformer = {
  to: (value: number | null) => value,
  from: (value: string | null) => (value ? parseFloat(value) : null),
};

@Entity('package_extras')
export class PackageExtra extends BaseEntity {
  @Column({ name: 'package_id', type: 'uuid' })
  packageId!: string;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ name: 'is_included', default: true })
  isIncluded!: boolean;

  @Column({
    name: 'additional_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  additionalPrice!: number;

  @ManyToOne(() => TourPackage, (pkg) => pkg.extras, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'package_id' })
  package!: TourPackage;
}
