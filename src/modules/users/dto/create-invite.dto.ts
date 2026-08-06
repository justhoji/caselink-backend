import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StaffRole } from '@/modules/auth/enums/staff-role.enum';

export class CreateInviteDto {
  @ApiProperty({
    example: 'manager@agency.uz',
    description: 'Email address of the person to invite to the agency team',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    enum: StaffRole,
    example: StaffRole.MANAGER,
    description:
      'Role assigned to the invited team member (MANAGER or COORDINATOR)',
  })
  @IsEnum(StaffRole)
  @IsNotEmpty()
  role!: StaffRole;
}
