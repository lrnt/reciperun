import { createTRPCRouter } from "./trpc";
import { authRouter } from "./router/auth";
import { recipesRouter } from "./router/recipes";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  recipes: recipesRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
