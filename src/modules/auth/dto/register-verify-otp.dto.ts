import { IsNotEmpty, IsString, Length } from 'class-validator';

export class RegisterVerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  identifier!: string; // email or phone

  @IsString()
  @Length(6, 6)
  code!: string;
}
