/// <reference types="jest" />
import type { Response } from 'express';

import { AuthController } from './auth.controller';

describe('AuthController contracts', () => {
  const authService = {
    login: jest.fn(),
    register: jest.fn(),
    refresh: jest.fn(),
  };
  const controller = new AuthController(authService as never);
  const response = {
    cookie: jest.fn(),
  } as unknown as Response;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns only the access token after login', async () => {
    authService.login.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    await expect(
      controller.login(
        { email: 'user@example.com', password: 'password' },
        response,
      ),
    ).resolves.toEqual({ accessToken: 'access-token' });
    expect(response.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'refresh-token',
      expect.objectContaining({ httpOnly: true, path: '/auth/refresh' }),
    );
  });
});
