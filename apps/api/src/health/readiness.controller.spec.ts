import { PrismaService } from '../prisma/prisma.service';

import { ReadinessController } from './readiness.controller';

describe('readiness deadline', () => {
  afterEach(() => jest.useRealTimers());
  it('bounds responses and coalesces probes while the database is stuck', async () => {
    jest.useFakeTimers();
    let finish!: () => void;
    const database = {
      $transaction: jest.fn(
        () =>
          new Promise<void>((resolve) => {
            finish = resolve;
          }),
      ),
    };
    const controller = new ReadinessController(
      database as unknown as PrismaService,
    );
    const first = expect(controller.ready()).rejects.toMatchObject({
      status: 503,
    });
    const second = expect(controller.ready()).rejects.toMatchObject({
      status: 503,
    });
    await jest.advanceTimersByTimeAsync(2000);
    await Promise.all([first, second]);
    expect(database.$transaction).toHaveBeenCalledTimes(1);
    finish();
    await Promise.resolve();
    database.$transaction.mockImplementation(() => Promise.resolve());
    await expect(controller.ready()).resolves.toEqual({
      status: 'ok',
      database: 'ok',
    });
  });
});
