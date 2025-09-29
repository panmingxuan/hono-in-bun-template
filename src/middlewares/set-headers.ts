import type { Context, Next } from 'hono';

export const setHeaders = async (ctx: Context, next: Next) => {
  await next();
  ctx.header('X-Powered-By', 'hono');
  ctx.header('X-App-Id', 'hono-in-bun');
  ctx.header('X-Add-123123', 'hhh');
};
