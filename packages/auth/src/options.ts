import type { BetterAuthOptions, ClientOptions } from "better-auth";
import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { passkeyClient, usernameClient } from "better-auth/client/plugins";
import { passkey } from "better-auth/plugins/passkey";
import { username } from "better-auth/plugins/username";

import { db } from "@reciperun/db";

import { env } from "./env";

export const authOptions: BetterAuthOptions = {
  secret: env.AUTH_SECRET,
  baseURL: env.BASE_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  plugins: [
    username({
      minUsernameLength: 5,
      maxUsernameLength: 32,
    }),
    passkey({
      rpID: env.BASE_URL,
      rpName: "reciperun",
      origin: env.BASE_URL,
    }),
    expo(),
  ],
  advanced: {
    generateId: false,
  },
};

export const authClientOptions: ClientOptions = {
  baseURL: env.BASE_URL,
  plugins: [usernameClient(), passkeyClient()],
};

export const auth = betterAuth(authOptions);
