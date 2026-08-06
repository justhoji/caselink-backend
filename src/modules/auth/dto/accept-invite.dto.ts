import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AcceptInviteDto {
  @ApiProperty({
    example: 'a1b2c3d4e5f678901234567890abcdefa1b2c3d4e5f678901234567890abcdef',
    description: 'Invitation token received via email link',
  })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ example: 'Aziz', description: 'First name of staff member' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: 'Rahimov', description: 'Last name of staff member' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty({
    example: 'SecureP@ssw0rd!',
    description: 'Account password (min 8 chars)',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  password!: string;
}
