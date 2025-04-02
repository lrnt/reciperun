import { Stagehand } from "@browserbasehq/stagehand";

import type { Result } from "../../utils/try-catch";
import type { BasicRecipe } from "../schemas";
import { tryCatch } from "../../utils/try-catch";
import { basicRecipeSchema } from "../schemas";

/**
 * Scrape recipe data using Browserbase Stagehand
 * This implementation is prepared for future integration with Stagehand
 * Currently returns a failure to be filled in with actual scraping later
 */
export async function scrapeWithStagehand(
  url: string,
): Promise<Result<BasicRecipe>> {
  const stagehand = new Stagehand({
    env: "BROWSERBASE",
    apiKey: process.env.BROWSERBASE_API_KEY,
    projectId: process.env.BROWSERBASE_PROJECT_ID,
    modelName: "claude-3-7-sonnet-latest",
    modelClientOptions: {
      apiKey: process.env.ANTHROPIC_API_KEY,
    },
    verbose: 1,
  });

  await stagehand.init();
  const page = stagehand.page;

  await page.goto(url, {
    timeout: 60000,
    waitUntil: "domcontentloaded"
  });

  const recipeResult = await tryCatch(
    page.extract({
      instruction: "Extract the recipe information from the page.",
      schema: basicRecipeSchema,
    }),
  );

  await stagehand.close();

  return recipeResult;
}
