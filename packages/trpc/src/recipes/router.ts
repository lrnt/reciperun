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
      const [recipeData, ingredients, instructions] = await ctx.db.batch([
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
          .orderBy(instruction.id),
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
    .mutation(async ({ input }) => {
      const result = await fetchRecipeFromUrl(input.url);
      console.log("Import recipe result:", result);

      // When returning to clients, convert to a more API-friendly format
      if (result.error) {
        return {
          success: false,
          data: null,
        };
      }
      return {
        success: true,
        data: result.data,
      };
    }),
};
