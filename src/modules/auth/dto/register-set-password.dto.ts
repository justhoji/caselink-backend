import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterSetPasswordDto {
  @IsString()
  @IsNotEmpty()
  identifier!: string; // email or phone

  @IsString()
  @MinLength(6)
  password!: string;
}
