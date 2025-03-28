import type { Result } from "../../utils/try-catch";
import { failure, success } from "../../utils/try-catch";

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
 * Fetches and extracts JSON-LD entities from a given URL
 *
 * @param html - The HTML content to search for JSON-LD scripts
 * @returns A Result containing an array of JSON-LD entities or an error
 */
export function fetchJsonLdFromHtml(html: string): Result<JsonLdEntity[]> {
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
    console.error("Error fetching JSON-LD:", error);
    return failure(
      error instanceof Error
        ? error
        : new Error("Unknown error fetching JSON-LD"),
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
    .map((jsonContent) => {
      try {
        return JSON.parse(jsonContent) as JsonLdEntity;
      } catch (parseError) {
        console.error("Error parsing JSON-LD:", parseError);
        return null;
      }
    })
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
export function extractRecipeFromJsonLd(
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
    console.log(
      "Recipe JSON-LD data found:",
      JSON.stringify(recipeEntity, null, 2),
    );
    return success(recipeEntity);
  }

  console.log("No recipe found in JSON-LD data");
  return failure(new Error("No recipe found in JSON-LD data"));
} 