import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

import * as authSchema from "./schema/auth";
import * as recipesSchema from "./schema/recipes";

if (!process.env.POSTGRES_URL) {
  throw new Error("Missing POSTGRES_URL");
}

export const db = drizzle({
  connection: process.env.POSTGRES_URL,
  ws: ws,
  schema: {
    ...authSchema,
    ...recipesSchema,
  },
});
