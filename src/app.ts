import { configureOpenApi } from '@/libs/config-open-api';
import item from '@/routes/item';
import createApp from './libs/create-app';

const app = createApp();

// 配置OpenApi
configureOpenApi(app);

const routes = [item];

// 挂载路由
for (const route of routes) {
  app.route('/', route);
}

export default app;
