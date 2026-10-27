import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { StorageModule } from '../storage/storage.module';

import { BudgetController } from './budget.controller';
import { BudgetService } from './budget.service';
import { CardImageController } from './card-image.controller';
import { CardsController } from './cards.controller';
import { CardsService } from './cards.service';
import { FinanceController } from './finance.controller';
import { FinanceAccess } from './finance-access.service';
import { FinanceReadController } from './finance-read.controller';
import { FinanceReadService } from './finance-read.service';
import { LimitsController } from './limits.controller';
import { SavingsController } from './savings.controller';
import { SavingsService } from './savings.service';
@Module({
  imports: [PrismaModule, RealtimeModule, StorageModule],
  controllers: [
    CardImageController,
    FinanceController,
    FinanceReadController,
    SavingsController,
    CardsController,
    BudgetController,
    LimitsController,
  ],
  providers: [
    FinanceReadService,
    FinanceAccess,
    SavingsService,
    CardsService,
    BudgetService,
  ],
})
export class FinanceModule {}
