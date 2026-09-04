import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { RelationshipModule } from '../relationship/relationship.module';

import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';

@Module({
  imports: [PrismaModule, RelationshipModule],
  controllers: [TemplatesController],
  providers: [TemplatesService],
  exports: [TemplatesService],
})
export class TemplatesModule {}
