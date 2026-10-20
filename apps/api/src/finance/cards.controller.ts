import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { Authorized as CurrentUser } from '../auth/decorators/authorized.decorator';
import { JwtGuards } from '../auth/guards/auth.guard';

import { CardDto, FavoriteDto } from './dto/finance.dto';
import { CardsService } from './cards.service';
@Controller('finance/cards')
@UseGuards(JwtGuards)
export class CardsController {
  constructor(private readonly service: CardsService) {}
  @Post() create(@CurrentUser('id') user: string, @Body() dto: CardDto) {
    return this.service.save(user, dto);
  }
  @Patch(':id') update(
    @CurrentUser('id') user: string,
    @Param('id') id: string,
    @Body() dto: CardDto,
  ) {
    return this.service.save(user, dto, id);
  }
  @Delete(':id') remove(
    @CurrentUser('id') user: string,
    @Param('id') id: string,
  ) {
    return this.service.remove(user, id);
  }
  @Post(':id/used') used(
    @CurrentUser('id') user: string,
    @Param('id') id: string,
  ) {
    return this.service.used(user, id);
  }
  @Post(':id/favorite') favorite(
    @CurrentUser('id') user: string,
    @Param('id') id: string,
    @Body() dto: FavoriteDto,
  ) {
    return this.service.favorite(user, id, dto.isFavorite);
  }
}
