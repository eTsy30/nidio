import {
  Controller,
  Get,
  Header,
  ServiceUnavailableException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class ReadinessController {
  private pending: Promise<void> | undefined;
  constructor(private readonly prisma: PrismaService) {}

  @Get('ready')
  @Header('Cache-Control', 'no-store')
  async ready() {
    // Coalesce concurrent probes. A timed-out connection must not create an
    // unbounded queue of additional database checks.
    if (!this.pending) {
      const probe = this.prisma.$transaction(
        async (db) => {
          await db.$executeRaw`SET LOCAL statement_timeout = '1000ms'`;
          await db.$queryRaw`SELECT 1`;
          // Also detect the schema mismatch that previously broke /users/me.
          await db.$queryRaw`SELECT "savingsColor" FROM "CoupleMember" LIMIT 0`;
        },
        { maxWait: 1000, timeout: 1500 },
      );
      this.pending = probe;
      void probe
        .finally(() => {
          if (this.pending === probe) this.pending = undefined;
        })
        .catch(() => undefined);
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        this.pending,
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error('Readiness timeout')),
            2000,
          );
        }),
      ]);
      return { status: 'ok', database: 'ok' };
    } catch {
      throw new ServiceUnavailableException({
        status: 'unavailable',
        database: 'unavailable',
      });
    } finally {
      clearTimeout(timer);
    }
  }
}
