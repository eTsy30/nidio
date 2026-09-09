import { subDays } from 'date-fns';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

import { PrismaService } from '../src/prisma/prisma.service';
import { NotificationPayload, PushService } from '../src/push/push.service';
import { RelationshipService } from '../src/relationship/relationship.service';
import { AssigneeMode } from '../src/tasks/enums/assignee-mode.enum';
import { TaskOverdueService } from '../src/tasks/task-overdue.service';
import { TasksService } from '../src/tasks/tasks.service';

async function main() {
  const url = process.env.TODO_TEST_DATABASE_URL;
  assert(
    url && new URL(url).pathname === '/todo_push_test',
    'Use an isolated todo_push_test database',
  );
  process.env.DATABASE_URL = url;
  const prisma = new PrismaService();
  await prisma.$connect();
  const suffix = randomUUID();
  const creator = await prisma.user.create({
    data: {
      email: `${suffix}-a@example.test`,
      firstName: 'А',
      passwordHash: 'test',
    },
  });
  const partner = await prisma.user.create({
    data: {
      email: `${suffix}-b@example.test`,
      firstName: 'Б',
      passwordHash: 'test',
    },
  });
  const couple = await prisma.couple.create({
    data: {
      members: { create: [{ userId: creator.id }, { userId: partner.id }] },
      board: { create: { columns: { create: { title: 'Todo', order: 0 } } } },
    },
    include: { board: { include: { columns: true } } },
  });
  const columnId = couple.board!.columns[0]!.id;
  const sent: { userId: string; key: string; payload: NotificationPayload }[] =
    [];
  const push = {
    publicKey: 'test',
    notifyUser: async (
      userId: string,
      key: string,
      payload: NotificationPayload,
    ) => {
      sent.push({ userId, key, payload });
    },
  };
  const relationship = { getCurrentCouple: async () => ({ id: couple.id }) };
  const tasks = new TasksService(
    prisma,
    relationship as unknown as RelationshipService,
    push as unknown as PushService,
  );
  const worker = new TaskOverdueService(prisma, push as unknown as PushService);
  const otherWorker = new TaskOverdueService(
    prisma,
    push as unknown as PushService,
  );
  try {
    const self = await tasks.create(
      { title: 'Моя задача', columnId },
      creator.id,
    );
    assert.equal(self.assigneeId, creator.id);
    assert.equal(sent.length, 0);
    const assigned = await tasks.create(
      {
        title: 'Задача партнёру',
        columnId,
        assigneeMode: AssigneeMode.PARTNER,
      },
      creator.id,
    );
    assert.equal(assigned.assigneeId, partner.id);
    assert.equal(sent.length, 1);
    assert.equal(sent[0]!.payload.url, '/together');
    sent.length = 0;
    await tasks.update(
      assigned.id,
      { title: 'Новое название', description: 'Описание', priority: true },
      creator.id,
    );
    assert.equal(sent.length, 0);
    await tasks.update(
      assigned.id,
      { assigneeMode: AssigneeMode.ME },
      creator.id,
    );
    assert.equal(sent.length, 0);
    await tasks.update(
      assigned.id,
      { assigneeMode: AssigneeMode.PARTNER },
      creator.id,
    );
    const firstKey = sent[0]!.key;
    await tasks.update(
      assigned.id,
      { assigneeMode: AssigneeMode.ME },
      creator.id,
    );
    await tasks.update(
      assigned.id,
      { assigneeMode: AssigneeMode.PARTNER },
      creator.id,
    );
    assert.equal(sent.length, 2);
    assert.notEqual(firstKey, sent[1]!.key);
    sent.length = 0;
    const nudgeResults = await Promise.allSettled([
      tasks.nudge(assigned.id, creator.id),
      tasks.nudge(assigned.id, creator.id),
    ]);
    assert.equal(
      nudgeResults.filter((result) => result.status === 'fulfilled').length,
      1,
    );
    assert.equal(
      await prisma.nudge.count({ where: { taskId: assigned.id } }),
      1,
    );
    assert.equal(sent.length, 1);
    assert.equal(sent[0]!.userId, partner.id);
    sent.length = 0;
    await assert.rejects(tasks.complete(assigned.id, creator.id));
    await tasks.complete(assigned.id, partner.id);
    assert.equal(sent.length, 0);
    await tasks.remove(assigned.id, creator.id);
    assert.equal(sent.length, 0);

    const both = await tasks.create(
      { title: 'Общая задача', columnId, assigneeMode: AssigneeMode.BOTH },
      creator.id,
    );
    sent.length = 0;
    await Promise.all([
      tasks.complete(both.id, creator.id),
      tasks.complete(both.id, partner.id),
    ]);
    assert.equal(
      (await prisma.task.findUniqueOrThrow({ where: { id: both.id } }))
        .completed,
      true,
      'concurrent BOTH completions finish the task',
    );
    assert.equal(sent.length, 0);

    const yesterday = subDays(new Date(), 1).toISOString();
    await tasks.create(
      { title: 'Моя просрочка', columnId, dueAt: yesterday },
      creator.id,
    );
    const latePartner = await tasks.create(
      {
        title: 'Просрочка партнёра',
        columnId,
        dueAt: yesterday,
        assigneeMode: AssigneeMode.PARTNER,
      },
      creator.id,
    );
    const lateBoth = await tasks.create(
      {
        title: 'Просрочка обоих',
        columnId,
        dueAt: yesterday,
        assigneeMode: AssigneeMode.BOTH,
      },
      creator.id,
    );
    const today = await tasks.create(
      {
        title: 'Сегодня',
        columnId,
        dueAt: new Date().toISOString(),
        assigneeMode: AssigneeMode.PARTNER,
      },
      creator.id,
    );
    sent.length = 0;
    await Promise.all([worker.tick(), otherWorker.tick()]);
    assert.equal(
      sent.length,
      4,
      'two recipients for partner overdue and BOTH; no self/today push',
    );
    assert.equal(
      sent.filter((item) => item.key === `task-overdue:${latePartner.id}`)
        .length,
      2,
    );
    assert.equal(
      sent.filter((item) => item.key === `task-overdue:${lateBoth.id}`).length,
      2,
    );
    await worker.tick();
    assert.equal(sent.length, 4, 'subsequent checks do not repeat overdue');
    assert.equal(
      (await prisma.task.findUniqueOrThrow({ where: { id: today.id } }))
        .overdueNotifiedAt,
      null,
    );
    console.info(
      'Todo integration passed: CRUD, assignment, concurrent BOTH/nudge, overdue once, real PostgreSQL/mock push',
    );
  } finally {
    await prisma.task.deleteMany({ where: { columnId } });
    await prisma.column.delete({ where: { id: columnId } });
    await prisma.board.delete({ where: { id: couple.board!.id } });
    await prisma.couple.delete({ where: { id: couple.id } });
    await prisma.user.deleteMany({
      where: { id: { in: [creator.id, partner.id] } },
    });
    await prisma.$disconnect();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
