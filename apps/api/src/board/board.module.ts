import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { RelationshipModule } from '../relationship/relationship.module';

import { BoardController } from './board.controller';
import { BoardService } from './board.service';

@Module({
  imports: [PrismaModule, RelationshipModule],
  controllers: [BoardController],
  providers: [BoardService],
  exports: [BoardService],
})
export class BoardModule {}
