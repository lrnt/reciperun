import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { trpcServer } from '@hono/trpc-server';
import type { D1Database } from '@cloudflare/workers-types';

import { appRouter, createTRPCContext } from '@reciperun/trpc';

interface Env {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', logger());

// Health check endpoint
app.get('/', (c) => c.text('RecipeRun API is running'));

// tRPC handler
app.use('/api/trpc/*', trpcServer({
  router: appRouter,
  createContext: (c) => {
    return createTRPCContext({
      headers: c.req.headers,
      session: null,
    });
  },
}));

export default app;