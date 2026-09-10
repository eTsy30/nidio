import { JwtService } from '@nestjs/jwt';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

import { AuthService } from '../src/auth/auth.service';
import { PasswordService } from '../src/auth/services/password.service';
import { SessionService } from '../src/auth/services/session.service';
import { TokenService } from '../src/auth/services/token.service';
import { PrismaService } from '../src/prisma/prisma.service';

async function main() {
  const databaseUrl = process.env.AUTH_REFRESH_TEST_DATABASE_URL;
  assert(
    databaseUrl && new URL(databaseUrl).pathname === '/auth_refresh_test',
    'Set AUTH_REFRESH_TEST_DATABASE_URL to an isolated auth_refresh_test database',
  );

  process.env.DATABASE_URL = databaseUrl;
  const prisma = new PrismaService();
  await prisma.$connect();

  const suffix = randomUUID();
  const user = await prisma.user.create({
    data: {
      email: `${suffix}@example.test`,
      firstName: 'Auth',
      passwordHash: 'test',
    },
  });
  const password = new PasswordService();
  const token = new TokenService(new JwtService({ secret: 'test-secret' }));
  const sessions = new SessionService(prisma);
  const auth = new AuthService(prisma, password, token, sessions, {} as never);

  try {
    const initial = await auth.createSession(user.id);
    const access = token.verifyAccessToken(initial.accessToken);
    const refresh = token.verifyRefreshToken(initial.refreshToken);
    assert.equal(access.type, 'access');
    assert.equal(refresh.type, 'refresh');
    assert.ok(refresh.jti);

    const results = await Promise.allSettled([
      auth.refresh(initial.refreshToken),
      auth.refresh(initial.refreshToken),
    ]);
    const fulfilled = results.filter(
      (
        result,
      ): result is PromiseFulfilledResult<
        Awaited<ReturnType<typeof auth.refresh>>
      > => result.status === 'fulfilled',
    );
    assert.equal(fulfilled.length, 1, 'only one refresh may consume a token');
    assert.equal(
      results.filter((result) => result.status === 'rejected').length,
      1,
    );

    const next = fulfilled[0]!.value;
    const nextPayload = token.verifyRefreshToken(next.refreshToken);
    assert.notEqual(nextPayload.jti, refresh.jti);
    const active = await prisma.refreshToken.findMany({
      where: { userId: user.id },
    });
    assert.equal(active.length, 1);
    assert.equal(active[0]!.jti, nextPayload.jti);

    await assert.rejects(auth.refresh(initial.accessToken));
    process.stdout.write('Auth refresh integration: PASS\n');
  } finally {
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
  }
}

void main();
