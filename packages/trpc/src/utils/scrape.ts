import { createAnthropic } from "@ai-sdk/anthropic";

import type { Failure, Result, Success } from "./try-catch";
import { recipeSchema } from "../router/recipes";

/**
 * Utilities for fetching and processing JSON-LD data
 */

// Define types for JSON-LD data
export interface JsonLdEntity {
  "@type"?: string | string[];
  "@graph"?: JsonLdEntity[];
  [key: string]: unknown;
}

/**
 * Create a successful Result
 */
export function success<T>(data: T): Success<T> {
  return { data, error: null };
}

/**
 * Create a failure Result
 */
export function failure<E>(error: E): Failure<E> {
  return { data: null, error };
}

/**
 * Checks if a JSON-LD entity represents a recipe
 */
export function isRecipe(entity: JsonLdEntity): boolean {
  const entityType = entity["@type"];

  if (typeof entityType === "string") {
    return entityType === "Recipe";
  }

  if (Array.isArray(entityType)) {
    return entityType.includes("Recipe");
  }

  return false;
}

/**
 * Fetches JSON-LD data from a URL
 * @param url The URL to fetch JSON-LD data from
 * @returns Result with JSON-LD data or error
 */
export async function fetchJsonLdFromUrl(
  url: string,
): Promise<Result<JsonLdEntity[]>> {
  try {
    console.log(`Attempting to fetch JSON-LD from URL: ${url}`);

    // Fetch the webpage content
    const response = await fetch(url);

    if (!response.ok) {
      const errorMessage = `Failed to fetch URL: ${response.status} ${response.statusText}`;
      console.error(errorMessage);
      return failure(new Error(errorMessage));
    }

    const html = await response.text();

    // Look for JSON-LD data in the page
    const jsonLdRegex =
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    const matches = [...html.matchAll(jsonLdRegex)];

    if (matches.length === 0) {
      console.log("No JSON-LD data found on the page");
      return failure(new Error("No JSON-LD data found on the page"));
    }

    console.log("JSON-LD data found");

    // Parse all JSON-LD blocks
    const entities: JsonLdEntity[] = [];

    for (const match of matches) {
      try {
        const jsonContent = match[1];
        if (!jsonContent) continue;

        const jsonData = JSON.parse(jsonContent) as JsonLdEntity;
        entities.push(jsonData);
      } catch (parseError) {
        console.error("Error parsing JSON-LD:", parseError);
        // Continue with other blocks
      }
    }

    if (entities.length === 0) {
      return failure(new Error("Failed to parse any valid JSON-LD data"));
    }

    return success(entities);
  } catch (error) {
    console.error("Error fetching JSON-LD:", error);
    return failure(
      error instanceof Error
        ? error
        : new Error("Unknown error fetching JSON-LD"),
    );
  }
}

/**
 * Extracts recipe data from JSON-LD entities
 * @param entities Array of JSON-LD entities to search for recipes
 * @param url The original URL of the page
 * @returns Result with recipe data or error
 */
export function extractRecipeFromJsonLd(
  entities: JsonLdEntity[],
): Result<JsonLdEntity> {
  if (!entities.length) {
    return failure(new Error("No JSON-LD entities provided"));
  }

  // First check for direct recipe types
  for (const entity of entities) {
    if (isRecipe(entity)) {
      console.log(
        "Recipe JSON-LD data found:",
        JSON.stringify(entity, null, 2),
      );
      return success(entity);
    }
  }

  // Then check @graph properties
  for (const entity of entities) {
    if (!entity["@graph"] || !Array.isArray(entity["@graph"])) continue;

    for (const graphItem of entity["@graph"]) {
      if (isRecipe(graphItem)) {
        console.log(
          "Recipe JSON-LD data found in @graph:",
          JSON.stringify(graphItem, null, 2),
        );
        return success(graphItem);
      }
    }
  }

  console.log("No recipe found in JSON-LD data");
  return failure(new Error("No recipe found in JSON-LD data"));
}

/**
 * Fetches a recipe from a URL by extracting JSON-LD data
 * @param url The URL to fetch the recipe from
 * @returns Result with recipe data or error
 */
export async function fetchRecipeFromUrl(url: string) {
  // Step 1: Fetch JSON-LD data from the URL
  const jsonLdResult = await fetchJsonLdFromUrl(url);

  // If fetching failed, return early with the error
  if (jsonLdResult.error) {
    return failure(jsonLdResult.error);
  }

  // Step 2: Extract recipe from the JSON-LD data
  const jsonLdRecipe = extractRecipeFromJsonLd(jsonLdResult.data);

  if (jsonLdRecipe.error) {
    return failure(jsonLdRecipe.error);
  }

  // Step 3: Normalize the JSON-LD recipe to our application's schema
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
