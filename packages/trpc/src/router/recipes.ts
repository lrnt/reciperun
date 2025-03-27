import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import { publicProcedure } from "../trpc";
import { fetchRecipeFromUrl } from "../utils/scrape";

// Define ingredient type for structured data
export const ingredientSchema = z.object({
  name: z.string().describe("Name of the ingredient (e.g., 'flour', 'eggs')"),
  quantity: z
    .number()
    .optional()
    .describe("Numerical amount of the ingredient (e.g., 2, 0.5)"),
  unit: z
    .string()
    .optional()
    .describe("Unit of measurement (e.g., 'cups', 'g', 'tbsp')"),
  note: z
    .string()
    .optional()
    .describe(
      "Additional information about the ingredient (e.g., 'to taste', 'for garnish')",
    ),
});

export type Ingredient = z.infer<typeof ingredientSchema>;

// The app uses an annotation system to link ingredients to specific steps in the recipe instructions

// Define an annotation object for steps
export const annotationSchema = z.object({
  ingredientIndex: z
    .number()
    .optional()
    .describe(
      "Index of the ingredient in the ingredients array (zero-based) that this annotation references",
    ),
  portionUsed: z
    .number()
    .optional()
    .describe(
      "Fraction of the ingredient used in this step (e.g., 0.5 for half, 0.25 for quarter)",
    ),
  note: z
    .string()
    .optional()
    .describe(
      "Additional information about how this ingredient is used in this step",
    ),
});

export type Annotation = z.infer<typeof annotationSchema>;

// Define an instruction step with annotations
export const instructionStepSchema = z.object({
  text: z.string().describe("Plain text instruction without any annotations"),
  annotatedText: z
    .string()
    .optional()
    .describe(
      "Instruction text with markdown-style links to reference ingredients (e.g., 'Mix [flour](#0) and [sugar](#1)')",
    ),
  annotations: z
    .array(annotationSchema)
    .optional()
    .describe(
      "Array of annotations where each index corresponds to the numbered link in annotatedText",
    ),
});

export type InstructionStep = z.infer<typeof instructionStepSchema>;

// Define the Recipe type
export const recipeSchema = z.object({
  title: z.string().describe("Name of the recipe"),
  description: z
    .string()
    .describe("Brief summary or introduction to the recipe"),
  ingredients: z
    .array(ingredientSchema)
    .describe("List of all ingredients needed for the recipe"),
  instructions: z
    .array(instructionStepSchema)
    .describe("Step-by-step cooking instructions with ingredient annotations"),
  prepTime: z.number().describe("Preparation time in minutes"),
  cookTime: z.number().describe("Cooking time in minutes"),
  imageUrl: z
    .string()
    .optional()
    .describe("URL to an image of the completed dish"),
});
export type Recipe = z.infer<typeof recipeSchema>;

// Mock data
const mockRecipes: Recipe[] = [
  {
    title: "Spaghetti Carbonara",
    description:
      "A classic Italian pasta dish with eggs, cheese, and pancetta.",
    ingredients: [
      { name: "spaghetti", quantity: 100, unit: "g" },
      { name: "pancetta or guanciale", quantity: 50, unit: "g" },
      { name: "large eggs", quantity: 1 },
      { name: "Pecorino Romano cheese", quantity: 25, unit: "g" },
      { name: "Parmesan cheese", quantity: 12.5, unit: "g" },
      { name: "Freshly ground black pepper", note: "to taste" },
      { name: "Salt", note: "to taste" },
    ],
    instructions: [
      {
        text: "Bring a large pot of salted water to boil and cook spaghetti according to package instructions.",
        annotatedText:
          "Bring a large pot of [salted water](#0) to boil and cook [spaghetti](#1) according to package instructions.",
        annotations: [
          {
            ingredientIndex: 6,
          },
          {
            ingredientIndex: 0,
            portionUsed: 1,
          },
        ],
      },
      {
        text: "In a large pan, cook the pancetta until crispy.",
        annotatedText: "In a large pan, cook the [pancetta](#0) until crispy.",
        annotations: [
          {
            ingredientIndex: 1,
            portionUsed: 1,
          },
        ],
      },
      {
        text: "In a bowl, whisk together eggs, Pecorino Romano, and black pepper.",
        annotatedText:
          "In a bowl, whisk together [eggs](#0), [Pecorino Romano](#1), and [black pepper](#2).",
        annotations: [
          {
            ingredientIndex: 2,
          },
          {
            ingredientIndex: 3,
          },
          {
            ingredientIndex: 5,
          },
        ],
      },
      {
        text: "Drain pasta, reserving some cooking water.",
        annotatedText: "Drain [pasta](#0), reserving some cooking water.",
        annotations: [
          {
            ingredientIndex: 0,
          },
        ],
      },
      {
        text: "Working quickly, add hot pasta to the pan with pancetta, remove from heat.",
        annotatedText:
          "Working quickly, add hot [pasta](#0) to the pan with [pancetta](#1), remove from heat.",
        annotations: [
          {
            ingredientIndex: 0,
            note: "Should still be hot",
          },
          {
            ingredientIndex: 1,
          },
        ],
      },
      {
        text: "Add egg mixture, tossing continuously until creamy.",
        annotatedText: "Add egg mixture, tossing continuously until creamy.",
      },
      {
        text: "Add reserved pasta water if needed to reach desired consistency.",
        annotatedText:
          "Add reserved pasta water if needed to reach desired consistency.",
      },
      {
        text: "Serve immediately with extra cheese and black pepper.",
        annotatedText:
          "Serve immediately with extra [Parmesan](#0) and [black pepper](#1).",
        annotations: [
          {
            ingredientIndex: 4,
            portionUsed: 1,
          },
          {
            ingredientIndex: 5,
          },
        ],
      },
    ],
    prepTime: 10,
    cookTime: 15,
    imageUrl: "https://images.unsplash.com/photo-1546549032-9571cd6b27df",
  },
  {
    title: "Chicken Tikka Masala",
    description:
      "A flavorful Indian curry dish with tender chicken in a creamy tomato sauce.",
    ingredients: [
      { name: "boneless chicken breast", quantity: 133.33, unit: "g" },
      { name: "plain yogurt", quantity: 0.33, unit: "cups" },
      { name: "lemon juice", quantity: 0.33, unit: "tbsp" },
      { name: "ground cumin", quantity: 0.33, unit: "tsp" },
      { name: "ground coriander", quantity: 0.33, unit: "tsp" },
      { name: "paprika", quantity: 0.33, unit: "tsp" },
      { name: "turmeric", quantity: 0.17, unit: "tsp" },
      { name: "garam masala", quantity: 0.17, unit: "tsp" },
      { name: "onions, diced", quantity: 0.33 },
      { name: "garlic, minced", quantity: 0.67, unit: "cloves" },
      { name: "ginger, grated", quantity: 0.17, unit: "tbsp" },
      { name: "diced tomatoes", quantity: 0.33, unit: "cans" },
      { name: "heavy cream", quantity: 0.17, unit: "cup" },
      { name: "fresh cilantro", note: "for garnish" },
    ],
    instructions: [
      {
        text: "Marinate chicken in yogurt, lemon juice, and half the spices for at least 1 hour.",
        annotatedText:
          "Marinate [chicken](#0) in [yogurt](#1), [lemon juice](#2), and half the spices ([cumin](#3), [coriander](#4), [paprika](#5), [turmeric](#6), and [garam masala](#7)) for at least 1 hour.",
        annotations: [
          {
            ingredientIndex: 0,
            portionUsed: 1,
          },
          {
            ingredientIndex: 1,
            portionUsed: 1,
          },
          {
            ingredientIndex: 2,
            portionUsed: 1,
          },
          {
            ingredientIndex: 3,
            portionUsed: 0.5,
          },
          {
            ingredientIndex: 4,
            portionUsed: 0.5,
          },
          {
            ingredientIndex: 5,
            portionUsed: 0.5,
          },
          {
            ingredientIndex: 6,
            portionUsed: 0.5,
          },
          {
            ingredientIndex: 7,
            portionUsed: 0.5,
          },
        ],
      },
      {
        text: "Grill or bake chicken until cooked through.",
        annotatedText: "Grill or bake [chicken](#0) until cooked through.",
        annotations: [
          {
            ingredientIndex: 0,
            note: "Cook until internal temperature reaches 165°F or 74°C",
          },
        ],
      },
      {
        text: "In a large pot, sauté onions until soft, then add garlic and ginger.",
        annotatedText:
          "In a large pot, sauté [onions](#0) until soft, then add [garlic](#1) and [ginger](#2).",
        annotations: [
          {
            ingredientIndex: 8,
            portionUsed: 1,
          },
          {
            ingredientIndex: 9,
            portionUsed: 1,
          },
          {
            ingredientIndex: 10,
            portionUsed: 1,
          },
        ],
      },
      {
        text: "Add remaining spices and cook until fragrant.",
        annotatedText: "Add remaining [spices](#0) and cook until fragrant.",
        annotations: [
          {
            note: "The remaining half of the spices from step 1",
          },
        ],
      },
      {
        text: "Add diced tomatoes and simmer for 15 minutes.",
        annotatedText: "Add [diced tomatoes](#0) and simmer for 15 minutes.",
        annotations: [
          {
            ingredientIndex: 11,
            portionUsed: 1,
          },
        ],
      },
      {
        text: "Blend sauce until smooth, then return to pot.",
        annotatedText: "Blend sauce until smooth, then return to pot.",
      },
      {
        text: "Add grilled chicken and cream, simmer for 10 minutes.",
        annotatedText:
          "Add grilled [chicken](#0) and [cream](#1), simmer for 10 minutes.",
        annotations: [
          {
            ingredientIndex: 0,
          },
          {
            ingredientIndex: 12,
            portionUsed: 1,
          },
        ],
      },
      {
        text: "Garnish with cilantro and serve with rice or naan.",
        annotatedText:
          "Garnish with [cilantro](#0) and serve with rice or naan.",
        annotations: [
          {
            ingredientIndex: 13,
            portionUsed: 1,
          },
        ],
      },
    ],
    prepTime: 20,
    cookTime: 40,
    imageUrl: "https://images.unsplash.com/photo-1565557623262-b51c2513a641",
  },
  {
    title: "Classic Caesar Salad",
    description:
      "A refreshing salad with romaine lettuce, croutons, and Caesar dressing.",
    ingredients: [
      { name: "romaine lettuce", quantity: 0.5, unit: "heads" },
      { name: "croutons", quantity: 0.25, unit: "cup" },
      { name: "Parmesan cheese", quantity: 0.125, unit: "cup" },
      { name: "garlic", quantity: 0.5, unit: "cloves" },
      { name: "anchovy fillets", quantity: 0.5 },
      { name: "egg yolk", quantity: 0.25 },
      { name: "Dijon mustard", quantity: 0.25, unit: "tbsp" },
      { name: "lemon juice", quantity: 0.5, unit: "tbsp" },
      { name: "olive oil", quantity: 0.125, unit: "cup" },
      { name: "Salt and black pepper", note: "to taste" },
    ],
    instructions: [
      {
        text: "Wash and dry lettuce, tear into bite-sized pieces.",
        annotatedText:
          "Wash and dry [lettuce](#0), tear into bite-sized pieces.",
        annotations: [
          {
            ingredientIndex: 0,
            portionUsed: 1,
          },
        ],
      },
      {
        text: "In a food processor, blend garlic, anchovies, egg yolk, mustard, and lemon juice.",
        annotatedText:
          "In a food processor, blend [garlic](#0), [anchovies](#1), [egg yolk](#2), [mustard](#3), and [lemon juice](#4).",
        annotations: [
          {
            ingredientIndex: 3,
            portionUsed: 1,
          },
          {
            ingredientIndex: 4,
            portionUsed: 1,
          },
          {
            ingredientIndex: 5,
            portionUsed: 1,
          },
          {
            ingredientIndex: 6,
            portionUsed: 1,
          },
          {
            ingredientIndex: 7,
            portionUsed: 1,
          },
        ],
      },
      {
        text: "Slowly add olive oil while processing to emulsify.",
        annotatedText:
          "Slowly add [olive oil](#0) while processing to emulsify.",
        annotations: [
          {
            ingredientIndex: 8,
            portionUsed: 1,
          },
        ],
      },
      {
        text: "Season with salt and pepper to taste.",
        annotatedText: "Season with [salt and pepper](#0) to taste.",
        annotations: [
          {
            ingredientIndex: 9,
          },
        ],
      },
      {
        text: "Toss lettuce with dressing, Parmesan cheese, and croutons.",
        annotatedText:
          "Toss [lettuce](#0) with dressing, [Parmesan cheese](#1), and [croutons](#2).",
        annotations: [
          {
            ingredientIndex: 0,
          },
          {
            ingredientIndex: 2,
            portionUsed: 1,
          },
          {
            ingredientIndex: 1,
            portionUsed: 1,
          },
        ],
      },
      {
        text: "Serve immediately.",
        annotatedText: "Serve immediately.",
      },
    ],
    prepTime: 15,
    cookTime: 0,
    imageUrl: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9",
  },
];

export const recipesRouter = {
  // Get all recipes
  getAll: publicProcedure.query(() => {
    console.log("Fetching all recipes...");
    return mockRecipes;
  }),

  // Get recipe by id
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      console.log(`Fetching recipe with id: ${input.id}`);
      const recipe = mockRecipes.find((r) => r.id === input.id);
      if (!recipe) {
        throw new Error("Recipe not found");
      }
      return recipe;
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
          error: result.error.message,
          data: null,
        };
      } else {
        return {
          success: true,
          error: null,
          data: result.data,
        };
      }
    }),
} satisfies TRPCRouterRecord;
