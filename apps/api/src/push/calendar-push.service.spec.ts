/// <reference types="jest" />
import { PrismaService } from '../prisma/prisma.service';

import { CalendarPushService } from './calendar-push.service';
import { PushService } from './push.service';

const mockAsync = () => jest.fn<Promise<unknown>, unknown[]>();

describe('Calendar push scheduler', () => {
  const now = new Date('2026-09-09T09:00:30Z');
  const version = new Date('2026-09-01T00:00:00Z');
  const event = {
    id: 'event',
    userId: 'u1',
    coupleId: null,
    scope: 'PERSONAL',
    notificationDirty: false,
    title: 'Встреча',
    startAt: new Date('2026-09-09T10:00:00Z'),
    reminderAt: new Date('2026-09-09T09:00:00Z'),
    repeat: 'NONE',
    type: 'OTHER',
    repeatUntil: null,
    excludedDates: [],
    timeZone: 'Europe/Minsk',
    updatedAt: version,
  };
  const job = {
    id: 'job',
    key: 'EVENT_REMINDER:event:u1',
    kind: 'EVENT_REMINDER',
    sourceId: 'event',
    userId: 'u1',
    coupleId: null,
    sourceVersion: version,
    runAt: event.reminderAt,
    occurrenceAt: event.startAt,
    payload: {
      title: 'Напоминание',
      body: 'Встреча',
      url: '/calendar',
      tag: 'tag',
    },
  };
  const prisma = {
    $transaction: jest.fn(),
    event: {
      findMany: mockAsync(),
      findUnique: mockAsync(),
      updateMany: mockAsync(),
    },
    couple: {
      findMany: mockAsync(),
      findUnique: mockAsync(),
      updateMany: mockAsync(),
    },
    coupleMember: { findFirst: mockAsync(), findMany: mockAsync() },
    user: { findUnique: mockAsync(), findMany: mockAsync() },
    scheduledNotification: {
      findMany: mockAsync(),
      updateMany: mockAsync(),
      deleteMany: mockAsync(),
      create: mockAsync(),
      upsert: mockAsync(),
    },
  };
  const push = { publicKey: 'configured', notifyUser: mockAsync() };
  const service = new CalendarPushService(
    prisma as unknown as PrismaService,
    push as unknown as PushService,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => fn(prisma),
    );
    prisma.event.findMany.mockResolvedValue([]);
    prisma.couple.findMany.mockResolvedValue([]);
    prisma.scheduledNotification.findMany.mockResolvedValue([job]);
    prisma.scheduledNotification.updateMany.mockResolvedValue({ count: 1 });
    prisma.scheduledNotification.deleteMany.mockResolvedValue({ count: 1 });
    prisma.event.findUnique.mockResolvedValue(event);
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      timeZone: 'Europe/Minsk',
    });
  });

  it('sends a due reminder to its owner and removes a one-off job', async () => {
    await service.tick(now);
    expect(push.notifyUser).toHaveBeenCalledWith(
      'u1',
      expect.stringContaining('EVENT_REMINDER:event:u1'),
      job.payload,
    );
    expect(prisma.scheduledNotification.create).not.toHaveBeenCalled();
  });
  it('queries only dirty sources and due queue rows', async () => {
    await service.tick(now);
    expect(prisma.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { notificationDirty: true } }),
    );
    expect(prisma.scheduledNotification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { runAt: { lte: now }, leaseUntil: { lte: now } },
      }),
    );
  });
  it('does not process a job leased by another API instance', async () => {
    prisma.scheduledNotification.updateMany.mockResolvedValue({ count: 0 });
    await service.tick(now);
    expect(push.notifyUser).not.toHaveBeenCalled();
  });
  it('does not send stale jobs after editing/deletion', async () => {
    prisma.event.findUnique.mockResolvedValue({
      ...event,
      updatedAt: now,
      notificationDirty: true,
    });
    await service.tick(now);
    prisma.event.findUnique.mockResolvedValue(null);
    await service.tick(now);
    expect(push.notifyUser).not.toHaveBeenCalled();
  });
  it('does not send a couple event to a former partner', async () => {
    prisma.scheduledNotification.findMany.mockResolvedValue([
      { ...job, coupleId: 'couple' },
    ]);
    prisma.coupleMember.findFirst.mockResolvedValue(null);
    await service.tick(now);
    expect(push.notifyUser).not.toHaveBeenCalled();
  });
  it('advances recurring reminders even after missing their one-hour delivery window', async () => {
    prisma.event.findUnique.mockResolvedValue({ ...event, repeat: 'DAILY' });
    await service.tick(new Date('2026-09-09T11:00:00Z'));
    expect(push.notifyUser).not.toHaveBeenCalled();
    expect(prisma.scheduledNotification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        runAt: new Date('2026-09-10T09:00:00Z'),
      }),
    });
  });
  it('does not overwrite a replacement schedule created by a concurrent edit', async () => {
    prisma.event.findUnique.mockResolvedValue({ ...event, repeat: 'DAILY' });
    prisma.scheduledNotification.deleteMany.mockResolvedValue({ count: 0 });
    await service.tick(now);
    expect(prisma.scheduledNotification.create).not.toHaveBeenCalled();
  });
  it('suppresses the noon notification when the explicit reminder is scheduled for the same moment', async () => {
    prisma.scheduledNotification.findMany.mockResolvedValue([
      { ...job, kind: 'EVENT_DAY', payload: { ...job.payload, skip: true } },
    ]);
    await service.tick(now);
    expect(push.notifyUser).not.toHaveBeenCalled();
  });

  it('enqueues one cancellation for the partner, never the actor', async () => {
    prisma.coupleMember.findMany.mockResolvedValue([{ userId: 'u2' }]);
    await service.enqueueChange(
      prisma as never,
      { ...event, scope: 'COUPLE', coupleId: 'couple' } as never,
      'u1',
      'Отмена',
      'вся серия',
      'ALL',
    );
    expect(prisma.coupleMember.findMany).toHaveBeenCalledWith({
      where: {
        coupleId: 'couple',
        userId: { not: 'u1' },
        couple: { deletedAt: null },
      },
    });
    expect(prisma.scheduledNotification.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.scheduledNotification.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          userId: 'u2',
          payload: expect.objectContaining({ body: 'Встреча — вся серия' }),
        }),
      }),
    );
  });
});
