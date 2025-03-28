import { createAnthropic } from "@ai-sdk/anthropic";

import type { JsonLdEntity } from "./json-ld";
import { recipeSchema } from "../router/recipes";
import {
  extractRecipeFromJsonLd,
  fetchJsonLdFromUrl as fetchJsonLdFromHtml,
} from "./json-ld";
import { failure, success } from "./try-catch";

/**
 * Fetches a recipe from a URL by extracting JSON-LD data
 * @param url The URL to fetch the recipe from
 * @returns Result with recipe data or error
 */
export async function fetchRecipeFromUrl(url: string) {
  // Step 1: Fetch the webpage content
  const response = await fetch(url);

  if (!response.ok) {
    const errorMessage = `Failed to fetch URL: ${response.status} ${response.statusText}`;
    console.error(errorMessage);
    return failure(new Error(errorMessage));
  }

  const html = await response.text();

  // Step 2: Fetch JSON-LD data from the URL
  const jsonLdResult = fetchJsonLdFromHtml(html);

  // If fetching failed, return early with the error
  if (jsonLdResult.error) {
    return failure(jsonLdResult.error);
  }

  // Step 3: Extract recipe from the JSON-LD data
  const jsonLdRecipe = extractRecipeFromJsonLd(jsonLdResult.data);

  if (jsonLdRecipe.error) {
    return failure(jsonLdRecipe.error);
  }

  // Step 4: Normalize the JSON-LD recipe to our application's schema
  const normalizedRecipe = await normalizeJsonLdRecipe(jsonLdRecipe.data, url);

  if (normalizedRecipe.error) {
    return failure(normalizedRecipe.error);
  }

  return success(normalizedRecipe.data);
}

/**
 * Normalizes a JSON-LD recipe to our application's recipe schema using AI
 * @param recipe The JSON-LD recipe entity to normalize
 * @returns Result with normalized recipe data or error
 */
export async function normalizeJsonLdRecipe(recipe: JsonLdEntity, url: string) {
  try {
    console.log("Normalizing JSON-LD recipe with AI...");
    const { generateObject } = await import("ai");

    // Define the prompt for the AI model
    const prompt = `
You're an expert at parsing recipe data from websites. I'll give you a JSON-LD recipe object extracted from a website, and you need to normalize it to our application's schema.

Here's the JSON-LD recipe:
${JSON.stringify(recipe, null, 2)}

Important:
- For ingredients, separate the actual name from quantities/units/preparations
- For instruction steps, identify which ingredients from the ingredients list are used
- Set reasonable prep and cook times if not explicitly provided
- For the id field, generate a random alphanumeric string
- Use the current date for createdAt and updatedAt
- Don't include annotations if you're not confident about the ingredient references
- The page URL is: ${url}
`;
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("Missing ANTHROPIC_API_KEY");
    }

    const anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Use the Vercel AI SDK to generate the structured recipe
    const normalizedRecipe = await generateObject({
      model: anthropic("claude-3-5-sonnet-20240620"),
      schema: recipeSchema,
      prompt,
    });

    // Convert date strings to Date objects
    const finalRecipe = {
      ...normalizedRecipe,
      //createdAt: new Date(normalizedRecipe.createdAt),
      //updatedAt: new Date(normalizedRecipe.updatedAt),
    };

    console.log("Final recipe:", finalRecipe.object);

    return success(finalRecipe.object);
  } catch (error) {
    console.error("Error normalizing recipe with AI:", error);
    return failure(
      error instanceof Error
        ? error
        : new Error("Unknown error normalizing recipe with AI"),
    );
  }
}
