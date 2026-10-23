import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { StorageService } from '../storage/storage.service';

import { CardDto } from './dto/finance.dto';
import { cardNumber, validCardCode } from './card-rules';
import { FinanceAccess } from './finance-access.service';
@Injectable()
export class CardsService {
  constructor(
    private readonly access: FinanceAccess,
    private readonly storage: StorageService,
  ) {}
  save(userId: string, dto: CardDto, id?: string) {
    const data = {
      ...dto,
      storeName: dto.storeName.trim().replace(/\s+/g, ' '),
      cardNumber: cardNumber(dto.cardNumber, dto.barcodeFormat),
    };
    if (!data.storeName || !validCardCode(data.cardNumber, data.barcodeFormat))
      throw new BadRequestException(
        'Проверьте название, номер и формат кода карты',
      );
    return this.access.write(userId, async (db, coupleId) => {
      if (id && !(await db.loyaltyCard.findFirst({ where: { id, coupleId } })))
        throw new NotFoundException('Карта не найдена');
      const duplicate = await db.loyaltyCard.findFirst({
        where: {
          coupleId,
          cardNumber: data.cardNumber,
          barcodeFormat: data.barcodeFormat,
          storeName: { equals: data.storeName, mode: 'insensitive' },
          ...(id ? { id: { not: id } } : {}),
        },
      });
      if (duplicate)
        throw new ConflictException(
          'Такая карта магазина уже есть в вашей коллекции',
        );
      return id
        ? db.loyaltyCard.update({ where: { id }, data })
        : db.loyaltyCard.create({ data: { ...data, coupleId } });
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
