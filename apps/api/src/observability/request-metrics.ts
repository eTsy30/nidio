import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

const logger = new Logger('HttpMetrics');
export function requestMetrics(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const started = performance.now();
  res.once('finish', () => {
    const durationMs = Math.round(performance.now() - started);
    if (
      process.env.HTTP_METRICS !== '1' &&
      res.statusCode < 500 &&
      durationMs < 1000
    )
      return;
    // Route templates only: never log tokens, query parameters or user IDs.
    const route =
      typeof req.route?.path === 'string' ? req.route.path : 'unmatched';
    const record = {
      event: 'http_request',
      route,
      method: req.method,
      status: res.statusCode,
      durationMs,
    };
    if (res.statusCode >= 500) logger.error(record);
    else logger.log(record);
  });
  next();
}
