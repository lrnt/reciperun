import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { trpcServer } from '@hono/trpc-server';
import { auth } from '@reciperun/auth';
import { handle } from '@hono/node-server/vercel'

import { appRouter, createTRPCContext } from '@reciperun/trpc';
import { db, sql } from '@reciperun/db';

const app = new Hono();

// Middleware
app.use('*', logger());

// Health check endpoint
app.get('/api', async (c) => {
  await db.execute(sql`SELECT 1`);
  return c.text('OK');
});

// Auth handler
app.on(["POST", "GET"], "/api/auth/*", (c) => {
	return auth.handler(c.req.raw);
});

// tRPC handler
app.use('/api/trpc/*', trpcServer({
  router: appRouter,
  createContext: (c) => {
    return createTRPCContext({
      headers: c.req.headers,
    });
  },
}));

const handler = handle(app);

//serve(app);

export const runtime = 'nodejs'
export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const OPTIONS = handler;