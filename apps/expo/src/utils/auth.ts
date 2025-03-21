import type { BetterAuthClientPlugin } from "better-auth";
import * as SecureStore from "expo-secure-store";
import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";

import { getBaseUrl } from "./base-url";

export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
  plugins: [
    expoClient({
      scheme: "reciperun",
      storage: SecureStore,
    }) as unknown as BetterAuthClientPlugin,
  ],
});

export const { signIn, signOut } = authClient;
