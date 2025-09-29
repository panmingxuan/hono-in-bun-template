import type { OpenAPIHono, RouteConfig, RouteHandler } from '@hono/zod-openapi';
import type { Schema } from 'hono';
import type { JwtVariables } from 'hono/jwt';
import type { RequestIdVariables } from 'hono/request-id';

export type AppBindings = {
  // biome-ignore lint/style/useNamingConvention: <explanation>
  Variables: RequestIdVariables & JwtVariables;
};

// biome-ignore lint/style/useNamingConvention: <explanation>
// biome-ignore lint/complexity/noBannedTypes: <explanation>
export type AppOpenAPI<S extends Schema = {}> = OpenAPIHono<AppBindings, S>;

export type AppRouteHandler<R extends RouteConfig> = RouteHandler<
  R,
  AppBindings
>;
