import type { Config } from "drizzle-kit";

export default {
  schema: "./src/schema.ts",
  dialect: "sqlite",
  casing: "snake_case",
} satisfies Config;
