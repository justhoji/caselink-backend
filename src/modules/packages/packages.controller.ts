import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PackagesService } from '@/modules/packages/packages.service';
import { CreateTourPackageDto } from '@/modules/packages/dto/create-tour-package.dto';
import { UpdateTourPackageDto } from '@/modules/packages/dto/update-tour-package.dto';
import { QueryTourPackagesDto } from '@/modules/packages/dto/query-tour-packages.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '@/modules/auth/guards/roles.guard';
import { StaffRole } from '@/modules/auth/enums/staff-role.enum';
import { TenantContextInterceptor } from '@/common/tenant/tenant-context.interceptor';

@ApiTags('Packages')
@ApiBearerAuth()
@Controller('admin/packages')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(TenantContextInterceptor)
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Post()
  @Roles(StaffRole.OWNER, StaffRole.MANAGER)
  @ApiOperation({ summary: 'Create a new tour package (OWNER / MANAGER)' })
  createPackage(@Body() dto: CreateTourPackageDto) {
    return this.packagesService.createPackage(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all tour packages for the current agency' })
  findAllPackages(@Query() query: QueryTourPackagesDto) {
    return this.packagesService.findAllPackages(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single tour package by ID' })
  findPackageById(@Param('id') id: string) {
    return this.packagesService.findPackageById(id);
  }

  @Patch(':id')
  @Roles(StaffRole.OWNER, StaffRole.MANAGER)
  @ApiOperation({ summary: 'Update a tour package (OWNER / MANAGER)' })
  updatePackage(@Param('id') id: string, @Body() dto: UpdateTourPackageDto) {
    return this.packagesService.updatePackage(id, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  @Roles(StaffRole.OWNER, StaffRole.MANAGER)
  @ApiOperation({ summary: 'Soft-delete a tour package (OWNER / MANAGER)' })
  softDeletePackage(@Param('id') id: string) {
    return this.packagesService.softDeletePackage(id);
  }

  @HttpCode(HttpStatus.OK)
  @Patch(':id/publish')
  @Roles(StaffRole.OWNER, StaffRole.MANAGER)
  @ApiOperation({
    summary: 'Toggle publish status of a package (OWNER / MANAGER)',
  })
  togglePublishStatus(
    @Param('id') id: string,
    @Body('isPublished') isPublished: boolean,
  ) {
    return this.packagesService.togglePublishStatus(id, isPublished ?? true);
  }
}
