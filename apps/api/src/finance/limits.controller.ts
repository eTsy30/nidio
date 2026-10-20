import {
  Body,
  Controller,
  Delete,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';

import { Authorized as CurrentUser } from '../auth/decorators/authorized.decorator';
import { JwtGuards } from '../auth/guards/auth.guard';

import { BudgetDto } from './dto/finance.dto';
import { BudgetService } from './budget.service';
@Controller('finance/limits')
@UseGuards(JwtGuards)
export class LimitsController {
  constructor(private readonly service: BudgetService) {}
  @Put() save(@CurrentUser('id') user: string, @Body() dto: BudgetDto) {
    return this.service.limit(user, dto);
  }
  @Delete(':id') remove(
    @CurrentUser('id') user: string,
    @Param('id') id: string,
  ) {
    return this.service.removeLimit(user, id);
  }
}
