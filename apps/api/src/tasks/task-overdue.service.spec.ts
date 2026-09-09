/// <reference types="jest" />
import { startOfDay, subDays } from 'date-fns';

import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';

import { TaskOverdueService } from './task-overdue.service';

describe('Todo overdue worker', () => {
  const now = new Date('2026-09-10T12:00:00Z');
  const task = {
    id: 'task',
    createdById: 'a',
    assigneeId: 'b',
    assigneeMode: 'PARTNER',
    title: 'Уборка',
    columnId: 'column',
    dueAt: subDays(now, 1),
    updatedAt: now,
  };
  const prisma = {
    task: { findMany: jest.fn(), updateMany: jest.fn() },
    column: { findUnique: jest.fn() },
  };
  const push = {
    publicKey: 'configured' as string | null,
    notifyUser: jest.fn(),
  };
  const service = new TaskOverdueService(
    prisma as unknown as PrismaService,
    push as unknown as PushService,
  );
  beforeEach(() => {
    jest.resetAllMocks();
    push.publicKey = 'configured';
    prisma.task.findMany.mockResolvedValue([task]);
    prisma.task.updateMany.mockResolvedValue({ count: 1 });
    prisma.column.findUnique.mockResolvedValue({
      board: {
        couple: {
          deletedAt: null,
          members: [{ userId: 'a' }, { userId: 'b' }],
        },
      },
    });
  });
  it('selects only overdue uncompleted tasks with no previous attempt', async () => {
    await service.tick(now);
    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          completed: false,
          overdueNotifiedAt: null,
          dueAt: { lt: startOfDay(now) },
        },
      }),
    );
    expect(push.notifyUser).toHaveBeenCalledTimes(2);
    expect(push.notifyUser.mock.calls.map((call) => call[0])).toEqual([
      'a',
      'b',
    ]);
  });
  it('sends BOTH overdue to both participants', async () => {
    prisma.task.findMany.mockResolvedValue([
      { ...task, assigneeId: null, assigneeMode: 'BOTH' },
    ]);
    await service.tick(now);
    expect(push.notifyUser).toHaveBeenCalledTimes(2);
  });
  it('marks self-assigned tasks processed without a push', async () => {
    prisma.task.findMany.mockResolvedValue([
      { ...task, assigneeId: 'a', assigneeMode: 'ME' },
    ]);
    await service.tick(now);
    expect(push.notifyUser).not.toHaveBeenCalled();
    expect(prisma.task.updateMany).toHaveBeenCalled();
  });
  it('does not duplicate a previously claimed task', async () => {
    prisma.task.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValue({ count: 0 });
    await service.tick(now);
    await service.tick(now);
    expect(push.notifyUser).toHaveBeenCalledTimes(2);
  });
  it('does not send after a concurrent completion, deletion or edit', async () => {
    prisma.task.updateMany.mockResolvedValue({ count: 0 });
    await service.tick(now);
    expect(push.notifyUser).not.toHaveBeenCalled();
    expect(prisma.task.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          completed: false,
          updatedAt: task.updatedAt,
        }),
      }),
    );
  });
  it('does not send to former couple members or run without VAPID config', async () => {
    prisma.column.findUnique.mockResolvedValue({
      board: { couple: { deletedAt: now, members: [] } },
    });
    await service.tick(now);
    expect(push.notifyUser).not.toHaveBeenCalled();
    prisma.task.findMany.mockClear();
    push.publicKey = null;
    await service.tick(now);
    expect(prisma.task.findMany).not.toHaveBeenCalled();
  });
});
