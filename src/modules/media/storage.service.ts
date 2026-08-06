import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { TenantContextService } from '@/common/tenant/tenant-context.service';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

export interface StoredFileResult {
  url: string;
  filename: string;
  originalName?: string;
  mimeType: string;
  size: number;
  createdAt?: string;
}

const MIME_TYPE_MAP: Record<string, string> = {
  // Images
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  // Videos
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.mkv': 'video/x-matroska',
  '.3gp': 'video/3gpp',
};

@Injectable()
export class StorageService {
  constructor(private readonly tenantContextService: TenantContextService) {}

  private getAgencyUploadDir(): string {
    const agencyId = this.tenantContextService.getRequiredAgencyId();
    const uploadDir = path.join(process.cwd(), 'uploads', 'agencies', agencyId);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    return uploadDir;
  }

  private buildPublicUrl(filename: string): string {
    const agencyId = this.tenantContextService.getRequiredAgencyId();
    return `/uploads/agencies/${agencyId}/${filename}`;
  }

  /**
   * Saves an uploaded file to ./uploads/agencies/{agencyId}/ and returns its public URL
   */
  async saveFile(file: Express.Multer.File): Promise<StoredFileResult> {
    if (!file) {
      throw new BadRequestException('No file provided for upload.');
    }

    const uploadDir = this.getAgencyUploadDir();
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueFilename = `${randomUUID()}${ext}`;
    const filePath = path.join(uploadDir, uniqueFilename);

    await fs.promises.writeFile(filePath, file.buffer);

    return {
      url: this.buildPublicUrl(uniqueFilename),
      filename: uniqueFilename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Saves multiple uploaded files
   */
  async saveFiles(files: Express.Multer.File[]): Promise<StoredFileResult[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided for batch upload.');
    }
    return Promise.all(files.map((file) => this.saveFile(file)));
  }

  /**
   * Lists all uploaded media files for current agency
   */
  async listFiles(): Promise<StoredFileResult[]> {
    const uploadDir = this.getAgencyUploadDir();
    const files = await fs.promises.readdir(uploadDir);

    const mediaList: StoredFileResult[] = [];

    for (const filename of files) {
      const filePath = path.join(uploadDir, filename);
      const stat = await fs.promises.stat(filePath);

      if (stat.isFile()) {
        const ext = path.extname(filename).toLowerCase();
        const mimeType = MIME_TYPE_MAP[ext] || 'application/octet-stream';

        mediaList.push({
          url: this.buildPublicUrl(filename),
          filename,
          mimeType,
          size: stat.size,
          createdAt: stat.birthtime.toISOString(),
        });
      }
    }

    // Sort by newest first
    return mediaList.sort(
      (a, b) =>
        new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime(),
    );
  }

  /**
   * Retrieves metadata for a specific media file by filename
   */
  async getFileInfo(filename: string): Promise<StoredFileResult> {
    const safeFilename = path.basename(filename);
    const uploadDir = this.getAgencyUploadDir();
    const filePath = path.join(uploadDir, safeFilename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`Media file '${safeFilename}' not found.`);
    }

    const stat = await fs.promises.stat(filePath);
    const ext = path.extname(safeFilename).toLowerCase();
    const mimeType = MIME_TYPE_MAP[ext] || 'application/octet-stream';

    return {
      url: this.buildPublicUrl(safeFilename),
      filename: safeFilename,
      mimeType,
      size: stat.size,
      createdAt: stat.birthtime.toISOString(),
    };
  }

  /**
   * Deletes an uploaded media file by filename
   */
  async deleteFile(
    filename: string,
  ): Promise<{ message: string; filename: string }> {
    const safeFilename = path.basename(filename);
    const uploadDir = this.getAgencyUploadDir();
    const filePath = path.join(uploadDir, safeFilename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`Media file '${safeFilename}' not found.`);
    }

    await fs.promises.unlink(filePath);

    return {
      message: `Media file '${safeFilename}' deleted successfully.`,
      filename: safeFilename,
    };
  }
}
