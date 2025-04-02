import type { Result } from "../../utils/try-catch";
import type { AnnotatedRecipe } from "../schemas";
import { failure, success } from "../../utils/try-catch";
import { annotateRecipe } from "./annotate";
import { scrapeInstagram } from "./instagram";
import { scrapeJsonLd } from "./json-ld";
import { scrapeWithStagehand } from "./stagehand";

/**
 * Main entry point for recipe scraping
 * Orchestrates the scraping process based on URL type
 *
 * Process:
 * 1. Determine how to scrape based on URL
 *    a) Instagram? Use Instagram-specific scraper
 *    b) Try JSON-LD scraping first
 *    c) If JSON-LD fails, try Stagehand approach
 * 2. Once basic recipe is scraped, annotate it
 *
 * @param url The URL to fetch the recipe from
 * @returns Result with annotated recipe data or error
 */

export async function fetchRecipeFromUrl(
  url: string,
): Promise<Result<AnnotatedRecipe>> {
  let basicRecipeResult;

  const scrapers = [
    scrapeInstagram,
    scrapeJsonLd,
    scrapeWithStagehand,
  ];

  for (const scraper of scrapers) {
    basicRecipeResult = await scraper(url);

    if (basicRecipeResult.data !== null) {
      break;
    }
  }

  if (!basicRecipeResult) {
    return failure(new Error("Not a single scraper scraped?"));
  }

  if (basicRecipeResult.error) {
    console.error("Failed to extract recipe data:", basicRecipeResult.error);
    return failure(basicRecipeResult.error);
  }

  const annotatedRecipeResult = await annotateRecipe(basicRecipeResult.data);

  if (annotatedRecipeResult.error) {
    console.error("Failed to annotate recipe:", annotatedRecipeResult.error);
    return failure(annotatedRecipeResult.error);
  }

  return success(annotatedRecipeResult.data);
}
