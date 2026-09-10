/// <reference types="jest" />
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { TokenService } from './token.service';

describe('TokenService', () => {
  const jwt = { sign: jest.fn(), verify: jest.fn(), decode: jest.fn() };
  const service = new TokenService(jwt as unknown as JwtService);

  beforeEach(() => jest.resetAllMocks());

  it('issues explicit access and refresh token kinds', () => {
    jwt.sign.mockReturnValueOnce('access').mockReturnValueOnce('refresh');

    expect(service.generateAccessToken('user')).toBe('access');
    const refresh = service.createRefreshToken('user');

    expect(jwt.sign).toHaveBeenNthCalledWith(
      1,
      { sub: 'user', type: 'access' },
      { expiresIn: '15m' },
    );
    expect(jwt.sign).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        sub: 'user',
        type: 'refresh',
        jti: refresh.jti,
      }),
      { expiresIn: '30d' },
    );
    expect(refresh.jti).toBeTruthy();
  });

  it('accepts only refresh tokens with a jti', () => {
    jwt.verify.mockReturnValue({
      sub: 'user',
      type: 'refresh',
      jti: 'session',
    });
    expect(service.verifyRefreshToken('refresh')).toMatchObject({
      sub: 'user',
      type: 'refresh',
      jti: 'session',
    });

    for (const payload of [
      { sub: 'user', type: 'access' },
      { sub: 'user', type: 'refresh' },
      { sub: 'user' },
    ]) {
      jwt.verify.mockReturnValue(payload);
      expect(() => service.verifyRefreshToken('token')).toThrow(
        UnauthorizedException,
      );
    }
  });

  it('accepts only access tokens for protected transports', () => {
    jwt.verify.mockReturnValue({ sub: 'user', type: 'access' });
    expect(service.verifyAccessToken('access')).toMatchObject({
      sub: 'user',
      type: 'access',
    });

    jwt.verify.mockReturnValue({
      sub: 'user',
      type: 'refresh',
      jti: 'session',
    });
    expect(() => service.verifyAccessToken('refresh')).toThrow(
      UnauthorizedException,
    );
  });
});
