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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PackagesService } from '@/modules/packages/packages.service';
import { CreateTourPackageDto } from '@/modules/packages/dto/create-tour-package.dto';
import { UpdateTourPackageDto } from '@/modules/packages/dto/update-tour-package.dto';
import { QueryTourPackagesDto } from '@/modules/packages/dto/query-tour-packages.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '@/modules/auth/guards/roles.guard';
import { StaffRole } from '@/modules/auth/enums/staff-role.enum';
import { TenantContextInterceptor } from '@/common/tenant/tenant-context.interceptor';

@ApiTags('Admin Panel — Tour Packages')
@ApiBearerAuth()
@Controller('admin/packages')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(TenantContextInterceptor)
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Post()
  @Roles(StaffRole.OWNER, StaffRole.MANAGER)
  @ApiOperation({
    summary: 'Create a new tour package (OWNER / MANAGER)',
    description:
      'Creates a new tour package aggregate tree (parent package + child hotels with pricing models, flights, media, extras) inside a single atomic database transaction.',
  })
  @ApiResponse({
    status: 201,
    description:
      'Tour package created successfully. Returns full aggregate tree.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request — Missing dates or incomplete hotel pricing model.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized — Missing or invalid bearer token.',
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden — Insufficient role permissions (Coordinator role cannot create).',
  })
  createPackage(@Body() dto: CreateTourPackageDto) {
    return this.packagesService.createPackage(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List tour packages for current agency',
    description:
      'Retrieves tenant-isolated tour packages with optional search (title, hotel, airport), pricing filters, and pagination.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated tour package list retrieved successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized — Missing or invalid bearer token.',
  })
  findAllPackages(@Query() query: QueryTourPackagesDto) {
    return this.packagesService.findAllPackages(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get tour package aggregate by ID',
    description:
      'Retrieves full details of a specific tour package aggregate including child relations.',
  })
  @ApiResponse({ status: 200, description: 'Tour package details retrieved.' })
  @ApiResponse({
    status: 404,
    description: 'Not Found — Tour package does not exist for this agency.',
  })
  findPackageById(@Param('id') id: string) {
    return this.packagesService.findPackageById(id);
  }

  @Patch(':id')
  @Roles(StaffRole.OWNER, StaffRole.MANAGER)
  @ApiOperation({
    summary: 'Update a tour package aggregate (OWNER / MANAGER)',
    description:
      'Atomic update of package fields and child collections (hotels, flights, media, extras). Auto-updates slug if title changes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tour package updated successfully.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request — Validation error.' })
  @ApiResponse({
    status: 404,
    description: 'Not Found — Tour package not found.',
  })
  updatePackage(@Param('id') id: string, @Body() dto: UpdateTourPackageDto) {
    return this.packagesService.updatePackage(id, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Delete(':id')
  @Roles(StaffRole.OWNER, StaffRole.MANAGER)
  @ApiOperation({
    summary: 'Soft-delete a tour package (OWNER / MANAGER)',
    description:
      'Sets soft deletion timestamp (deleted_at). Data is preserved safely in PostgreSQL.',
  })
  @ApiResponse({
    status: 200,
    description: 'Package soft-deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'Not Found — Package not found.' })
  softDeletePackage(@Param('id') id: string) {
    return this.packagesService.softDeletePackage(id);
  }

  @HttpCode(HttpStatus.OK)
  @Patch(':id/publish')
  @Roles(StaffRole.OWNER, StaffRole.MANAGER)
  @ApiOperation({
    summary: 'Toggle publish status of a package (OWNER / MANAGER)',
    description: 'Publishes or unpublishes package for the public catalog.',
  })
  @ApiResponse({ status: 200, description: 'Publish status updated.' })
  togglePublishStatus(
    @Param('id') id: string,
    @Body('isPublished') isPublished: boolean,
  ) {
    return this.packagesService.togglePublishStatus(id, isPublished ?? true);
  }
}
