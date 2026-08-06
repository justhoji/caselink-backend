import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@/modules/auth/entities/user.entity';
import { UserInvite } from '@/modules/auth/entities/user-invite.entity';
import { Agency } from '@/modules/agencies/entities/agency.entity';
import { EmailModule } from '@/modules/email/email.module';
import { UsersService } from '@/modules/users/users.service';
import { UsersController } from '@/modules/users/users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserInvite, Agency]), EmailModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
