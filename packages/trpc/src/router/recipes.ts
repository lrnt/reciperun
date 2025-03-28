// Re-export types for compatibility
import type { AnnotatedRecipe } from "../recipes/schemas";

// Create Recipe type with id for compatibility
export type Recipe = AnnotatedRecipe & { id: string };

export type { RecipeWithId, Annotation, Ingredient } from "../recipes/schemas";

export * from "../recipes/router";
