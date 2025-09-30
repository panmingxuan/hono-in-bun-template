/** biome-ignore-all lint/performance/noNamespaceImport: <explanation> */
import type { RouteConfig, RouteHandler } from '@hono/zod-openapi';
import * as HttpStatusCodes from 'stoker/http-status-codes';
import db from '@/db';
import { items } from '@/db/schema';
import type { CreateRoute, ListRoute } from './item.routes';

export type AppRouteHandler<R extends RouteConfig> = RouteHandler<R>;

export const list: AppRouteHandler<ListRoute> = async (ctx) => {
  const itemList = await db.query.items.findMany();

  return ctx.json(itemList, HttpStatusCodes.OK);
};

export const create: AppRouteHandler<CreateRoute> = async (ctx) => {
  const item = ctx.req.valid('json');
  const [inserted] = await db.insert(items).values(item).returning();

  return ctx.json(inserted, HttpStatusCodes.OK);
};
