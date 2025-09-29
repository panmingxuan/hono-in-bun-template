import { createRoute, z } from '@hono/zod-openapi';
// biome-ignore lint/performance/noNamespaceImport: <explanation>
import * as HttpStatusCodes from 'stoker/http-status-codes';
import { jsonContent } from 'stoker/openapi/helpers';
import type { z as z4 } from 'zod/v4';

export type ItmeScheme = {
  id: string;
  name: string;
  payload: string;
  sort: number;
};

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

const routePrefix = '/item';

const tags = [`${routePrefix} (物料)`];

export const list = createRoute({
  summary: '获取物料列表',
  path: routePrefix,
  method: 'get',
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(item[0] as unknown as z.ZodType<z4.infer<ItmeScheme>>),
      '一个物料列表'
    ),
  },
});

export type ListRoute = typeof list;
