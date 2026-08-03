import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TenantContextService } from '@/common/tenant/tenant-context.service';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

export interface StoredFileResult {
  url: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
}

@Injectable()
export class StorageService {
  constructor(
    private readonly configService: ConfigService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  /**
   * Saves an uploaded file to ./uploads/agencies/{agencyId}/ and returns its public URL
   */
  async saveFile(file: Express.Multer.File): Promise<StoredFileResult> {
    if (!file) {
      throw new BadRequestException('No file provided for upload.');
    }

    const agencyId = this.tenantContextService.getRequiredAgencyId();
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueFilename = `${randomUUID()}${ext}`;

    // Target upload directory: ./uploads/agencies/{agencyId}/
    const uploadDir = path.join(process.cwd(), 'uploads', 'agencies', agencyId);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, uniqueFilename);
    await fs.promises.writeFile(filePath, file.buffer);

    const port = this.configService.get<number>('PORT', 3000);
    const host = this.configService.get<string>(
      'HOST',
      `http://localhost:${port}`,
    );
    const publicUrl = `${host}/uploads/agencies/${agencyId}/${uniqueFilename}`;

    return {
      url: publicUrl,
      filename: uniqueFilename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }
}
