import { TRPCError } from "@trpc/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import { ingredient, instruction, recipe } from "@reciperun/db";

import { publicProcedure } from "../trpc";
import { fetchRecipeFromUrl } from "./scrape";

export const recipesRouter = {
  // Get all recipes
  getAll: publicProcedure.query(async ({ ctx }) => {
    console.log("Fetching all recipes from database...");

    // Fetch all recipes from the database
    const recipesData = await ctx.db
      .select({
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        imageUrl: recipe.imageUrl,
      })
      .from(recipe)
      .orderBy(asc(recipe.title));

    return recipesData;
  }),

  // Get recipe by id
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // First, get the basic recipe info
      const [recipeData, ingredients, instructions] = await Promise.all([
        ctx.db
          .select({
            id: recipe.id,
            title: recipe.title,
            description: recipe.description,
            prepTime: recipe.prepTime,
            cookTime: recipe.cookTime,
            imageUrl: recipe.imageUrl,
          })
          .from(recipe)
          .where(eq(recipe.id, input.id))
          .limit(1),
        ctx.db
          .select({
            id: ingredient.id,
            name: ingredient.name,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            note: ingredient.note,
          })
          .from(ingredient)
          .where(eq(ingredient.recipeId, input.id)),
        ctx.db
          .select({
            id: instruction.id,
            text: instruction.text,
            annotatedText: instruction.annotatedText,
            annotations: instruction.annotations,
          })
          .from(instruction)
          .where(eq(instruction.recipeId, input.id))
          .orderBy(instruction.order),
      ]);

      if (recipeData.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Recipe not found",
        });
      }

      // Combine the results
      return {
        ...recipeData[0],
        ingredients,
        instructions,
      };
    }),

  // Import recipe from URL
  importFromUrl: publicProcedure
    .input(z.object({ url: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      const result = await fetchRecipeFromUrl(input.url);

      if (result.error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Failed to import recipe: ${result.error.message}`,
        });
      }

      const annotatedRecipe = result.data;

      // Begin a transaction to ensure all recipe data is stored atomically
      return await ctx.db.transaction(async (tx) => {
        // 1. Insert the base recipe
        const [recipeRecord] = await tx
          .insert(recipe)
          .values({
            title: annotatedRecipe.title,
            description: annotatedRecipe.description,
            prepTime: annotatedRecipe.prepTime,
            cookTime: annotatedRecipe.cookTime,
            imageUrl: annotatedRecipe.imageUrl,
            userId: ctx.session?.user.id, // Link to user if authenticated
          })
          .returning();

        if (!recipeRecord) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create recipe record",
          });
        }

        // 2. Insert all ingredients and keep track of their IDs
        const insertedIngredients = await tx
          .insert(ingredient)
          .values(
            annotatedRecipe.ingredients.map((ing, index) => ({
              recipeId: recipeRecord.id,
              name: ing.name,
              quantity: ing.quantity?.toString() ?? null,
              unit: ing.unit ?? null,
              note: ing.note ?? null,
              order: index,
            })),
          )
          .returning();

        // 3. Insert all instructions with annotations
        await tx.insert(instruction).values(
          annotatedRecipe.instructions.map((inst, index) => {
            // Map ingredientIndex to actual ingredientId using the insertedIngredients array
            const annotations =
              inst.annotations?.map((annot) => {
                // If ingredientIndex is defined, map to the corresponding ingredientId
                const ingredientId =
                  annot.ingredientIndex !== undefined
                    ? (insertedIngredients[annot.ingredientIndex]?.id ?? "")
                    : "";

                return {
                  ingredientId,
                  portionUsed: annot.portionUsed ?? 1,
                };
              }) ?? null;

            return {
              recipeId: recipeRecord.id,
              text: inst.text,
              annotatedText: inst.annotatedText ?? null,
              annotations,
              order: index,
            };
          }),
        );

        // 4. Return the created recipe with its ID
        return {
          ...annotatedRecipe,
          id: recipeRecord.id,
        };
      });
    }),
};
