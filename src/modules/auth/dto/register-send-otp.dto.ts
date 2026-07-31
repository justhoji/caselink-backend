import { IsNotEmpty, IsString } from 'class-validator';

export class RegisterSendOtpDto {
  @IsString()
  @IsNotEmpty()
  identifier!: string; // email or phone
}
