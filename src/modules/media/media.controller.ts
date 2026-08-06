import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '@/modules/auth/guards/roles.guard';
import { StaffRole } from '@/modules/auth/enums/staff-role.enum';
import { TenantContextInterceptor } from '@/common/tenant/tenant-context.interceptor';
import { StorageService } from './storage.service';
import type { Express } from 'express';

const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  // Videos
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'video/3gpp',
];

const multerFileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
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
};

@ApiTags('Admin Panel — Media Storage')
@ApiBearerAuth()
@Controller('admin/media')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(TenantContextInterceptor)
export class MediaController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @Roles(StaffRole.OWNER, StaffRole.MANAGER)
  @ApiOperation({
    summary: 'Upload a single agency media file (image or video, max 100 MB)',
    description:
      'Uploads an image or video file to agency-isolated local disk storage and returns a public URL.',
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
      limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB limit
      fileFilter: multerFileFilter,
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required.');
    }
    return this.storageService.saveFile(file);
  }

  @Post('upload-batch')
  @Roles(StaffRole.OWNER, StaffRole.MANAGER)
  @ApiOperation({
    summary: 'Upload multiple agency media files (max 10 files, 100 MB each)',
    description:
      'Uploads multiple image/video files to agency-isolated local disk storage and returns public URLs.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description:
      'Batch files uploaded successfully. Returns list of URLs and metadata.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request — Missing files or invalid MIME type.',
  })
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB limit
      fileFilter: multerFileFilter,
    }),
  )
  async uploadBatchFiles(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Files are required.');
    }
    return this.storageService.saveFiles(files);
  }

  @Get()
  @ApiOperation({
    summary: 'List all uploaded media files for current agency',
    description:
      'Retrieves all uploaded media file metadata and public URLs stored for current agency.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of uploaded media files retrieved successfully.',
  })
  listFiles() {
    return this.storageService.listFiles();
  }

  @Get(':filename')
  @ApiOperation({
    summary: 'Get media file metadata by filename',
    description:
      'Retrieves metadata (URL, size, mimeType, createdAt) for a specific uploaded media file.',
  })
  @ApiResponse({
    status: 200,
    description: 'Media file metadata retrieved successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found — Media file does not exist.',
  })
  getFileInfo(@Param('filename') filename: string) {
    return this.storageService.getFileInfo(filename);
  }

  @Delete(':filename')
  @HttpCode(HttpStatus.OK)
  @Roles(StaffRole.OWNER, StaffRole.MANAGER)
  @ApiOperation({
    summary: 'Delete an uploaded media file (OWNER / MANAGER)',
    description:
      'Deletes an uploaded image file from current agency isolated disk storage.',
  })
  @ApiResponse({
    status: 200,
    description: 'Media file deleted successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found — Media file does not exist.',
  })
  deleteFile(@Param('filename') filename: string) {
    return this.storageService.deleteFile(filename);
  }
}
