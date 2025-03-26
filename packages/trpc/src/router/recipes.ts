import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import { publicProcedure } from "../trpc";

// Define the Recipe type
export const recipeSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  ingredients: z.array(z.string()),
  instructions: z.array(z.string()),
  prepTime: z.number(),
  cookTime: z.number(),
  servings: z.number(),
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
      "400g spaghetti",
      "200g pancetta or guanciale",
      "4 large eggs",
      "100g Pecorino Romano cheese",
      "50g Parmesan cheese",
      "Freshly ground black pepper",
      "Salt",
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
    servings: 4,
    imageUrl: "https://images.unsplash.com/photo-1546549032-9571cd6b27df",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    title: "Chicken Tikka Masala",
    description: "A flavorful Indian curry dish with tender chicken in a creamy tomato sauce.",
    ingredients: [
      "800g boneless chicken breast",
      "2 cups plain yogurt",
      "2 tbsp lemon juice",
      "2 tsp ground cumin",
      "2 tsp ground coriander",
      "2 tsp paprika",
      "1 tsp turmeric",
      "1 tsp garam masala",
      "2 onions, diced",
      "4 cloves garlic, minced",
      "1 tbsp ginger, grated",
      "2 cans diced tomatoes",
      "1 cup heavy cream",
      "Fresh cilantro for garnish",
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
    servings: 6,
    imageUrl: "https://images.unsplash.com/photo-1565557623262-b51c2513a641",
    createdAt: new Date("2024-02-05"),
    updatedAt: new Date("2024-02-10"),
  },
  {
    id: "3",
    title: "Classic Caesar Salad",
    description: "A refreshing salad with romaine lettuce, croutons, and Caesar dressing.",
    ingredients: [
      "2 heads romaine lettuce",
      "1 cup croutons",
      "1/2 cup Parmesan cheese",
      "2 cloves garlic",
      "2 anchovy fillets",
      "1 egg yolk",
      "1 tbsp Dijon mustard",
      "2 tbsp lemon juice",
      "1/2 cup olive oil",
      "Salt and black pepper",
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
    servings: 4,
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