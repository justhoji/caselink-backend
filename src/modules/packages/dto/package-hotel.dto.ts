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
import { Currency } from '@/modules/packages/enums/currency.enum';
import { PricingType } from '@/modules/packages/enums/pricing-type.enum';
import { HotelServiceType } from '@/modules/packages/enums/hotel-service-type.enum';

export class PackageHotelDto {
  @IsString()
  @IsNotEmpty()
  hotelName!: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  stars!: number;

  @IsString()
  @IsNotEmpty()
  link!: string;

  @IsOptional()
  @IsString()
  roomType?: string;

  @IsOptional()
  @IsString()
  mealPlan?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  rating?: number;

  // Predefined hotel services offered
  @IsOptional()
  @IsArray()
  @IsEnum(HotelServiceType, { each: true })
  services?: HotelServiceType[];

  // Hotel-specific Pricing Options
  @IsEnum(Currency)
  @IsNotEmpty()
  currency!: Currency;

  @IsEnum(PricingType)
  @IsNotEmpty()
  pricingType!: PricingType;

  // PER_PERSON Pricing (Strictly required when pricingType === PER_PERSON)
  @ValidateIf((o: PackageHotelDto) => o.pricingType === PricingType.PER_PERSON)
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  priceAdult?: number;

  @ValidateIf((o: PackageHotelDto) => o.pricingType === PricingType.PER_PERSON)
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  priceChild?: number;

  @ValidateIf((o: PackageHotelDto) => o.pricingType === PricingType.PER_PERSON)
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  priceInfant?: number;

  // BATCH Pricing (Strictly required when pricingType === BATCH)
  @ValidateIf((o: PackageHotelDto) => o.pricingType === PricingType.BATCH)
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  priceBatchTotal?: number;

  @ValidateIf((o: PackageHotelDto) => o.pricingType === PricingType.BATCH)
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  batchAdultsCount?: number;

  @ValidateIf((o: PackageHotelDto) => o.pricingType === PricingType.BATCH)
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  batchChildrenCount?: number;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
