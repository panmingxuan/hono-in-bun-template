import { OpenAPIHono } from '@hono/zod-openapi';
import { requestId } from 'hono/request-id';
import { notFound, onError, serveEmojiFavicon } from 'stoker/middlewares';
import { defaultHook } from 'stoker/openapi';
import { requstLogger } from '@/middlewares/request-logger';
import { setHeaders } from '@/middlewares/set-headers';
import type { AppBindings } from './types';

export function createRouter() {
  return new OpenAPIHono<AppBindings>({
    defaultHook,
  });
}

export default function createApp() {
  const app = createRouter();
  app
    .use(requestId())
    // .use('*', requstLogger)
    .use(serveEmojiFavicon('🔥'))
    .use('*', setHeaders);
  app.onError(onError);
  app.notFound(notFound);

  return app;
}
