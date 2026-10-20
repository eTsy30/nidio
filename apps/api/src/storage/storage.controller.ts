import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { memoryStorage } from 'multer';

import { Authorization } from '../auth/decorators/Authorization.decorator';
import { Authorized } from '../auth/decorators/authorized.decorator';

import { detectImageMime } from './image-mime';
import { StorageService } from './storage.service';

const ALLOWED_IMAGE_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
} as const;

const DEFAULT_MAX_IMAGE_SIZE_MB = 5;

function maxImageSizeBytes(): number {
  const configured = Number(process.env.UPLOAD_MAX_IMAGE_SIZE_MB);

  const megabytes =
    Number.isFinite(configured) && configured > 0
      ? configured
      : DEFAULT_MAX_IMAGE_SIZE_MB;

  return Math.floor(megabytes * 1024 * 1024);
}

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Authorization()
  @Post('images')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: maxImageSizeBytes(),
      },
      fileFilter: (_request, file, callback) => {
        callback(null, file.mimetype in ALLOWED_IMAGE_TYPES);
      },
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Authorized('id') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Файл не передан');
    }

    const mimeType = detectImageMime(file.buffer);

    if (!mimeType || mimeType !== file.mimetype) {
      throw new BadRequestException(
        'Поддерживаются только изображения JPG, PNG и WebP',
      );
    }

    const extension = ALLOWED_IMAGE_TYPES[mimeType];

    const key = this.storageService.generateKey(
      `users/${userId}/images`,
      extension,
    );

    return this.storageService.upload(file.buffer, key, mimeType);
  }

  @Authorization()
  @Get('images/*path')
  async getImage(
    @Param() params: Record<string, string | string[]>,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const rawKey = params.path;

    const key = Array.isArray(rawKey) ? rawKey.join('/') : rawKey;

    if (!key || key.startsWith('finance/')) {
      throw new BadRequestException('Некорректный URL файла');
    }

    const object = await this.storageService.getObject(key);

    if (!object.Body) {
      throw new BadRequestException('Файл не найден');
    }

    const body = await object.Body.transformToByteArray();

    if (object.ContentType) {
      response.setHeader('Content-Type', object.ContentType);
    }

    response.setHeader('Cache-Control', 'private, max-age=3600');

    return new StreamableFile(Buffer.from(body), {
      type: object.ContentType ?? 'application/octet-stream',
      length: body.length,
    });
  }
}
