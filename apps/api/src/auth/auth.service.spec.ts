/// <reference types="jest" />
import { UnauthorizedException } from '@nestjs/common';

import { AuthService } from './auth.service';

describe('AuthService refresh', () => {
  const password = { verify: jest.fn(), hash: jest.fn() };
  const token = {
    generateAccessToken: jest.fn(),
    createRefreshToken: jest.fn(),
    verifyRefreshToken: jest.fn(),
  };
  const sessions = {
    findByJti: jest.fn(),
    delete: jest.fn(),
    rotate: jest.fn(),
  };
  const service = new AuthService(
    {} as never,
    password as never,
    token as never,
    sessions as never,
    {} as never,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    token.verifyRefreshToken.mockReturnValue({
      sub: 'user',
      type: 'refresh',
      jti: 'old-jti',
    });
    sessions.findByJti.mockResolvedValue({
      id: 'session',
      userId: 'user',
      jti: 'old-jti',
      tokenHash: 'old-hash',
      expiresAt: new Date(Date.now() + 60_000),
    });
    password.verify.mockResolvedValue(true);
    password.hash.mockResolvedValue('next-hash');
    token.generateAccessToken.mockReturnValue('next-access');
    token.createRefreshToken.mockReturnValue({
      jti: 'next-jti',
      token: 'next-refresh',
    });
  });

  it('rejects an access token at the refresh endpoint', async () => {
    token.verifyRefreshToken.mockImplementation(() => {
      throw new UnauthorizedException();
    });

    await expect(service.refresh('access')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(sessions.findByJti).not.toHaveBeenCalled();
  });

  it('rotates a claimed session into a new token pair', async () => {
    sessions.rotate.mockResolvedValue(true);

    await expect(service.refresh('old-refresh')).resolves.toEqual({
      accessToken: 'next-access',
      refreshToken: 'next-refresh',
    });
    expect(sessions.rotate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'session', jti: 'old-jti' }),
      expect.objectContaining({ jti: 'next-jti', tokenHash: 'next-hash' }),
    );
  });

  it('rejects a concurrent replay after another request claims the session', async () => {
    sessions.rotate.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    const results = await Promise.allSettled([
      service.refresh('old-refresh'),
      service.refresh('old-refresh'),
    ]);

    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === 'rejected'),
    ).toHaveLength(1);
  });
});
