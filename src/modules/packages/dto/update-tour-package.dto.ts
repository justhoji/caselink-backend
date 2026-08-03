import { PartialType } from '@nestjs/mapped-types';
import { CreateTourPackageDto } from '@/modules/packages/dto/create-tour-package.dto';

export class UpdateTourPackageDto extends PartialType(CreateTourPackageDto) {}
