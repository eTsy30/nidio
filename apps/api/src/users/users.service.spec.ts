/// <reference types="jest" />
import { UsersService } from './users.service';

describe('UsersService profile contract', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
    },
  };
  const service = new UsersService(prisma as never);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the profile fields selected by /users/me', async () => {
    const profile = {
      id: 'user-1',
      email: 'user@example.com',
      firstName: 'Ира',
      avatarUrl: null,
      gender: 'UNSPECIFIED',
      emailVerifiedAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    prisma.user.findUnique.mockResolvedValue(profile);

    await expect(service.getMe('user-1')).resolves.toEqual(profile);
    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        select: expect.objectContaining({
          id: true,
          email: true,
          firstName: true,
          avatarUrl: true,
          gender: true,
          emailVerifiedAt: true,
          createdAt: true,
        }),
      }),
    );
  });
});
