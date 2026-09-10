/// <reference types="jest" />
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { ChatMessagesQueryDto } from './chat/dto/chat-messages-query.dto';
import {
  ChatEditDto,
  ChatReactionDto,
  ChatReadDto,
} from './chat/dto/ws-chat.dto';
import { isAllowedOrigin } from './config/origin';
import { MoveTaskDto } from './tasks/dto/move-task.dto';

async function isValid(value: object) {
  return (await validate(value)).length === 0;
}

describe('input validation', () => {
  const originalFrontendUrl = process.env.FRONTEND_URL;

  afterEach(() => {
    if (originalFrontendUrl === undefined) delete process.env.FRONTEND_URL;
    else process.env.FRONTEND_URL = originalFrontendUrl;
  });

  it('bounds chat cursor pagination', async () => {
    expect(
      await isValid(plainToInstance(ChatMessagesQueryDto, { limit: '100' })),
    ).toBe(true);
    expect(
      await isValid(plainToInstance(ChatMessagesQueryDto, { limit: '101' })),
    ).toBe(false);
    expect(
      await isValid(plainToInstance(ChatMessagesQueryDto, { limit: '0' })),
    ).toBe(false);
  });

  it('requires finite bounded task move order', async () => {
    expect(
      await isValid(
        plainToInstance(MoveTaskDto, { columnId: 'column', order: '1' }),
      ),
    ).toBe(true);
    expect(
      await isValid(
        plainToInstance(MoveTaskDto, { columnId: 'column', order: -1 }),
      ),
    ).toBe(false);
    expect(
      await isValid(
        plainToInstance(MoveTaskDto, { columnId: 'column', order: 'Infinity' }),
      ),
    ).toBe(false);
  });

  it('validates nested WebSocket payloads and read batch size', async () => {
    expect(
      await isValid(
        plainToInstance(ChatEditDto, {
          messageId: 'message',
          dto: { content: 'text' },
        }),
      ),
    ).toBe(true);
    expect(
      await isValid(
        plainToInstance(ChatReactionDto, {
          messageId: 'message',
          dto: { emoji: 42 },
        }),
      ),
    ).toBe(false);
    expect(
      await isValid(
        plainToInstance(ChatReadDto, {
          messageIds: Array(101).fill('message'),
        }),
      ),
    ).toBe(false);
  });

  it('allows only configured browser origins', () => {
    process.env.FRONTEND_URL =
      'https://app.example.test, https://www.example.test';

    expect(isAllowedOrigin('https://app.example.test')).toBe(true);
    expect(isAllowedOrigin('https://other.example.test')).toBe(false);
    expect(isAllowedOrigin(undefined)).toBe(true);
  });
});
