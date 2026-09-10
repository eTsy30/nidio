/// <reference types="jest" />
import { Logger } from '@nestjs/common';

import { TasksService } from './tasks.service';

describe('Task cleanup lifecycle', () => {
  it('handles database errors on startup and retries on the next interval', async () => {
    jest.useFakeTimers();
    const log = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const deleteMany = jest
      .fn()
      .mockRejectedValueOnce(new Error('public.Task does not exist'))
      .mockResolvedValue({ count: 0 });
    const service = new TasksService(
      { task: { deleteMany } } as never,
      {} as never,
      {} as never,
    );
    try {
      service.onModuleInit();
      await jest.advanceTimersByTimeAsync(0);
      expect(log).toHaveBeenCalledWith(
        expect.stringContaining('cleanup failed'),
        expect.stringContaining('public.Task'),
      );
      await jest.advanceTimersByTimeAsync(24 * 60 * 60 * 1000);
      expect(deleteMany).toHaveBeenCalledTimes(2);
      service.onModuleDestroy();
      await jest.advanceTimersByTimeAsync(24 * 60 * 60 * 1000);
      expect(deleteMany).toHaveBeenCalledTimes(2);
    } finally {
      service.onModuleDestroy();
      log.mockRestore();
      jest.useRealTimers();
    }
  });
});
