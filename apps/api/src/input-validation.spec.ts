/// <reference types="jest" />
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

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

  it('allows only configured browser origins', () => {
    process.env.FRONTEND_URL =
      'https://app.example.test, https://www.example.test';

    expect(isAllowedOrigin('https://app.example.test')).toBe(true);
    expect(isAllowedOrigin('https://other.example.test')).toBe(false);
    expect(isAllowedOrigin(undefined)).toBe(true);
  });
});
