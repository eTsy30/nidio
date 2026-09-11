/// <reference types="jest" />
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';

import { RelationshipService } from './relationship.service';

describe('Shared relationship date', () => {
  const prisma = {
    coupleMember: { findFirst: jest.fn() },
    couple: { update: jest.fn() },
  };
  const realtime = { emitToUser: jest.fn() };
  const service = new RelationshipService(
    prisma as unknown as PrismaService,
    {} as ConfigService,
    realtime as unknown as RealtimeService,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.coupleMember.findFirst.mockResolvedValue({
      coupleId: 'pair',
      couple: { members: [{ userId: 'first' }, { userId: 'second' }] },
    });
  });

  it.each(['first', 'second'])(
    'notifies both members when %s saves the date',
    async (userId) => {
      const date = '2025-06-01T00:00:00.000Z';
      const result = { id: 'pair', relationshipAt: new Date(date) };
      prisma.couple.update.mockResolvedValue(result);
      expect(await service.updateRelationship(userId, date)).toEqual(result);
      expect(prisma.coupleMember.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId, couple: { deletedAt: null } },
        }),
      );
      expect(prisma.couple.update).toHaveBeenCalledWith({
        where: { id: 'pair' },
        select: { id: true, relationshipAt: true },
        data: { relationshipAt: new Date(date), notificationDirty: true },
      });
      expect(realtime.emitToUser.mock.calls).toEqual([
        ['first', 'relationship.updated', { coupleId: 'pair' }],
        ['second', 'relationship.updated', { coupleId: 'pair' }],
      ]);
    },
  );

  it('does not notify members when saving fails', async () => {
    prisma.couple.update.mockRejectedValue(new Error('Save failed'));
    await expect(service.updateRelationship('first', null)).rejects.toThrow(
      'Save failed',
    );
    expect(realtime.emitToUser).not.toHaveBeenCalled();
  });

  it('rejects a user without a pair', async () => {
    prisma.coupleMember.findFirst.mockResolvedValue(null);
    await expect(service.updateRelationship('other', null)).rejects.toThrow(
      'Couple not found.',
    );
    expect(prisma.couple.update).not.toHaveBeenCalled();
    expect(realtime.emitToUser).not.toHaveBeenCalled();
  });
});
