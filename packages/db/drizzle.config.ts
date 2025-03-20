import type { Config } from "drizzle-kit";

if (!process.env.POSTGRES_URL) {
  throw new Error("Missing POSTGRES_URL");
}

export default {
  schema: "./src/schema/",
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: { url: process.env.POSTGRES_URL },
} satisfies Config;
