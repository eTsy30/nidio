import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { Authorization } from '../auth/decorators/Authorization.decorator';
import { Authorized } from '../auth/decorators/authorized.decorator';

import { StorageService } from './storage.service';

const ALLOWED_IMAGE_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
} as const;

const DEFAULT_MAX_IMAGE_SIZE_MB = 5;

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Authorization()
  @Post('images')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Authorized('id') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Файл не передан');
    }

    const extension =
      ALLOWED_IMAGE_TYPES[file.mimetype as keyof typeof ALLOWED_IMAGE_TYPES];

    if (!extension) {
      throw new BadRequestException(
        'Поддерживаются только изображения JPG, PNG и WebP',
      );
    }

    const maxSizeMb = Number(
      process.env.UPLOAD_MAX_IMAGE_SIZE_MB ?? DEFAULT_MAX_IMAGE_SIZE_MB,
    );

    const maxSizeBytes = maxSizeMb * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      throw new BadRequestException(
        `Размер изображения не должен превышать ${maxSizeMb} МБ`,
      );
    }

    const key = this.storageService.generateKey(
      `users/${userId}/images`,
      extension,
    );

    return this.storageService.upload(file.buffer, key, file.mimetype);
  }
}
