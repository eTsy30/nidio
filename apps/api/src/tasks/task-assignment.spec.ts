/// <reference types="jest" />
import type { Task } from '@prisma/client';

import {
  assignedTaskUsers,
  overdueRecipients,
  resolveTaskAssignment,
} from './task-assignment';

const members = ['creator', 'partner'];
describe('Todo assignment policy', () => {
  it('resolves default and partner assignments even without a client assigneeId', () => {
    expect(resolveTaskAssignment({}, 'creator', members).assigneeId).toBe(
      'creator',
    );
    expect(
      resolveTaskAssignment({ assigneeMode: 'PARTNER' }, 'creator', members)
        .assigneeId,
    ).toBe('partner');
  });
  it('rejects IDs outside the couple and inconsistent modes', () => {
    expect(() =>
      resolveTaskAssignment({ assigneeId: 'couple-id' }, 'creator', members),
    ).toThrow();
    expect(() =>
      resolveTaskAssignment(
        { assigneeMode: 'ME', assigneeId: 'partner' },
        'creator',
        members,
      ),
    ).toThrow();
  });
  it('handles BOTH and the chosen first rotation participant', () => {
    expect(
      resolveTaskAssignment(
        { assigneeMode: 'BOTH', assigneeId: null },
        'creator',
        members,
      ).assigneeId,
    ).toBeNull();
    expect(
      resolveTaskAssignment(
        { assigneeMode: 'ROTATE', rotationFirstAssigneeId: 'partner' },
        'creator',
        members,
      ).assigneeId,
    ).toBe('partner');
  });
  it('preserves the current ROTATE participant when editing other data', () => {
    const previous = {
      assigneeMode: 'ROTATE',
      assigneeId: 'partner',
      rotationFirstAssigneeId: 'creator',
    } as Task;
    expect(
      resolveTaskAssignment(
        { assigneeMode: 'ROTATE' },
        'creator',
        members,
        previous,
      ).assigneeId,
    ).toBe('partner');
  });
  it('notifies nobody for self-assigned overdue tasks, both parties otherwise', () => {
    expect(
      overdueRecipients(
        { createdById: 'creator', assigneeId: 'creator', assigneeMode: 'ME' },
        members,
      ),
    ).toEqual([]);
    expect(
      overdueRecipients(
        {
          createdById: 'creator',
          assigneeId: 'partner',
          assigneeMode: 'PARTNER',
        },
        members,
      ),
    ).toEqual(members);
    expect(
      overdueRecipients(
        { createdById: 'creator', assigneeId: null, assigneeMode: 'BOTH' },
        members,
      ),
    ).toEqual(members);
    expect(
      overdueRecipients(
        {
          createdById: 'creator',
          assigneeId: 'outsider',
          assigneeMode: 'PARTNER',
        },
        members,
      ),
    ).toEqual([]);
  });
  it('returns real participant sets for reassignment comparisons', () => {
    expect(
      assignedTaskUsers({ assigneeMode: 'BOTH', assigneeId: null }, members),
    ).toEqual(members);
    expect(
      assignedTaskUsers(
        { assigneeMode: 'PARTNER', assigneeId: 'partner' },
        members,
      ),
    ).toEqual(['partner']);
  });
});
