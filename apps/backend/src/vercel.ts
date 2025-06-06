import { handle } from "hono/vercel";

import { app } from "./index";

export const runtime = "nodejs";
export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const PUT = handle(app);
export const OPTIONS = handle(app);
