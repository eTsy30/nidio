import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';

import { AuthModule } from './auth/auth.module';
import { BoardModule } from './board/board.module';
import { CalendarModule } from './calendar/calendar.module';
import { EmailModule } from './email/email.module';
import { FinanceModule } from './finance/finance.module';
import { HealthController } from './health/health.controller';
import { ReadinessController } from './health/readiness.controller';
import { PrismaModule } from './prisma/prisma.module';
import { RealtimeModule } from './realtime/realtime.module';
import { RelationshipModule } from './relationship/relationship.module';
import { StorageModule } from './storage/storage.module';
import { TasksModule } from './tasks/tasks.module';
import { TemplatesModule } from './templates/templates.module';
import { UsersModule } from './users/users.module';

@Module({
  controllers: [HealthController, ReadinessController],
  imports: [
    ConfigModule.forRoot({
      envFilePath:
        process.env.NODE_ENV === 'production'
          ? '.env.production'
          : '.env.development',
      isGlobal: true,
    }),
    PrismaModule,
    RelationshipModule,
    AuthModule,
    EmailModule,
    RealtimeModule,
    TasksModule,
    BoardModule,
    TemplatesModule,
    UsersModule,
    StorageModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: process.env.NODE_ENV !== 'production',
      context: ({ req, res }: { req: Request; res: Response }) => ({
        req,
        res,
      }),
    }),
    CalendarModule,
    FinanceModule,
  ],
})
export class AppModule {}
