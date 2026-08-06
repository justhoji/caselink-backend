import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateIf,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Currency } from '@/modules/packages/enums/currency.enum';
import { PricingType } from '@/modules/packages/enums/pricing-type.enum';
import { HotelServiceType } from '@/modules/packages/enums/hotel-service-type.enum';
import { MealOption } from '@/modules/packages/enums/meal-option.enum';
import { RoomCategory } from '@/modules/packages/enums/room-category.enum';

export class PackageHotelDto {
  @ApiProperty({
    example: 'Rixos Premium Sharm',
    description: 'Name of the hotel',
  })
  @IsString()
  @IsNotEmpty()
  hotelName!: string;

  @ApiProperty({
    example: 5,
    description: 'Star rating (1 to 5 stars)',
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  stars!: number;

  @ApiProperty({
    enum: MealOption,
    example: MealOption.ALL_INCLUSIVE,
    description:
      'Required meal plan option (BED_AND_BREAKFAST, HALF_BOARD, FULL_BOARD, ALL_INCLUSIVE, ULTRA_ALL_INCLUSIVE)',
  })
  @IsEnum(MealOption)
  @IsNotEmpty()
  mealOption!: MealOption;

  @ApiProperty({
    enum: RoomCategory,
    example: RoomCategory.DELUXE,
    description:
      'Required suite/room category (STANDARD, SUPERIOR, DELUXE, SUITE, APARTMENT)',
  })
  @IsEnum(RoomCategory)
  @IsNotEmpty()
  roomCategory!: RoomCategory;

  @ApiProperty({
    example: 'https://www.rixos.com/en/hotel-resort/rixos-sharm-el-sheikh',
    description: 'Direct link to hotel website or booking page',
  })
  @IsString()
  @IsNotEmpty()
  link!: string;

  @ApiPropertyOptional({
    example:
      '/uploads/agencies/6497f1f9-9689-4977-bc60-d2634e3a4794/hotel_cover.jpg',
    description: 'Public URL or path to hotel image',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    example: 'Deluxe Sea View Room',
    description: 'Specific room type description',
  })
  @IsOptional()
  @IsString()
  roomType?: string;

  @ApiPropertyOptional({
    example: 'Ultra All Inclusive',
    description: 'Additional meal plan text description',
  })
  @IsOptional()
  @IsString()
  mealPlan?: string;

  @ApiPropertyOptional({
    example: 'Nabq Bay, Sharm El Sheikh, Egypt',
    description: 'Hotel physical address',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    example: 4.9,
    description: 'Guest review rating (0.0 to 10.0)',
    minimum: 0,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  rating?: number;

  @ApiPropertyOptional({
    enum: HotelServiceType,
    isArray: true,
    example: [
      HotelServiceType.TWO_WAY_FLIGHTS,
      HotelServiceType.MEAL,
      HotelServiceType.TRANSFER,
      HotelServiceType.INSURANCE,
    ],
    description: 'Predefined services included with this hotel option',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(HotelServiceType, { each: true })
  services?: HotelServiceType[];

  @ApiProperty({
    enum: Currency,
    example: Currency.USD,
    description: 'Pricing currency (USD, EUR, UZS)',
  })
  @IsEnum(Currency)
  @IsNotEmpty()
  currency!: Currency;

  @ApiProperty({
    enum: PricingType,
    example: PricingType.PER_PERSON,
    description: 'Pricing model (PER_PERSON or BATCH)',
  })
  @IsEnum(PricingType)
  @IsNotEmpty()
  pricingType!: PricingType;

  // PER_PERSON Pricing
  @ApiPropertyOptional({
    example: 1200,
    description: 'Adult price (Required if pricingType is PER_PERSON)',
  })
  @ValidateIf((o: PackageHotelDto) => o.pricingType === PricingType.PER_PERSON)
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  priceAdult?: number;

  @ApiPropertyOptional({
    example: 650,
    description:
      'Child price (2-12 yrs) (Required if pricingType is PER_PERSON)',
  })
  @ValidateIf((o: PackageHotelDto) => o.pricingType === PricingType.PER_PERSON)
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  priceChild?: number;

  @ApiPropertyOptional({
    example: 150,
    description:
      'Infant price (0-2 yrs) (Required if pricingType is PER_PERSON)',
  })
  @ValidateIf((o: PackageHotelDto) => o.pricingType === PricingType.PER_PERSON)
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  priceInfant?: number;

  // BATCH Pricing
  @ApiPropertyOptional({
    example: 2800,
    description: 'Total batch price (Required if pricingType is BATCH)',
  })
  @ValidateIf((o: PackageHotelDto) => o.pricingType === PricingType.BATCH)
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  priceBatchTotal?: number;

  @ApiPropertyOptional({
    example: 2,
    description:
      'Number of adults included in batch (Required if pricingType is BATCH)',
  })
  @ValidateIf((o: PackageHotelDto) => o.pricingType === PricingType.BATCH)
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  batchAdultsCount?: number;

  @ApiPropertyOptional({
    example: 2,
    description:
      'Number of children included in batch (Required if pricingType is BATCH)',
  })
  @ValidateIf((o: PackageHotelDto) => o.pricingType === PricingType.BATCH)
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  batchChildrenCount?: number;

  @ApiPropertyOptional({ example: 0, description: 'Sort order position' })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
