import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool } from 'pg';

import { BudgetService } from '../src/finance/budget.service';
import { CardsService } from '../src/finance/cards.service';
import { FinanceController } from '../src/finance/finance.controller';
import { FinanceAccess } from '../src/finance/finance-access.service';
import { SavingsService } from '../src/finance/savings.service';
import type { PrismaService } from '../src/prisma/prisma.service';
import type { RealtimeService } from '../src/realtime/realtime.service';
import type { StorageService } from '../src/storage/storage.service';

import 'reflect-metadata';

async function main() {
  const url = new URL(
    process.env.FINANCE_TEST_DATABASE_URL ??
      'postgresql://postgres:postgres@127.0.0.1:5432/postgres',
  );
  assert(
    ['localhost', '127.0.0.1', '::1'].includes(url.hostname),
    'Financial integration tests require local PostgreSQL',
  );
  const database = `nidio_finance_test_${randomUUID().replaceAll('-', '')}`;
  const admin = new Pool({ connectionString: url.toString() });
  await admin.query(`CREATE DATABASE "${database}"`);
  url.pathname = '/' + database;
  const pool = new Pool({ connectionString: url.toString() });
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: url.toString() }),
  });
  try {
    const migrations = resolve('prisma/migrations');
    for (const folder of readdirSync(migrations)
      .filter((n) => /^\d/.test(n))
      .sort()) {
      await pool.query(
        readFileSync(resolve(migrations, folder, 'migration.sql'), 'utf8'),
      );
    }
    const users = await Promise.all(
      ['Alex', 'Sam', 'Other', 'Alone'].map((firstName, i) =>
        prisma.user.create({
          data: {
            firstName,
            email: `${i}@finance.test`,
            passwordHash: 'not-a-real-password',
          },
        }),
      ),
    );
    const [alex, sam, other, alone] = users;
    assert(alex && sam && other && alone);
    const pair = await prisma.couple.create({
      data: { members: { create: [{ userId: alex.id }, { userId: sam.id }] } },
    });
    await prisma.couple.create({
      data: { members: { create: [{ userId: other.id }] } },
    });
    const notifications: string[] = [];
    const access = new FinanceAccess(
      prisma as PrismaService,
      {
        emitToUser: (id: string) => notifications.push(id),
      } as unknown as RealtimeService,
    );
    const savings = new SavingsService(access);
    const cards = new CardsService(access, {
      delete: async () => {},
    } as unknown as StorageService);
    const budget = new BudgetService(access);
    const controller = new FinanceController(access);
    const goalInput = {
      title: 'Отпуск',
      targetMinor: 10000,
      currency: 'EUR',
      description: '',
      icon: '🏖️',
      color: 'primary',
      targetDate: '2027-06-01',
    };
    const goal = await savings.save(alex.id, goalInput);
    const deposit = {
      requestId: randomUUID(),
      amountMinor: 10000,
      type: 'DEPOSIT',
      description: '',
    };
    await savings.entry(alex.id, goal.id, deposit);
    await savings.entry(alex.id, goal.id, deposit);
    assert.equal(
      (await controller.state(sam.id)).goals[0]?.currentMinor,
      10000,
      'retry must not double deposit',
    );
    await assert.rejects(async () => savings.entry(other.id, goal.id, deposit));
    await assert.rejects(async () => savings.remove(other.id, goal.id));
    await assert.rejects(async () =>
      savings.save(other.id, goalInput, goal.id),
    );
    await assert.rejects(async () => controller.state(alone.id));
    await assert.rejects(async () => controller.state(''));
    const outcomes = await Promise.allSettled(
      [alex.id, sam.id].map((user) =>
        savings.entry(user, goal.id, {
          ...deposit,
          requestId: randomUUID(),
          amountMinor: 7000,
          type: 'WITHDRAWAL',
        }),
      ),
    );
    assert.equal(
      outcomes.filter((result) => result.status === 'fulfilled').length,
      1,
      'only one competing withdrawal may succeed',
    );
    assert.equal((await controller.state(sam.id)).goals[0]?.currentMinor, 3000);
    await assert.rejects(async () =>
      savings.save(alex.id, { ...goalInput, currency: 'USD' }, goal.id),
    );
    const cardInput = {
      storeName: 'Наш магазин',
      cardNumber: '4006381333931',
      barcodeFormat: 'EAN13',
      category: 'groceries',
      comment: 'Скидка',
      color: 'success',
      isFavorite: false,
    };
    const card = await cards.save(alex.id, cardInput);
    await cards.save(sam.id, { ...cardInput, isFavorite: true }, card.id);
    await cards.used(sam.id, card.id);
    await assert.rejects(async () => cards.remove(other.id, card.id));
    await assert.rejects(async () => cards.save(other.id, cardInput, card.id));
    await assert.rejects(async () => cards.used(other.id, card.id));
    await assert.rejects(async () =>
      cards.save(alex.id, { ...cardInput, cardNumber: '4006381333932' }),
    );
    const income = {
      amountMinor: 10000,
      type: 'INCOME',
      currency: 'EUR',
      category: 'salary',
      date: '2026-10-01',
      description: '',
      requestId: randomUUID(),
    };
    const first = await budget.save(alex.id, income);
    await budget.save(alex.id, income);
    await assert.rejects(async () =>
      budget.save(alex.id, { ...income, amountMinor: 20000 }),
    );
    await budget.save(sam.id, {
      ...income,
      requestId: randomUUID(),
      type: 'EXPENSE',
      category: 'groceries',
      amountMinor: 1250,
    });
    await assert.rejects(async () => budget.save(other.id, income, first.id));
    await assert.rejects(async () => budget.remove(other.id, first.id));
    await assert.rejects(async () =>
      budget.save(alex.id, {
        ...income,
        requestId: randomUUID(),
        date: '2026-02-30',
      }),
    );
    await assert.rejects(async () =>
      budget.save(alex.id, {
        ...income,
        requestId: randomUUID(),
        category: 'housing',
      }),
    );
    const limit = await budget.limit(sam.id, {
      category: 'ALL',
      currency: 'EUR',
      month: '2026-10',
      amountMinor: 20000,
    });
    await budget.removeLimit(other.id, limit.id);
    // A fresh controller represents a reload: all data is read from PostgreSQL again.
    const state = await new FinanceController(access).state(sam.id);
    assert.equal(state.goals[0]?.transactions.length, 2);
    assert.equal(state.cards[0]?.isFavorite, true);
    assert.ok(state.cards[0]?.lastUsedAt);
    assert.equal(state.transactions.length, 2);
    assert.equal(
      state.transactions.reduce(
        (sum, e) =>
          sum + (e.type === 'INCOME' ? e.amountMinor : -e.amountMinor),
        0,
      ),
      8750,
    );
    assert.equal(state.limits.length, 1);
    assert.equal((await controller.state(other.id)).goals.length, 0);
    assert.equal((await controller.state(other.id)).cards.length, 0);
    assert.equal((await controller.state(other.id)).transactions.length, 0);
    assert.ok(
      notifications.includes(alex.id) && notifications.includes(sam.id),
    );
    await cards.remove(sam.id, card.id);
    await budget.remove(sam.id, first.id);
    await savings.remove(sam.id, goal.id);
    assert.equal(
      await prisma.savingsTransaction.count(),
      0,
      'goal removal cascades to history',
    );
    await prisma.couple.update({
      where: { id: pair.id },
      data: { deletedAt: new Date() },
    });
    await assert.rejects(async () => controller.state(sam.id));
    process.stdout.write(
      'PASS: all migrations, pair isolation, persistence, CRUD, idempotency, concurrent withdrawals, currency protection and partner notifications.\n',
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
    await admin.query(`DROP DATABASE "${database}" WITH (FORCE)`);
    await admin.end();
  }
}
void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
