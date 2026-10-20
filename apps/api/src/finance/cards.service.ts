import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { StorageService } from '../storage/storage.service';

import { CardDto } from './dto/finance.dto';
import { FinanceAccess } from './finance-access.service';
import { validEan13 } from './finance-rules';
@Injectable()
export class CardsService {
  constructor(
    private readonly access: FinanceAccess,
    private readonly storage: StorageService,
  ) {}
  save(userId: string, dto: CardDto, id?: string) {
    if (dto.barcodeFormat === 'EAN13' && !validEan13(dto.cardNumber))
      throw new BadRequestException(
        'EAN-13: нужны 13 цифр с корректной контрольной суммой',
      );
    return this.access.write(userId, async (db, coupleId) => {
      if (!id) return db.loyaltyCard.create({ data: { ...dto, coupleId } });
      if (!(await db.loyaltyCard.findFirst({ where: { id, coupleId } })))
        throw new NotFoundException('Карта не найдена');
      return db.loyaltyCard.update({ where: { id }, data: dto });
    });
  }
  used(userId: string, id: string) {
    return this.access.write(userId, async (db, coupleId) => {
      const result = await db.loyaltyCard.updateMany({
        where: { id, coupleId },
        data: { lastUsedAt: new Date() },
      });
      if (!result.count) throw new NotFoundException('Карта не найдена');
      return { success: true };
    });
  }
  favorite(userId: string, id: string, isFavorite: boolean) {
    return this.access.write(userId, async (db, coupleId) => {
      const result = await db.loyaltyCard.updateMany({
        where: { id, coupleId },
        data: { isFavorite },
      });
      if (!result.count) throw new NotFoundException('Карта не найдена');
      return { success: true };
    });
  }
  async remove(userId: string, id: string) {
    const key = await this.access.write(userId, async (db, coupleId) => {
      const card = await db.loyaltyCard.findFirst({ where: { id, coupleId } });
      if (!card) throw new NotFoundException('Карта не найдена');
      await db.loyaltyCard.delete({ where: { id } });
      return card.imageKey;
    });
    if (key) await this.storage.delete(key).catch(() => undefined);
    return { success: true };
  }
}
