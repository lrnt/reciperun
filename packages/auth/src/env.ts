import { createEnv } from "@t3-oss/env-core";

import { z } from "zod";

export const env = createEnv({
  server: {
    AUTH_SECRET: z.string(),
    BASE_URL: z.string(),
    ANYTHING_ELSE: z.string(),
  },
  runtimeEnv: process.env,
});
