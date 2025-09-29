import Bun from 'bun';
import { jwt } from 'hono/jwt';

const secret = Bun.env.JWT_SECRET as string;

export const jwtMiddleware = jwt({ secret });
