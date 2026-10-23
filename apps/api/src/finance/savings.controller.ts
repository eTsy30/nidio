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

import { GoalDto, SavingsEntryDto, SavingsPlanDto } from './dto/finance.dto';
import { SavingsService } from './savings.service';
@Controller('finance/goals')
@UseGuards(JwtGuards)
export class SavingsController {
  constructor(private readonly service: SavingsService) {}
  @Post() create(@CurrentUser('id') user: string, @Body() dto: GoalDto) {
    return this.service.save(user, dto);
  }
  @Patch(':id') update(
    @CurrentUser('id') user: string,
    @Param('id') id: string,
    @Body() dto: GoalDto,
  ) {
    return this.service.save(user, dto, id);
  }
  @Delete(':id') remove(
    @CurrentUser('id') user: string,
    @Param('id') id: string,
  ) {
    return this.service.remove(user, id);
  }
  @Post(':id/entries') entry(
    @CurrentUser('id') user: string,
    @Param('id') id: string,
    @Body() dto: SavingsEntryDto,
  ) {
    return this.service.entry(user, id, dto);
  }
  @Post(':id/plan') plan(
    @CurrentUser('id') user: string,
    @Param('id') id: string,
    @Body() dto: SavingsPlanDto,
  ) {
    return this.service.plan(user, id, dto);
  }
  @Post(':id/entries/:entryId/cancel') cancel(
    @CurrentUser('id') user: string,
    @Param('id') id: string,
    @Param('entryId') entryId: string,
  ) {
    return this.service.cancel(user, id, entryId);
  }
}
