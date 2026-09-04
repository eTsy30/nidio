import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { RelationshipModule } from '../relationship/relationship.module';

import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [PrismaModule, RelationshipModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
