/** biome-ignore-all lint/performance/noNamespaceImport: <explanation> */
import { OpenAPIHono } from '@hono/zod-openapi';
import * as routes from './item.routes';
import * as handlers from './itme.handlers';

const router = new OpenAPIHono()
  .openapi(routes.list, handlers.list)
  .openapi(routes.create, handlers.create);

export default router;
