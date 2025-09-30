import { createRoute, z } from '@hono/zod-openapi';
// biome-ignore lint/performance/noNamespaceImport: <explanation>
import * as HttpStatusCodes from 'stoker/http-status-codes';
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers';
import { insertItemSchema, selectItemSchema } from '@/db/schema';

export const respErr = z
  .object({
    message: z.string().describe('错误信息'),
  })
  .describe('错误响应');

// type RespErr = z.infer<typeof respErr>;

const routePrefix = '/item';

const tags = [`${routePrefix} (物料)`];

/** 查询物料列表 */
export const list = createRoute({
  summary: '获取物料列表',
  path: routePrefix,
  method: 'get',
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(selectItemSchema),
      '一个物料列表'
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      respErr,
      '查询参数验证错误'
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      respErr,
      '服务器内部错误'
    ),
  },
});

/** 新增新的物料 */
export const create = createRoute({
  summary: '新增物料',
  path: routePrefix,
  method: 'post',
  tags,
  request: {
    body: jsonContentRequired(insertItemSchema, '创建好的物料'),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(selectItemSchema, '新增物料成功'),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      respErr,
      '数据校验失败'
    ),
    [HttpStatusCodes.CONFLICT]: jsonContent(respErr, 'sort已存在'),
  },
});

export type ListRoute = typeof list;
export type CreateRoute = typeof create;
