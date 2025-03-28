import { createTRPCRouter } from "./trpc";
import { authRouter } from "./auth/router";
import { recipesRouter } from "./recipes/router";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  recipes: recipesRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
