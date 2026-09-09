import { BadRequestException } from '@nestjs/common';
import type { AssigneeMode, Task } from '@prisma/client';

type AssignmentInput = {
  assigneeMode?: AssigneeMode;
  assigneeId?: string | null;
  rotationFirstAssigneeId?: string | null;
};
export function resolveTaskAssignment(
  input: AssignmentInput,
  creatorId: string,
  members: string[],
  previous?: Task,
) {
  for (const id of [input.assigneeId, input.rotationFirstAssigneeId]) {
    if (id && !members.includes(id))
      throw new BadRequestException('Исполнитель должен состоять в вашей паре');
  }
  const mode =
    input.assigneeMode ??
    (input.assigneeId !== undefined
      ? input.assigneeId === creatorId
        ? 'ME'
        : input.assigneeId
          ? 'PARTNER'
          : 'BOTH'
      : (previous?.assigneeMode ?? 'ME'));
  const partnerId = members.find((id) => id !== creatorId);
  if (!members.includes(creatorId) || !partnerId)
    throw new BadRequestException('Для задачи нужна действующая пара');
  const first =
    input.rotationFirstAssigneeId ??
    previous?.rotationFirstAssigneeId ??
    creatorId;
  const assigneeId =
    mode === 'BOTH'
      ? null
      : mode === 'ME'
        ? creatorId
        : mode === 'PARTNER'
          ? partnerId
          : (input.assigneeId ??
            (previous?.assigneeMode === 'ROTATE' &&
            input.rotationFirstAssigneeId === undefined
              ? previous.assigneeId
              : first) ??
            first);
  if (input.assigneeId !== undefined && input.assigneeId !== assigneeId) {
    throw new BadRequestException(
      'Исполнитель не соответствует выбранному режиму',
    );
  }
  return {
    assigneeMode: mode,
    assigneeId,
    rotationFirstAssigneeId: mode === 'ROTATE' ? first : null,
  };
}

export function assignedTaskUsers(
  task: Pick<Task, 'assigneeMode' | 'assigneeId'>,
  members: string[],
) {
  return task.assigneeMode === 'BOTH'
    ? members
    : task.assigneeId && members.includes(task.assigneeId)
      ? [task.assigneeId]
      : [];
}

export function overdueRecipients(
  task: Pick<Task, 'assigneeMode' | 'assigneeId' | 'createdById'>,
  members: string[],
) {
  if (!members.includes(task.createdById)) return [];
  if (task.assigneeMode === 'BOTH') return [...new Set(members)];
  if (
    !task.assigneeId ||
    task.assigneeId === task.createdById ||
    !members.includes(task.assigneeId)
  )
    return [];
  return [task.createdById, task.assigneeId];
}
