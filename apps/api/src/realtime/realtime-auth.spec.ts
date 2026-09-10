/// <reference types="jest" />
import { JwtService } from '@nestjs/jwt';
import type { Socket } from 'socket.io';

import { ChatService } from '../chat/chat.service';
import { PushService } from '../push/push.service';
import { RelationshipService } from '../relationship/relationship.service';

import { RealtimeGateway } from './realtime.gateway';
import { RealtimeService } from './realtime.service';

describe('RealtimeGateway token access', () => {
  const jwt = { verify: jest.fn() };
  const relationship = { getCurrentCouple: jest.fn() };
  const gateway = new RealtimeGateway(
    {} as PushService,
    jwt as unknown as JwtService,
    {} as RealtimeService,
    relationship as unknown as RelationshipService,
    {} as ChatService,
  );

  function socket() {
    const disconnect = jest.fn();
    const join = jest.fn();
    const use = jest.fn();
    const once = jest.fn();
    return {
      handshake: { auth: { token: 'token' } },
      data: {},
      disconnect,
      join,
      use,
      once,
      emit: jest.fn(),
    } as unknown as Socket;
  }

  beforeEach(() => {
    jest.resetAllMocks();
    relationship.getCurrentCouple.mockResolvedValue(null);
  });

  it('rejects refresh and legacy tokens during the WebSocket handshake', async () => {
    for (const payload of [
      { sub: 'user', type: 'refresh', jti: 'session', exp: 9999999999 },
      { sub: 'user', exp: 9999999999 },
    ]) {
      jwt.verify.mockReturnValue(payload);
      const client = socket();
      await gateway.handleConnection(client);
      expect(client.disconnect).toHaveBeenCalled();
      expect(client.join).not.toHaveBeenCalled();
    }
  });

  it('accepts access token and blocks packets after its expiry', async () => {
    jwt.verify.mockReturnValue({
      sub: 'user',
      type: 'access',
      exp: Math.floor(Date.now() / 1000) + 60,
    });
    const client = socket();

    await gateway.handleConnection(client);
    expect(client.join).toHaveBeenCalledWith('user:user');
    expect(client.use).toHaveBeenCalled();

    const middleware = (client.use as jest.Mock).mock.calls[0]?.[0] as (
      event: unknown,
      next: (error?: Error) => void,
    ) => void;
    client.data.accessTokenExpiresAt = 0;
    const next = jest.fn();
    middleware([], next);

    expect(client.disconnect).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
