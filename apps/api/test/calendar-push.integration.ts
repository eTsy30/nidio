import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

import { CalendarService } from '../src/calendar/calendar.service';
import {
  EventRepeat,
  EventScope,
  EventType,
} from '../src/calendar/models/event.model';
import { EventDeleteMode } from '../src/calendar/models/event-delete-mode';
import { PrismaService } from '../src/prisma/prisma.service';
import { CalendarPushService } from '../src/push/calendar-push.service';
import { NotificationPayload, PushService } from '../src/push/push.service';

async function main() {
  const url = process.env.CALENDAR_PUSH_TEST_DATABASE_URL;
  assert(
    url && new URL(url).pathname === '/calendar_push_test',
    'Use an isolated calendar_push_test database',
  );
  process.env.DATABASE_URL = url;
  const prisma = new PrismaService();
  await prisma.$connect();
  const sent: { userId: string; key: string; payload: NotificationPayload }[] =
    [];
  const transport = {
    publicKey: 'test',
    notifyUser: async (
      userId: string,
      key: string,
      payload: NotificationPayload,
    ) => {
      sent.push({ userId, key, payload });
    },
  };
  const worker = new CalendarPushService(
    prisma,
    transport as unknown as PushService,
  );
  const otherWorker = new CalendarPushService(
    prisma,
    transport as unknown as PushService,
  );
  const calendar = new CalendarService(prisma, worker);
  const suffix = randomUUID();
  const first = await prisma.user.create({
    data: {
      email: `${suffix}-a@example.test`,
      firstName: 'А',
      passwordHash: 'test',
      timeZone: 'Europe/Minsk',
    },
  });
  const second = await prisma.user.create({
    data: {
      email: `${suffix}-b@example.test`,
      firstName: 'Б',
      passwordHash: 'test',
      timeZone: 'America/New_York',
    },
  });
  const couple = await prisma.couple.create({
    data: {
      members: { create: [{ userId: first.id }, { userId: second.id }] },
    },
  });
  const now = new Date();
  const startAt = new Date(now.getTime() + 3_600_000);
  const base = {
    title: 'Тест',
    startAt,
    endAt: null,
    allDay: false,
    type: EventType.OTHER,
    scope: EventScope.PERSONAL,
    repeat: EventRepeat.NONE,
    reminderAt: new Date(now.getTime() - 1000),
    timeZone: 'Europe/Minsk',
  };
  try {
    const personal = await calendar.create(first.id, base);
    await Promise.all([worker.tick(now), otherWorker.tick(now)]);
    assert.equal(
      sent.length,
      1,
      'competing schedulers must send a personal reminder only once',
    );
    assert.equal(sent[0]?.userId, first.id);
    assert.equal(
      await prisma.scheduledNotification.count({
        where: { sourceId: personal.id },
      }),
      0,
    );

    const shared = await calendar.create(first.id, {
      ...base,
      scope: EventScope.COUPLE,
      repeat: EventRepeat.DAILY,
    });
    sent.length = 0;
    await worker.tick(now);
    assert.equal(sent.length, 2, 'couple reminders reach both participants');
    assert.deepEqual(
      new Set(sent.map((item) => item.userId)),
      new Set([first.id, second.id]),
    );
    assert.equal(
      await prisma.scheduledNotification.count({
        where: { sourceId: shared.id },
      }),
      2,
    );

    sent.length = 0;
    await calendar.update(first.id, shared.id, { title: 'Другое название' });
    assert.equal(
      await prisma.scheduledNotification.count({
        where: { sourceId: shared.id, kind: 'EVENT_CHANGE' },
      }),
      0,
      'title edit does not notify partner',
    );
    // Move reminder safely into the future, then change start time.
    await calendar.update(first.id, shared.id, {
      startAt: new Date(startAt.getTime() + 3_600_000),
      reminderAt: new Date(startAt.getTime() + 1_800_000),
    });
    await worker.tick(new Date());
    assert.equal(
      sent.length,
      1,
      'time change creates exactly one partner notification',
    );
    assert.equal(sent[0]?.userId, second.id);

    sent.length = 0;
    await calendar.delete(first.id, shared.id, EventDeleteMode.ALL);
    assert.equal(
      await prisma.scheduledNotification.count({
        where: { sourceId: shared.id, kind: 'EVENT_REMINDER' },
      }),
      0,
      'deletion removes pending reminders atomically',
    );
    await worker.tick(new Date());
    assert.equal(sent.length, 1);
    assert.equal(sent[0]?.userId, second.id);
    assert.match(sent[0]!.payload.body, /вся серия/);

    const tomorrow = new Date(now.getTime() + 86_400_000);
    const birthday = await calendar.create(first.id, {
      ...base,
      startAt: tomorrow,
      reminderAt: null,
      type: EventType.BIRTHDAY,
      scope: EventScope.COUPLE,
    });
    await worker.tick(now);
    const noonJobs = await prisma.scheduledNotification.findMany({
      where: { sourceId: birthday.id, kind: 'EVENT_DAY' },
    });
    assert.equal(noonJobs.length, 2);
    assert.notEqual(
      noonJobs[0]!.runAt.toISOString(),
      noonJobs[1]!.runAt.toISOString(),
      'each user gets their own local noon',
    );
    await worker.setTimeZone(second.id, 'Asia/Tokyo');
    await worker.tick(now);
    const moved = await prisma.scheduledNotification.findFirstOrThrow({
      where: { sourceId: birthday.id, userId: second.id },
    });
    assert.equal(moved.runAt.getUTCHours(), 3, 'timezone sync replans noon');

    await prisma.couple.update({
      where: { id: couple.id },
      data: {
        relationshipAt: new Date('2020-12-20T00:00:00Z'),
        notificationDirty: true,
      },
    });
    await worker.tick(now);
    assert.equal(
      await prisma.scheduledNotification.count({
        where: { sourceId: couple.id, kind: 'RELATIONSHIP_DAY' },
      }),
      2,
    );

    // Edit a later recurrence without moving the anchor to the later date.
    const series = await calendar.create(first.id, {
      ...base,
      startAt,
      reminderAt: new Date(startAt.getTime() - 3_600_000),
      repeat: EventRepeat.DAILY,
    });
    const third = new Date(startAt.getTime() + 2 * 86_400_000);
    await calendar.update(first.id, series.id, {
      occurrenceDate: third,
      startAt: third,
      reminderAt: new Date(third.getTime() - 1_800_000),
    });
    const saved = await prisma.event.findUniqueOrThrow({
      where: { id: series.id },
    });
    assert.equal(saved.startAt.getTime(), startAt.getTime());
    assert.equal(
      saved.startAt.getTime() - saved.reminderAt!.getTime(),
      1_800_000,
    );
    console.info(
      'Calendar integration: passed (real PostgreSQL, mock push transport)',
    );
  } finally {
    await prisma.event.deleteMany({
      where: { createdById: { in: [first.id, second.id] } },
    });
    await prisma.couple.delete({ where: { id: couple.id } });
    await prisma.user.deleteMany({
      where: { id: { in: [first.id, second.id] } },
    });
    await prisma.$disconnect();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
