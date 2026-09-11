/// <reference types="jest" />
import { AuthService } from '../auth/auth.service';
import { RelationshipService } from '../relationship/relationship.service';

import { getFrontendUrl, isAllowedOrigin } from './origin';

const frontend = 'https://nidio-eta.vercel.app,http://localhost:3000';

describe('Outgoing frontend links', () => {
  const originalFrontend = process.env.FRONTEND_URL;

  afterEach(() => {
    if (originalFrontend === undefined) delete process.env.FRONTEND_URL;
    else process.env.FRONTEND_URL = originalFrontend;
  });

  it('returns an existing invite using only the public origin', async () => {
    const service = new RelationshipService(
      {
        invite: {
          findFirst: jest.fn().mockResolvedValue({
            token: 'invite-token',
            expiresAt: new Date(),
          }),
        },
      } as never,
      { getOrThrow: jest.fn().mockReturnValue(frontend) } as never,
      {} as never,
    );
    expect((await service.getCurrentInvite('user'))?.url).toBe(
      'https://nidio-eta.vercel.app/invite/invite-token',
    );
  });

  it('uses the same public origin in password reset emails', async () => {
    process.env.FRONTEND_URL = frontend;
    const sendPasswordReset = jest.fn();
    const service = new AuthService(
      {
        user: {
          findUnique: jest
            .fn()
            .mockResolvedValue({ id: 'user', email: 'user@example.test' }),
        },
        passwordReset: { create: jest.fn() },
      } as never,
      {
        generateResetToken: () => 'reset-token',
        hash: jest.fn().mockResolvedValue('hash'),
      } as never,
      {} as never,
      {} as never,
      { sendPasswordReset } as never,
    );
    await service.forgotPassword('user@example.test');
    expect(sendPasswordReset).toHaveBeenCalledWith(
      'user@example.test',
      'https://nidio-eta.vercel.app/reset-password?token=reset-token',
    );
  });

  it('handles whitespace and a trailing slash', () => {
    expect(
      getFrontendUrl(
        ' , https://nidio-eta.vercel.app/ , http://localhost:3000',
      ),
    ).toBe('https://nidio-eta.vercel.app');
    expect(getFrontendUrl('http://localhost:3000/')).toBe(
      'http://localhost:3000',
    );
  });

  it('keeps all configured origins available for CORS', () => {
    process.env.FRONTEND_URL = frontend;
    expect(isAllowedOrigin('https://nidio-eta.vercel.app')).toBe(true);
    expect(isAllowedOrigin('http://localhost:3000')).toBe(true);
    expect(isAllowedOrigin('https://other.example.test')).toBe(false);
  });
});
