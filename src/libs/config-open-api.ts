import { Scalar } from '@scalar/hono-api-reference';
import env from '@/env';

import packageJson from '../../package.json' with { type: 'json' };
import type { AppOpenAPI } from './types';

// 挂载OPENAPI路由
export const configureOpenApi = (app: AppOpenAPI) => {
  // 挂载openapi
  app.doc31('/doc', {
    openapi: '3.1.0',
    info: {
      title: `${env.APP_NAME} API`,
      version: packageJson.version,
      description: `${env.APP_NAME} Powered by Hono`,
    },
  });
  // 挂载Scalar 方便在线调试
  app.get(
    '/reference',
    Scalar({
      url: '/doc',
      theme: 'kepler',
      layout: 'modern',
      defaultHttpClient: {
        targetKey: 'js',
        clientKey: 'fetch',
      },
    })
  );
};
