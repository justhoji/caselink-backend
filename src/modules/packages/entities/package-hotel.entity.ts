import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@/common/database/base.entity';
import { TourPackage } from '@/modules/packages/entities/tour-package.entity';
import { Currency } from '@/modules/packages/enums/currency.enum';
import { PricingType } from '@/modules/packages/enums/pricing-type.enum';
import { HotelServiceType } from '@/modules/packages/enums/hotel-service-type.enum';
import { MealOption } from '@/modules/packages/enums/meal-option.enum';
import { RoomCategory } from '@/modules/packages/enums/room-category.enum';

const decimalTransformer = {
  to: (value: number | null) => value,
  from: (value: string | null) => (value ? parseFloat(value) : null),
};

@Entity('package_hotels')
export class PackageHotel extends BaseEntity {
  @Column({ name: 'package_id', type: 'uuid' })
  packageId!: string;

  @Column({ name: 'hotel_name' })
  hotelName!: string;

  @Column({ type: 'int', default: 4 })
  stars!: number;

  @Column({
    name: 'meal_option',
    type: 'enum',
    enum: MealOption,
    default: MealOption.ALL_INCLUSIVE,
  })
  mealOption!: MealOption;

  @Column({
    name: 'room_category',
    type: 'enum',
    enum: RoomCategory,
    default: RoomCategory.STANDARD,
  })
  roomCategory!: RoomCategory;

  @Column({ name: 'room_type', nullable: true })
  roomType!: string;

  @Column({ name: 'meal_plan', nullable: true })
  mealPlan!: string;

  @Column({ nullable: true })
  address!: string;

  @Column({ nullable: true })
  link!: string;

  @Column({ name: 'image_url', nullable: true })
  imageUrl?: string;

  @Column({
    type: 'decimal',
    precision: 3,
    scale: 1,
    nullable: true,
    transformer: decimalTransformer,
  })
  rating!: number;

  // Predefined services offered by this hotel
  @Column({ name: 'services', type: 'jsonb', default: '[]' })
  services!: HotelServiceType[];

  // Pricing model specific to this hotel option
  @Column({
    type: 'enum',
    enum: Currency,
    default: Currency.USD,
  })
  currency!: Currency;

  @Column({
    name: 'pricing_type',
    type: 'enum',
    enum: PricingType,
    default: PricingType.PER_PERSON,
  })
  pricingType!: PricingType;

  // PER_PERSON Pricing Fields
  @Column({
    name: 'price_adult',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  priceAdult!: number;

  @Column({
    name: 'price_child',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  priceChild!: number;

  @Column({
    name: 'price_infant',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  priceInfant!: number;

  // BATCH Pricing Fields
  @Column({
    name: 'price_batch_total',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  priceBatchTotal!: number;

  @Column({ name: 'batch_adults_count', type: 'int', nullable: true })
  batchAdultsCount!: number;

  @Column({ name: 'batch_children_count', type: 'int', nullable: true })
  batchChildrenCount!: number;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @ManyToOne(() => TourPackage, (pkg) => pkg.hotels, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'package_id' })
  package!: TourPackage;
}
