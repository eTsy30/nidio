import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Header,
  NotFoundException,
  Param,
  Post,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { Authorized } from '../auth/decorators/authorized.decorator';
import { JwtGuards } from '../auth/guards/auth.guard';
import { detectImageMime } from '../storage/image-mime';
import { StorageService } from '../storage/storage.service';

import { FinanceAccess } from './finance-access.service';
@Controller('finance/cards/:id/image')
@UseGuards(JwtGuards)
export class CardImageController {
  constructor(
    private readonly access: FinanceAccess,
    private readonly storage: StorageService,
  ) {}
  @Get()
  @Header('Cache-Control', 'private, no-store')
  async get(@Authorized('id') user: string, @Param('id') id: string) {
    const card = await this.access.read(user, (db, coupleId) =>
      db.loyaltyCard.findFirst({ where: { id, coupleId } }),
    );
    if (!card?.imageKey) throw new NotFoundException('Изображение не найдено');
    const object = await this.storage.getObject(card.imageKey);
    if (!object.Body) throw new NotFoundException('Изображение не найдено');
    return new StreamableFile(
      Buffer.from(await object.Body.transformToByteArray()),
      { type: object.ContentType ?? 'application/octet-stream' },
    );
  }
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async upload(
    @Authorized('id') user: string,
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const mime = file && detectImageMime(file.buffer);
    if (!file || !mime || mime !== file.mimetype)
      throw new BadRequestException('Выберите JPG, PNG или WebP до 5 МБ');
    const card = await this.access.read(user, (db, coupleId) =>
      db.loyaltyCard.findFirst({ where: { id, coupleId } }),
    );
    if (!card) throw new NotFoundException('Карта не найдена');
    const key = this.storage.generateKey(
      `finance/${card.coupleId}`,
      mime === 'image/jpeg' ? '.jpg' : mime === 'image/png' ? '.png' : '.webp',
    );
    await this.storage.upload(file.buffer, key, mime);
    try {
      const previous = await this.access.write(user, async (db, coupleId) => {
        const current = await db.loyaltyCard.findFirst({
          where: { id, coupleId },
        });
        if (!current) throw new NotFoundException('Карта не найдена');
        await db.loyaltyCard.update({ where: { id }, data: { imageKey: key } });
        return current.imageKey;
      });
      if (previous) await this.storage.delete(previous).catch(() => undefined);
      return { success: true };
    } catch (error) {
      await this.storage.delete(key).catch(() => undefined);
      throw error;
    }
  }
  @Delete()
  async remove(@Authorized('id') user: string, @Param('id') id: string) {
    const key = await this.access.write(user, async (db, coupleId) => {
      const card = await db.loyaltyCard.findFirst({ where: { id, coupleId } });
      if (!card) throw new NotFoundException('Карта не найдена');
      await db.loyaltyCard.update({ where: { id }, data: { imageKey: null } });
      return card.imageKey;
    });
    if (key) await this.storage.delete(key).catch(() => undefined);
    return { success: true };
  }
}
