import type { RouteConfig, RouteHandler } from '@hono/zod-openapi';
import type { ItmeScheme, ListRoute } from './item.routes';

const item: ItmeScheme[] = [
  {
    id: '1',
    name: 'test1',
    payload: '111111',
    sort: 1,
  },
  {
    id: '2',
    name: 'test1',
    payload: '222222',
    sort: 2,
  },
  {
    id: '3',
    name: 'test1',
    payload: '33333',
    sort: 3,
  },
];

export type AppRouteHandler<R extends RouteConfig> = RouteHandler<R>;

export const list: AppRouteHandler<ListRoute> = (ctx) => ctx.json(item);
