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

import { FinancialEntryDto } from './dto/finance.dto';
import { BudgetService } from './budget.service';
@Controller('finance/transactions')
@UseGuards(JwtGuards)
export class BudgetController {
  constructor(private readonly service: BudgetService) {}
  @Post() create(
    @CurrentUser('id') user: string,
    @Body() dto: FinancialEntryDto,
  ) {
    return this.service.save(user, dto);
  }
  @Patch(':id') update(
    @CurrentUser('id') user: string,
    @Param('id') id: string,
    @Body() dto: FinancialEntryDto,
  ) {
    return this.service.save(user, dto, id);
  }
  @Delete(':id') remove(
    @CurrentUser('id') user: string,
    @Param('id') id: string,
  ) {
    return this.service.remove(user, id);
  }
}
