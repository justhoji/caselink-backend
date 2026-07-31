import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterCompleteDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsString()
  @IsNotEmpty()
  agencyName!: string;

  @IsString()
  @IsNotEmpty()
  slug!: string; // Page address, e.g. "mytours" -> "mytours.caselink.uz"
}
