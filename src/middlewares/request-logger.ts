import type { Context, Next } from 'hono';
import logger from '@/libs/logger';

export const requstLogger = async (ctx: Context, next: Next) => {
  const started = performance.now();
  try {
    await next();
  } finally {
    const duration = +(performance.now() - started).toFixed(2);
    logger.info({
      requestId: ctx.get('requestId'),
      method: ctx.req.method,
      path: ctx.req.path,
      status: ctx.res.status,
      durationMs: duration,
    });
  }
};
