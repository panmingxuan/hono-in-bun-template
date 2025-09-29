/** biome-ignore-all lint/style/useNamingConvention: <explanation> */
/** biome-ignore-all lint/suspicious/noConsole: <explanation> */
import path from 'node:path';
import { config } from 'dotenv';
import { expand } from 'dotenv-expand';
import { z } from 'zod';

const MAX_PORT = 33_899;
const DEFAULT_PORT = 3001;

// 导入环境变量
expand(
  config({
    path: path.resolve(
      process.cwd(),
      process.env.NODE_ENV === 'test' ? '.env.test' : '.env'
    ),
  })
);

const EnvSchema = z.object({
  // 当前运行环境
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  // 服务端口号
  PORT: z.coerce.number().int().min(1).max(MAX_PORT).default(DEFAULT_PORT),
  // 日志级别
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  // 服务名称
  APP_NAME: z.string().default('Hono App'),
  JWT_SECRET: z.string(),
});

export type Env = z.infer<typeof EnvSchema>;

const { data: env, error } = EnvSchema.safeParse(process.env);
if (error) {
  console.error('❌ 环境变量错误！');
  console.error(JSON.stringify(error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

// biome-ignore lint/style/noNonNullAssertion: <explanation>
export default env!;
