import type { BetterAuthOptions, ClientOptions } from "better-auth";
import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { passkeyClient, usernameClient } from "better-auth/client/plugins";

import { db } from "@reciperun/db";

import { env } from "./env";

export const authOptions: BetterAuthOptions = {
  secret: env.AUTH_SECRET,
  baseURL: env.BASE_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [expo()],
  advanced: {
    generateId: false,
  },
  trustedOrigins: ["reciperun://"],
};

export const authClientOptions: ClientOptions = {
  baseURL: env.BASE_URL,
  plugins: [usernameClient(), passkeyClient()],
};

export const auth = betterAuth(authOptions);
