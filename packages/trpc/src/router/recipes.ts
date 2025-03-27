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

// We're removing the segment approach and using annotations instead

// Define an annotation object for steps
export const annotationSchema = z.object({
  // ID of the annotation reference
  id: z.string(),
  // Index of the ingredient in the ingredients array (if it's an ingredient)
  ingredientIndex: z.number().optional(),
  // How much of the ingredient is used in this step (e.g., 0.5 for half)
  portionUsed: z.number().optional(),
  // Optional custom text (e.g., "to taste", "for garnish")
  customText: z.string().optional(),
  // Optional alternate display name
  displayName: z.string().optional(),
  // Optional free-form note text
  note: z.string().optional()
});

export type Annotation = z.infer<typeof annotationSchema>;

// Define an instruction step with ingredients used
export const instructionStepSchema = z.object({
  // The full instruction text
  text: z.string(),
  // Annotated text field with markdown links for references
  annotatedText: z.string().optional(),
  // Optional array of ingredients used in this step with their quantities (for backward compatibility)
  ingredientsUsed: z.array(
    z.object({
      // Index of the ingredient in the ingredients array
      ingredientIndex: z.number(),
      // How much of the ingredient is used in this step (e.g., 0.5 for half)
      portionUsed: z.number().optional(),
      // Optional custom text (e.g., "half the cheese")
      customText: z.string().optional(),
    })
  ).optional(),
  // Annotations object mapping annotation ids to annotation details
  annotations: z.record(z.string(), annotationSchema).optional()
});

export type InstructionStep = z.infer<typeof instructionStepSchema>;

// Define the Recipe type
export const recipeSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  ingredients: z.array(ingredientSchema),
  instructions: z.array(instructionStepSchema),
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
      {
        text: "Bring a large pot of salted water to boil and cook spaghetti according to package instructions.",
        annotatedText: "Bring a large pot of [salted water](#1) to boil and cook [spaghetti](#2) according to package instructions.",
        ingredientsUsed: [
          { ingredientIndex: 0, portionUsed: 1 }, // spaghetti
          { ingredientIndex: 6, customText: "to taste" } // salt
        ],
        annotations: {
          "1": {
            id: "1",
            ingredientIndex: 6,
            customText: "to taste",
            displayName: "salted water"
          },
          "2": {
            id: "2",
            ingredientIndex: 0,
            portionUsed: 1
          }
        }
      },
      {
        text: "In a large pan, cook the pancetta until crispy.",
        annotatedText: "In a large pan, cook the [pancetta](#3) until crispy.",
        ingredientsUsed: [
          { ingredientIndex: 1, portionUsed: 1 } // pancetta
        ],
        annotations: {
          "3": {
            id: "3",
            ingredientIndex: 1,
            portionUsed: 1
          }
        }
      },
      {
        text: "In a bowl, whisk together eggs, Pecorino Romano, and black pepper.",
        annotatedText: "In a bowl, whisk together [eggs](#4), [Pecorino Romano](#5), and [black pepper](#6).",
        ingredientsUsed: [
          { ingredientIndex: 2, portionUsed: 1 }, // eggs
          { ingredientIndex: 3, portionUsed: 0.75 }, // Pecorino (save some for garnish)
          { ingredientIndex: 5, customText: "to taste" } // black pepper
        ],
        annotations: {
          "4": {
            id: "4",
            ingredientIndex: 2,
            portionUsed: 1
          },
          "5": {
            id: "5",
            ingredientIndex: 3,
            portionUsed: 0.75,
            note: "Save the rest for garnish"
          },
          "6": {
            id: "6",
            ingredientIndex: 5,
            customText: "to taste"
          }
        }
      },
      {
        text: "Drain pasta, reserving some cooking water.",
        annotatedText: "Drain [pasta](#7), reserving some cooking water.",
        annotations: {
          "7": {
            id: "7",
            ingredientIndex: 0,
            note: "Reserve some cooking water"
          }
        }
      },
      {
        text: "Working quickly, add hot pasta to the pan with pancetta, remove from heat.",
        annotatedText: "Working quickly, add hot [pasta](#8) to the pan with [pancetta](#9), remove from heat.",
        annotations: {
          "8": {
            id: "8",
            ingredientIndex: 0,
            note: "Should still be hot"
          },
          "9": {
            id: "9",
            ingredientIndex: 1
          }
        }
      },
      {
        text: "Add egg mixture, tossing continuously until creamy.",
        annotatedText: "Add [egg mixture](#10), tossing continuously until creamy.",
        annotations: {
          "10": {
            id: "10",
            note: "The mixture should be at room temperature"
          }
        }
      },
      {
        text: "Add reserved pasta water if needed to reach desired consistency.",
        annotatedText: "Add reserved [pasta water](#11) if needed to reach desired consistency.",
        annotations: {
          "11": {
            id: "11",
            note: "The starchy water helps create a silky sauce"
          }
        }
      },
      {
        text: "Serve immediately with extra cheese and black pepper.",
        annotatedText: "Serve immediately with extra [cheese](#12) and [Parmesan](#13) and [black pepper](#14).",
        ingredientsUsed: [
          { ingredientIndex: 3, portionUsed: 0.25 }, // Pecorino (remaining)
          { ingredientIndex: 4, portionUsed: 1 }, // Parmesan
          { ingredientIndex: 5, customText: "to taste" } // black pepper
        ],
        annotations: {
          "12": {
            id: "12",
            ingredientIndex: 3,
            portionUsed: 0.25,
            displayName: "cheese"
          },
          "13": {
            id: "13",
            ingredientIndex: 4,
            portionUsed: 1
          },
          "14": {
            id: "14",
            ingredientIndex: 5,
            customText: "to taste"
          }
        }
      }
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
      {
        text: "Marinate chicken in yogurt, lemon juice, and half the spices for at least 1 hour.",
        annotatedText: "Marinate [chicken](#15) in [yogurt](#16), [lemon juice](#17), and half the spices ([cumin](#18), [coriander](#19), [paprika](#20), [turmeric](#21), and [garam masala](#22)) for at least 1 hour.",
        ingredientsUsed: [
          { ingredientIndex: 0, portionUsed: 1 }, // chicken
          { ingredientIndex: 1, portionUsed: 1 }, // yogurt
          { ingredientIndex: 2, portionUsed: 1 }, // lemon juice
          { ingredientIndex: 3, portionUsed: 0.5 }, // cumin
          { ingredientIndex: 4, portionUsed: 0.5 }, // coriander
          { ingredientIndex: 5, portionUsed: 0.5 }, // paprika
          { ingredientIndex: 6, portionUsed: 0.5 }, // turmeric
          { ingredientIndex: 7, portionUsed: 0.5 } // garam masala
        ],
        annotations: {
          "15": {
            id: "15",
            ingredientIndex: 0,
            portionUsed: 1
          },
          "16": {
            id: "16",
            ingredientIndex: 1,
            portionUsed: 1
          },
          "17": {
            id: "17",
            ingredientIndex: 2,
            portionUsed: 1
          },
          "18": {
            id: "18",
            ingredientIndex: 3,
            portionUsed: 0.5
          },
          "19": {
            id: "19",
            ingredientIndex: 4,
            portionUsed: 0.5
          },
          "20": {
            id: "20",
            ingredientIndex: 5,
            portionUsed: 0.5
          },
          "21": {
            id: "21",
            ingredientIndex: 6,
            portionUsed: 0.5
          },
          "22": {
            id: "22",
            ingredientIndex: 7,
            portionUsed: 0.5
          }
        }
      },
      {
        text: "Grill or bake chicken until cooked through.",
        annotatedText: "Grill or bake [chicken](#23) until cooked through.",
        annotations: {
          "23": {
            id: "23", 
            ingredientIndex: 0,
            note: "Cook until internal temperature reaches 165°F or 74°C"
          }
        }
      },
      {
        text: "In a large pot, sauté onions until soft, then add garlic and ginger.",
        annotatedText: "In a large pot, sauté [onions](#24) until soft, then add [garlic](#25) and [ginger](#26).",
        ingredientsUsed: [
          { ingredientIndex: 8, portionUsed: 1 }, // onions
          { ingredientIndex: 9, portionUsed: 1 }, // garlic
          { ingredientIndex: 10, portionUsed: 1 } // ginger
        ],
        annotations: {
          "24": {
            id: "24",
            ingredientIndex: 8,
            portionUsed: 1
          },
          "25": {
            id: "25",
            ingredientIndex: 9,
            portionUsed: 1
          },
          "26": {
            id: "26",
            ingredientIndex: 10,
            portionUsed: 1
          }
        }
      },
      {
        text: "Add remaining spices and cook until fragrant.",
        annotatedText: "Add remaining [spices](#27) and cook until fragrant.",
        ingredientsUsed: [
          { ingredientIndex: 3, portionUsed: 0.5 }, // cumin
          { ingredientIndex: 4, portionUsed: 0.5 }, // coriander
          { ingredientIndex: 5, portionUsed: 0.5 }, // paprika
          { ingredientIndex: 6, portionUsed: 0.5 }, // turmeric
          { ingredientIndex: 7, portionUsed: 0.5 } // garam masala
        ],
        annotations: {
          "27": {
            id: "27",
            note: "The remaining half of the spices from step 1"
          }
        }
      },
      {
        text: "Add diced tomatoes and simmer for 15 minutes.",
        annotatedText: "Add [diced tomatoes](#28) and simmer for 15 minutes.",
        ingredientsUsed: [
          { ingredientIndex: 11, portionUsed: 1 } // diced tomatoes
        ],
        annotations: {
          "28": {
            id: "28",
            ingredientIndex: 11,
            portionUsed: 1
          }
        }
      },
      {
        text: "Blend sauce until smooth, then return to pot.",
        annotatedText: "Blend sauce until smooth, then return to pot."
      },
      {
        text: "Add grilled chicken and cream, simmer for 10 minutes.",
        annotatedText: "Add grilled [chicken](#29) and [cream](#30), simmer for 10 minutes.",
        ingredientsUsed: [
          { ingredientIndex: 12, portionUsed: 1 } // heavy cream
        ],
        annotations: {
          "29": {
            id: "29",
            ingredientIndex: 0,
            displayName: "chicken"
          },
          "30": {
            id: "30",
            ingredientIndex: 12,
            portionUsed: 1
          }
        }
      },
      {
        text: "Garnish with cilantro and serve with rice or naan.",
        annotatedText: "Garnish with [cilantro](#31) and serve with rice or naan.",
        ingredientsUsed: [
          { ingredientIndex: 13, portionUsed: 1, customText: "for garnish" } // cilantro
        ],
        annotations: {
          "31": {
            id: "31",
            ingredientIndex: 13,
            portionUsed: 1,
            customText: "for garnish"
          }
        }
      }
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
      {
        text: "Wash and dry lettuce, tear into bite-sized pieces.",
        annotatedText: "Wash and dry [lettuce](#32), tear into bite-sized pieces.",
        ingredientsUsed: [
          { ingredientIndex: 0, portionUsed: 1 } // lettuce
        ],
        annotations: {
          "32": {
            id: "32",
            ingredientIndex: 0,
            portionUsed: 1
          }
        }
      },
      {
        text: "In a food processor, blend garlic, anchovies, egg yolk, mustard, and lemon juice.",
        annotatedText: "In a food processor, blend [garlic](#33), [anchovies](#34), [egg yolk](#35), [mustard](#36), and [lemon juice](#37).",
        ingredientsUsed: [
          { ingredientIndex: 3, portionUsed: 1 }, // garlic
          { ingredientIndex: 4, portionUsed: 1 }, // anchovies
          { ingredientIndex: 5, portionUsed: 1 }, // egg yolk
          { ingredientIndex: 6, portionUsed: 1 }, // mustard
          { ingredientIndex: 7, portionUsed: 1 }  // lemon juice
        ],
        annotations: {
          "33": {
            id: "33",
            ingredientIndex: 3,
            portionUsed: 1
          },
          "34": {
            id: "34",
            ingredientIndex: 4,
            portionUsed: 1
          },
          "35": {
            id: "35",
            ingredientIndex: 5,
            portionUsed: 1
          },
          "36": {
            id: "36",
            ingredientIndex: 6,
            portionUsed: 1
          },
          "37": {
            id: "37",
            ingredientIndex: 7,
            portionUsed: 1
          }
        }
      },
      {
        text: "Slowly add olive oil while processing to emulsify.",
        annotatedText: "Slowly add [olive oil](#38) while processing to emulsify.",
        ingredientsUsed: [
          { ingredientIndex: 8, portionUsed: 1 } // olive oil
        ],
        annotations: {
          "38": {
            id: "38",
            ingredientIndex: 8,
            portionUsed: 1
          }
        }
      },
      {
        text: "Season with salt and pepper to taste.",
        annotatedText: "Season with [salt and pepper](#39) to taste.",
        ingredientsUsed: [
          { ingredientIndex: 9, customText: "to taste" } // salt and pepper
        ],
        annotations: {
          "39": {
            id: "39",
            ingredientIndex: 9,
            customText: "to taste"
          }
        }
      },
      {
        text: "Toss lettuce with dressing, Parmesan cheese, and croutons.",
        annotatedText: "Toss [lettuce](#40) with dressing, [Parmesan cheese](#41), and [croutons](#42).",
        ingredientsUsed: [
          { ingredientIndex: 1, portionUsed: 1 }, // croutons
          { ingredientIndex: 2, portionUsed: 1 }  // Parmesan
        ],
        annotations: {
          "40": {
            id: "40",
            ingredientIndex: 0,
            displayName: "lettuce"
          },
          "41": {
            id: "41",
            ingredientIndex: 2,
            portionUsed: 1
          },
          "42": {
            id: "42",
            ingredientIndex: 1,
            portionUsed: 1
          }
        }
      },
      {
        text: "Serve immediately.",
        annotatedText: "Serve immediately."
      }
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