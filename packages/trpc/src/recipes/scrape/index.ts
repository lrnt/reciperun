import type { Result } from "../../utils/try-catch";
import type { AnnotatedRecipe, BasicRecipe } from "../schemas";
import { failure, success } from "../../utils/try-catch";
import { annotateRecipe } from "./annotate";
import { scrapeInstagram } from "./instagram";
import { scrapeJsonLd } from "./json-ld";
import { scrapeWithStagehand } from "./stagehand";

// A URL pattern matcher for Instagram URLs
const INSTAGRAM_URL_PATTERN = /^https?:\/\/(www\.)?instagram\.com/i;

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
  try {
    console.log(`Fetching recipe from: ${url}`);
    // Step 2: Extract basic recipe data based on URL type
    let basicRecipeResult: Result<BasicRecipe>;

    // 2.a) Known URL format (e.g., Instagram)
    if (INSTAGRAM_URL_PATTERN.test(url)) {
      console.log("Detected Instagram URL, using Instagram scraper");
      basicRecipeResult = await scrapeInstagram(url);
    }
    // 2.b) Try JSON-LD extraction first
    else {
      console.log("Trying JSON-LD scraping");
      basicRecipeResult = await scrapeJsonLd(url);

      // 2.c) If JSON-LD fails, try Stagehand approach
      if (basicRecipeResult.error) {
        console.log("JSON-LD scraping failed, trying Stagehand");
        basicRecipeResult = await scrapeWithStagehand(url);
      }
    }

    // Step 3: If we failed to extract basic recipe data, return error
    if (basicRecipeResult.error) {
      console.error("Failed to extract recipe data:", basicRecipeResult.error);
      return failure(basicRecipeResult.error);
    }

    console.log("Successfully extracted basic recipe data");

    // Step 4: Annotate the basic recipe using AI
    const annotatedRecipeResult = await annotateRecipe(basicRecipeResult.data);

    if (annotatedRecipeResult.error) {
      console.error("Failed to annotate recipe:", annotatedRecipeResult.error);
      return failure(annotatedRecipeResult.error);
    }

    return success(annotatedRecipeResult.data);
  } catch (error) {
    console.error("Error fetching recipe:", error);
    return failure(
      error instanceof Error
        ? error
        : new Error("Unknown error fetching recipe"),
    );
  }
}
