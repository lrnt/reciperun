import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { logger } from "hono/logger";

import { auth } from "@reciperun/auth";
import { db, sql } from "@reciperun/db";
import { appRouter, createTRPCContext } from "@reciperun/trpc";

export const app = new Hono();

// Middleware
app.use("*", logger());

// Health check endpoint
app.get("/api", async (c) => {
  await db.execute(sql`SELECT 1`);
  return c.text("OK");
});

// Auth handler
app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

// tRPC handler
app.use(
  "/api/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext: (c) => {
      return createTRPCContext({
        headers: c.req.headers,
      });
    },
  }),
);