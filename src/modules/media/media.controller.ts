import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { TenantContextInterceptor } from '@/common/tenant/tenant-context.interceptor';
import { StorageService } from './storage.service';
import type { Express } from 'express';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

@ApiTags('Admin Panel — Media Storage')
@ApiBearerAuth()
@Controller('admin/media')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantContextInterceptor)
export class MediaController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @ApiOperation({
    summary: 'Upload an agency image file (max 10 MB)',
    description:
      'Uploads an image file to agency-isolated local disk storage and returns a public URL.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully. Returns public URL and metadata.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request — Missing file or invalid MIME type.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized — Missing or invalid bearer token.',
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              `File type '${file.mimetype}' is not allowed. ` +
                `Accepted types: ${ALLOWED_MIME_TYPES.join(', ')}.`,
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required.');
    }
    return this.storageService.saveFile(file);
  }
}
