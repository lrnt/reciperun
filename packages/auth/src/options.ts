import type { BetterAuthOptions, ClientOptions } from "better-auth";
import { db } from "@reciperun/db";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { passkeyClient, usernameClient } from "better-auth/client/plugins";
import { username } from "better-auth/plugins/username";
import { passkey } from "better-auth/plugins/passkey";

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
  ],
  advanced: {
    generateId: false,
  },
};

export const authClientOptions: ClientOptions = {
  baseURL: env.BASE_URL,
  plugins: [usernameClient(), passkeyClient()],
};
