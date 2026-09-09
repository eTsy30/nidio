/// <reference types="jest" />
import type { Task } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';
import { RelationshipService } from '../relationship/relationship.service';

import { AssigneeMode } from './enums/assignee-mode.enum';
import { TasksService } from './tasks.service';

function fixture(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task',
    title: 'Задача',
    description: null,
    columnId: 'column',
    coupleId: 'couple',
    createdById: 'a',
    assigneeId: 'a',
    assigneeMode: 'ME',
    rotationFirstAssigneeId: null,
    order: 0,
    priority: false,
    completed: false,
    completedAt: null,
    dueAt: null,
    repeat: 'NONE',
    repeatUntil: null,
    repeatConfig: null,
    recurringGroupId: null,
    occurrenceIndex: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    overdueNotifiedAt: null,
    ...overrides,
  };
}

describe('Todo mutations', () => {
  let stored = fixture();
  let completions = new Set<string>();
  const prisma = {
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
    task: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
    },
    column: { findFirst: jest.fn() },
    board: { findUnique: jest.fn() },
    coupleMember: { findMany: jest.fn() },
    taskCompletion: {
      findUnique: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn(),
    },
    nudge: { findFirst: jest.fn(), create: jest.fn() },
  };
  const relationship = { getCurrentCouple: jest.fn() };
  const push = { notifyUser: jest.fn() };
  const service = new TasksService(
    prisma as unknown as PrismaService,
    relationship as unknown as RelationshipService,
    push as unknown as PushService,
  );
  beforeEach(() => {
    jest.resetAllMocks();
    stored = fixture();
    completions = new Set();
    prisma.$transaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => fn(prisma),
    );
    prisma.$queryRaw.mockResolvedValue([]);
    relationship.getCurrentCouple.mockResolvedValue({ id: 'couple' });
    prisma.task.findUnique.mockImplementation(async () => ({
      ...stored,
      column: { boardId: 'board' },
    }));
    prisma.task.findUniqueOrThrow.mockImplementation(async () => stored);
    prisma.task.aggregate.mockResolvedValue({ _max: { order: null } });
    prisma.task.create.mockImplementation(
      async ({ data }: { data: Partial<Task> }) => (stored = fixture(data)),
    );
    prisma.task.update.mockImplementation(
      async ({ data }: { data: Partial<Task> }) =>
        (stored = { ...stored, ...data }),
    );
    prisma.task.delete.mockImplementation(async () => stored);
    prisma.column.findFirst.mockResolvedValue({ id: 'column' });
    prisma.board.findUnique.mockResolvedValue({
      id: 'board',
      coupleId: 'couple',
    });
    prisma.coupleMember.findMany.mockResolvedValue([
      { userId: 'a' },
      { userId: 'b' },
    ]);
    push.notifyUser.mockResolvedValue(undefined);
    prisma.taskCompletion.findUnique.mockImplementation(
      async ({ where }: { where: { taskId_userId: { userId: string } } }) =>
        completions.has(where.taskId_userId.userId) ? {} : null,
    );
    prisma.taskCompletion.create.mockImplementation(
      async ({ data }: { data: { userId: string } }) => {
        completions.add(data.userId);
        return data;
      },
    );
    prisma.taskCompletion.count.mockImplementation(
      async () => completions.size,
    );
    prisma.nudge.findFirst.mockResolvedValue(null);
    prisma.nudge.create.mockResolvedValue({
      id: 'nudge',
      recipientId: 'b',
      createdAt: new Date(),
    });
  });

  it('creates a self-assigned task silently and a partner task with one push', async () => {
    await service.create({ title: 'Моя', columnId: 'column' }, 'a');
    expect(stored.assigneeId).toBe('a');
    expect(push.notifyUser).not.toHaveBeenCalled();
    await service.create(
      {
        title: 'Партнёру',
        columnId: 'column',
        assigneeMode: AssigneeMode.PARTNER,
      },
      'a',
    );
    expect(stored.assigneeId).toBe('b');
    expect(push.notifyUser).toHaveBeenCalledWith(
      'b',
      'task-created:task',
      expect.objectContaining({ url: '/together' }),
    );
  });
  it('creates BOTH with a push only to the partner', async () => {
    await service.create(
      { title: 'Вместе', columnId: 'column', assigneeMode: AssigneeMode.BOTH },
      'a',
    );
    expect(stored.assigneeId).toBeNull();
    expect(push.notifyUser).toHaveBeenCalledTimes(1);
    expect(push.notifyUser.mock.calls[0][0]).toBe('b');
  });
  it('changes the actual assignee when only mode is patched, and permits later reassignment pushes', async () => {
    await service.update('task', { assigneeMode: AssigneeMode.PARTNER }, 'a');
    expect(stored.assigneeId).toBe('b');
    await service.update('task', { assigneeMode: AssigneeMode.ME }, 'a');
    await service.update('task', { assigneeMode: AssigneeMode.PARTNER }, 'a');
    expect(push.notifyUser).toHaveBeenCalledTimes(2);
    expect(push.notifyUser.mock.calls[0][1]).not.toBe(
      push.notifyUser.mock.calls[1][1],
    );
  });
  it('does not notify when title, description, date, repeat or priority changes', async () => {
    stored = fixture({ assigneeId: 'b', assigneeMode: 'PARTNER' });
    await service.update(
      'task',
      {
        title: 'Новое',
        description: 'Описание',
        dueAt: null,
        priority: true,
        repeat: 'DAILY',
      },
      'a',
    );
    expect(push.notifyUser).not.toHaveBeenCalled();
    expect(stored.recurringGroupId).not.toBeNull();
  });
  it('does not send to an old assignee or an actor assigning a task to themselves', async () => {
    await service.update('task', { assigneeMode: AssigneeMode.PARTNER }, 'b');
    expect(push.notifyUser).not.toHaveBeenCalled();
  });
  it('keeps successful creation successful even when push fails', async () => {
    push.notifyUser.mockRejectedValue(new Error('push unavailable'));
    await expect(
      service.create(
        {
          title: 'Задача',
          columnId: 'column',
          assigneeMode: AssigneeMode.PARTNER,
        },
        'a',
      ),
    ).resolves.toHaveProperty('id');
  });
  it('completes only by the assigned user, without push', async () => {
    stored = fixture({ assigneeId: 'b', assigneeMode: 'PARTNER' });
    await expect(service.complete('task', 'a')).rejects.toThrow(
      'только исполнитель',
    );
    await service.complete('task', 'b');
    expect(stored.completed).toBe(true);
    expect(push.notifyUser).not.toHaveBeenCalled();
  });
  it('requires both BOTH completions, with a task row lock and without push', async () => {
    stored = fixture({ assigneeId: null, assigneeMode: 'BOTH' });
    await service.complete('task', 'a');
    expect(stored.completed).toBe(false);
    await service.complete('task', 'b');
    expect(stored.completed).toBe(true);
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(2);
    expect(push.notifyUser).not.toHaveBeenCalled();
  });
  it('deletes silently', async () => {
    await service.remove('task', 'a');
    expect(prisma.task.delete).toHaveBeenCalled();
    expect(push.notifyUser).not.toHaveBeenCalled();
  });
  it('nudges the assignee only when requested by the creator', async () => {
    stored = fixture({ assigneeId: 'b', assigneeMode: 'PARTNER' });
    await expect(service.nudge('task', 'b')).rejects.toThrow();
    await service.nudge('task', 'a');
    expect(push.notifyUser).toHaveBeenCalledWith(
      'b',
      'task-nudge:nudge',
      expect.objectContaining({ url: '/together' }),
    );
  });
  it('rejects repeated, completed and self nudges', async () => {
    await expect(service.nudge('task', 'a')).rejects.toThrow();
    stored = fixture({
      assigneeId: 'b',
      assigneeMode: 'PARTNER',
      completed: true,
    });
    await expect(service.nudge('task', 'a')).rejects.toThrow();
    stored.completed = false;
    prisma.nudge.findFirst.mockResolvedValue({ id: 'recent' });
    await expect(service.nudge('task', 'a')).rejects.toThrow('через час');
    expect(push.notifyUser).not.toHaveBeenCalled();
  });
});
