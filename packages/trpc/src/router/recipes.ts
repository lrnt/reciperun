import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import { publicProcedure } from "../trpc";

// Define ingredient type for structured data
export const ingredientSchema = z.object({
  name: z.string(),
  quantity: z.number(),
  unit: z.string().optional(),
});

export type Ingredient = z.infer<typeof ingredientSchema>;

// Define the Recipe type
export const recipeSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  ingredients: z.array(ingredientSchema),
  instructions: z.array(z.string()),
  prepTime: z.number(),
  cookTime: z.number(),
  imageUrl: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Recipe = z.infer<typeof recipeSchema>;

// Mock data
const mockRecipes: Recipe[] = [
  {
    id: "1",
    title: "Spaghetti Carbonara",
    description: "A classic Italian pasta dish with eggs, cheese, and pancetta.",
    ingredients: [
      { name: "spaghetti", quantity: 100, unit: "g" },
      { name: "pancetta or guanciale", quantity: 50, unit: "g" },
      { name: "large eggs", quantity: 1 },
      { name: "Pecorino Romano cheese", quantity: 25, unit: "g" },
      { name: "Parmesan cheese", quantity: 12.5, unit: "g" },
      { name: "Freshly ground black pepper", quantity: 1, unit: "to taste" },
      { name: "Salt", quantity: 1, unit: "to taste" },
    ],
    instructions: [
      "Bring a large pot of salted water to boil and cook spaghetti according to package instructions.",
      "In a large pan, cook the pancetta until crispy.",
      "In a bowl, whisk together eggs, Pecorino Romano, and black pepper.",
      "Drain pasta, reserving some cooking water.",
      "Working quickly, add hot pasta to the pan with pancetta, remove from heat.",
      "Add egg mixture, tossing continuously until creamy.",
      "Add reserved pasta water if needed to reach desired consistency.",
      "Serve immediately with extra cheese and black pepper.",
    ],
    prepTime: 10,
    cookTime: 15,
    imageUrl: "https://images.unsplash.com/photo-1546549032-9571cd6b27df",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    title: "Chicken Tikka Masala",
    description: "A flavorful Indian curry dish with tender chicken in a creamy tomato sauce.",
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
      { name: "fresh cilantro", quantity: 1, unit: "for garnish" },
    ],
    instructions: [
      "Marinate chicken in yogurt, lemon juice, and half the spices for at least 1 hour.",
      "Grill or bake chicken until cooked through.",
      "In a large pot, sauté onions until soft, then add garlic and ginger.",
      "Add remaining spices and cook until fragrant.",
      "Add diced tomatoes and simmer for 15 minutes.",
      "Blend sauce until smooth, then return to pot.",
      "Add grilled chicken and cream, simmer for 10 minutes.",
      "Garnish with cilantro and serve with rice or naan.",
    ],
    prepTime: 20,
    cookTime: 40,
    imageUrl: "https://images.unsplash.com/photo-1565557623262-b51c2513a641",
    createdAt: new Date("2024-02-05"),
    updatedAt: new Date("2024-02-10"),
  },
  {
    id: "3",
    title: "Classic Caesar Salad",
    description: "A refreshing salad with romaine lettuce, croutons, and Caesar dressing.",
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
      { name: "Salt and black pepper", quantity: 1, unit: "to taste" },
    ],
    instructions: [
      "Wash and dry lettuce, tear into bite-sized pieces.",
      "In a food processor, blend garlic, anchovies, egg yolk, mustard, and lemon juice.",
      "Slowly add olive oil while processing to emulsify.",
      "Season with salt and pepper to taste.",
      "Toss lettuce with dressing, Parmesan cheese, and croutons.",
      "Serve immediately.",
    ],
    prepTime: 15,
    cookTime: 0,
    imageUrl: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9",
    createdAt: new Date("2024-01-25"),
    updatedAt: new Date("2024-01-25"),
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
} satisfies TRPCRouterRecord;