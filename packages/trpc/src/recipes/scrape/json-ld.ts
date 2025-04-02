import type { Result } from "../../utils/try-catch";
import type { BasicRecipe } from "../schemas";
import { failure, success, tryCatch } from "../../utils/try-catch";

/**
 * Utilities for working with JSON-LD data
 */

// Define types for JSON-LD data
export interface JsonLdEntity {
  "@type"?: string | string[];
  "@graph"?: JsonLdEntity[];
  "@context"?: unknown;
  [key: string]: unknown;
}

/**
 * Checks if a JSON-LD entity represents a recipe
 */
export function isJsonLdRecipe(entity: JsonLdEntity): boolean {
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
 * Extracts JSON-LD entities from HTML content
 *
 * @param html - The HTML content to search for JSON-LD scripts
 * @returns A Result containing an array of JSON-LD entities or an error
 */
export function extractJsonLdFromHtml(html: string): Result<JsonLdEntity[]> {
  try {
    // Extract JSON-LD script tags from HTML
    const jsonLdBlocks = extractJsonLdBlocks(html);

    if (jsonLdBlocks.length === 0) {
      console.log("No JSON-LD data found on the page");
      return failure(new Error("No JSON-LD data found on the page"));
    }

    console.log("JSON-LD data found");

    // Parse each JSON-LD block into an entity
    const entities = parseJsonLdBlocks(jsonLdBlocks);

    if (entities.length === 0) {
      return failure(new Error("Failed to parse any valid JSON-LD data"));
    }

    return success(entities);
  } catch (error) {
    console.error("Error extracting JSON-LD:", error);
    return failure(
      error instanceof Error
        ? error
        : new Error("Unknown error extracting JSON-LD"),
    );
  }
}

/**
 * Extracts JSON-LD script blocks from HTML content
 *
 * @param html - The HTML content to search for JSON-LD scripts
 * @returns An array of JSON-LD content strings
 */
function extractJsonLdBlocks(html: string): string[] {
  const jsonLdRegex =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const matches = [...html.matchAll(jsonLdRegex)];

  return matches.map((match) => match[1]).filter(Boolean) as string[];
}

/**
 * Parses JSON-LD content blocks into entity objects
 *
 * @param jsonLdBlocks - Array of JSON-LD content strings
 * @returns Array of successfully parsed JSON-LD entities
 */
function parseJsonLdBlocks(jsonLdBlocks: string[]): JsonLdEntity[] {
  return jsonLdBlocks
    .map(
      (jsonContent) =>
        tryCatch(() => JSON.parse(jsonContent) as JsonLdEntity).data,
    )
    .filter(Boolean) as JsonLdEntity[];
}

/**
 * Flattens JSON-LD entities by extracting any entities contained in @graph properties
 * and normalizing them into a single array of properly typed entities.
 *
 * @param entities - Array of JSON-LD entities that might contain nested @graph arrays
 * @returns Array of flattened JSON-LD entities with proper types
 */
export function flattenJsonLdEntities(
  entities: JsonLdEntity[],
): JsonLdEntity[] {
  if (!entities.length) {
    return [];
  }

  // Get valid top-level entities
  const topLevelEntities = entities.filter((entity) => entity["@type"]);

  // Get entities from @graph properties
  const graphEntities = entities.flatMap((entity) =>
    extractGraphEntities(entity),
  );

  // Combine both sets of entities
  return [...topLevelEntities, ...graphEntities];
}

/**
 * Helper function to extract entities from a @graph property
 * Returns an array of normalized entities from the graph
 */
function extractGraphEntities(entity: JsonLdEntity): JsonLdEntity[] {
  // Skip if no @graph property or not an array
  const graph = entity["@graph"];
  if (!graph || !Array.isArray(graph)) {
    return [];
  }

  // Filter valid entities and normalize them
  return graph.filter(isValidJsonLdEntity).map((graphItem) => ({
    ...graphItem,
    "@context": graphItem["@context"] ?? entity["@context"],
  }));
}

/**
 * Check if an object is a valid JSON-LD entity with a type
 */
function isValidJsonLdEntity(item: unknown): item is JsonLdEntity {
  return (
    item !== null &&
    typeof item === "object" &&
    "@type" in item &&
    item["@type"] !== undefined
  );
}

/**
 * Extract recipe entity from JSON-LD data, flattening graphs first
 */
export function findRecipeInJsonLd(
  entities: JsonLdEntity[],
): Result<JsonLdEntity> {
  if (!entities.length) {
    return failure(new Error("No JSON-LD entities provided"));
  }

  // Flatten all entities including those in @graph structures
  const flattenedEntities = flattenJsonLdEntities(entities);

  // Find the first recipe entity
  const recipeEntity = flattenedEntities.find(isJsonLdRecipe);

  if (recipeEntity) {
    console.log("Recipe JSON-LD data found");
    return success(recipeEntity);
  }

  console.log("No recipe found in JSON-LD data");
  return failure(new Error("No recipe found in JSON-LD data"));
}

/**
 * Convert a JSON-LD recipe entity to a basic recipe format
 */
export function convertJsonLdToBasicRecipe(
  recipe: JsonLdEntity,
): Result<BasicRecipe> {
  try {
    console.log("Converting JSON-LD recipe to basic format...");

    // Extract simple properties from JSON-LD
    const title = typeof recipe.name === "string" ? recipe.name : "";
    const description =
      typeof recipe.description === "string" ? recipe.description : "";

    // Handle image URL (could be a string or an object with url property)
    let imageUrl: string | undefined;
    if (typeof recipe.image === "string") {
      imageUrl = recipe.image;
    } else if (
      typeof recipe.image === "object" &&
      recipe.image !== null &&
      "url" in recipe.image &&
      typeof (recipe.image as { url: string }).url === "string"
    ) {
      imageUrl = (recipe.image as { url: string }).url;
    }

    // Parse cook time (PT1H30M format to minutes)
    let cookTime: number | undefined;
    if (typeof recipe.cookTime === "string") {
      const timeString = recipe.cookTime;
      cookTime = parseISO8601Duration(timeString);
    }

    // Get prep time or default to estimate
    let prepTime: number | undefined;
    if (typeof recipe.prepTime === "string") {
      const timeString = recipe.prepTime;
      prepTime = parseISO8601Duration(timeString);
    }

    // Extract ingredients as simple strings
    const ingredients: string[] = [];
    if (Array.isArray(recipe.recipeIngredient)) {
      recipe.recipeIngredient.forEach((ingredient) => {
        if (typeof ingredient === "string") {
          ingredients.push(ingredient);
        }
      });
    }

    // Extract instructions as simple strings
    const instructions: string[] = [];
    if (Array.isArray(recipe.recipeInstructions)) {
      recipe.recipeInstructions.forEach((instruction) => {
        // Case 1: Instruction is a simple string
        if (typeof instruction === "string") {
          instructions.push(instruction);
        }
        // Case 2: Instruction is an object with a text property that's a string
        else if (
          typeof instruction === "object" &&
          instruction !== null &&
          "text" in instruction &&
          typeof (instruction as { text: unknown }).text === "string"
        ) {
          instructions.push((instruction as { text: string }).text);
        }
        // Case 3: Instruction is an object with a text property that's an array of strings
        else if (
          typeof instruction === "object" &&
          instruction !== null &&
          "text" in instruction &&
          Array.isArray((instruction as { text: unknown }).text)
        ) {
          const textArray = (instruction as { text: unknown[] }).text;
          const combinedText = textArray
            .filter((item) => typeof item === "string")
            .join(" ");

          if (combinedText) {
            instructions.push(combinedText);
          }
        }
      });
    }

    // Parse servings
    let servings: number | undefined;
    if (typeof recipe.recipeYield === "string") {
      const regex = /\d+/;
      const match = regex.exec(recipe.recipeYield);
      if (match) {
        servings = parseInt(match[0], 10);
      }
    } else if (typeof recipe.recipeYield === "number") {
      servings = recipe.recipeYield;
    }

    // Create the basic recipe object
    const basicRecipe: BasicRecipe = {
      title: title || "Untitled Recipe",
      description: description || "",
      ingredients,
      instructions,
      prepTime,
      cookTime,
      // Use ternary to avoid nullish coalescing lint error
      servings: servings ?? 1,
      imageUrl,
    };

    return success(basicRecipe);
  } catch (error) {
    console.error("Error converting JSON-LD to basic recipe:", error);
    return failure(
      error instanceof Error
        ? error
        : new Error("Unknown error converting JSON-LD recipe"),
    );
  }
}

/**
 * Scrape a recipe from a URL using JSON-LD data
 * @param url The URL to fetch
 * @param html The HTML content (if already fetched)
 */
export async function scrapeJsonLd(url: string): Promise<Result<BasicRecipe>> {
  try {
    // Step 1: Fetch HTML
    const response = await fetch(url);

    if (!response.ok) {
      const errorMessage = `Failed to fetch URL: ${response.status} ${response.statusText}`;
      console.error(errorMessage);
      return failure(new Error(errorMessage));
    }

    const html = await response.text();

    // Step 2: Extract JSON-LD data from HTML
    const jsonLdResult = extractJsonLdFromHtml(html);

    if (jsonLdResult.error) {
      return failure(jsonLdResult.error);
    }

    // Step 3: Find recipe entity in JSON-LD data
    const recipeEntityResult = findRecipeInJsonLd(jsonLdResult.data);

    if (recipeEntityResult.error) {
      return failure(recipeEntityResult.error);
    }

    // Step 4: Convert JSON-LD recipe to basic recipe format
    return convertJsonLdToBasicRecipe(recipeEntityResult.data);
  } catch (error) {
    console.error("Error scraping JSON-LD:", error);
    return failure(
      error instanceof Error
        ? error
        : new Error("Unknown error scraping JSON-LD"),
    );
  }
}

/**
 * Parse ISO8601 duration format to minutes
 * Handles formats like PT1H30M (1 hour 30 minutes)
 */
function parseISO8601Duration(duration: string): number {
  let minutes = 0;

  // Handle hour component
  const hourRegex = /(\d+)H/;
  const hourMatch = hourRegex.exec(duration);
  if (hourMatch?.[1]) {
    minutes += parseInt(hourMatch[1], 10) * 60;
  }

  // Handle minute component
  const minuteRegex = /(\d+)M/;
  const minuteMatch = minuteRegex.exec(duration);
  if (minuteMatch?.[1]) {
    minutes += parseInt(minuteMatch[1], 10);
  }

  return minutes;
}
