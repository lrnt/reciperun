import { createAnthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";

import type { JsonLdEntity } from "./json-ld";
import { recipeSchema } from "../router/recipes";
import {
  extractRecipeFromJsonLd,
  fetchJsonLdFromUrl as fetchJsonLdFromHtml,
} from "./json-ld";
import { failure, success } from "./try-catch";

/**
 * Fetches a recipe from a URL by extracting JSON-LD data
 * @param url The URL to fetch the recipe from
 * @returns Result with recipe data or error
 */
export async function fetchRecipeFromUrl(url: string) {
  // Step 1: Fetch the webpage content
  const response = await fetch(url);

  if (!response.ok) {
    const errorMessage = `Failed to fetch URL: ${response.status} ${response.statusText}`;
    console.error(errorMessage);
    return failure(new Error(errorMessage));
  }

  const html = await response.text();

  // Step 2: Fetch JSON-LD data from the URL
  const jsonLdResult = fetchJsonLdFromHtml(html);

  // If fetching failed, return early with the error
  if (jsonLdResult.error) {
    return failure(jsonLdResult.error);
  }

  // Step 3: Extract recipe from the JSON-LD data
  const jsonLdRecipe = extractRecipeFromJsonLd(jsonLdResult.data);

  if (jsonLdRecipe.error) {
    return failure(jsonLdRecipe.error);
  }

  // Step 4: Normalize the JSON-LD recipe to our application's schema
  const normalizedRecipe = await normalizeJsonLdRecipe(jsonLdRecipe.data);

  if (normalizedRecipe.error) {
    return failure(normalizedRecipe.error);
  }

  return success(normalizedRecipe.data);
}

/**
 * Normalizes a JSON-LD recipe to our application's recipe schema
 * First extracts direct properties, then uses AI for complex parsing
 * @param recipe The JSON-LD recipe entity to normalize
 * @returns Result with normalized recipe data or error
 */
export async function normalizeJsonLdRecipe(recipe: JsonLdEntity) {
  try {
    console.log("Normalizing JSON-LD recipe...");

    // Step 1: Directly extract simple properties from JSON-LD
    const title = typeof recipe.name === 'string' ? recipe.name : '';
    const description = typeof recipe.description === 'string' ? recipe.description : '';
    
    // Handle image URL (could be a string or an object with url property)
    let imageUrl: string | undefined;
    if (typeof recipe.image === 'string') {
      imageUrl = recipe.image;
    } else if (
      typeof recipe.image === 'object' && 
      recipe.image !== null &&
      'url' in recipe.image &&
      typeof (recipe.image as { url: string }).url === 'string'
    ) {
      imageUrl = (recipe.image as { url: string }).url;
    }

    // Parse cook time (PT1H30M format to minutes)
    let cookTime = 0;
    if (typeof recipe.cookTime === 'string') {
      const timeString = recipe.cookTime;
      cookTime = parseISO8601Duration(timeString);
    }

    // Get prep time or default to estimate
    let prepTime = 0;
    if (typeof recipe.prepTime === 'string') {
      const timeString = recipe.prepTime;
      prepTime = parseISO8601Duration(timeString);
    }

    // Extract ingredients as simple strings
    const rawIngredients: string[] = [];
    if (Array.isArray(recipe.recipeIngredient)) {
      recipe.recipeIngredient.forEach(ingredient => {
        if (typeof ingredient === 'string') {
          rawIngredients.push(ingredient);
        }
      });
    }

    // Extract instructions as simple strings
    const rawInstructions: string[] = [];
    if (Array.isArray(recipe.recipeInstructions)) {
      recipe.recipeInstructions.forEach(instruction => {
        if (typeof instruction === 'string') {
          rawInstructions.push(instruction);
        } else if (
          typeof instruction === 'object' && 
          instruction !== null &&
          'text' in instruction &&
          typeof (instruction as { text: string }).text === 'string'
        ) {
          rawInstructions.push((instruction as { text: string }).text);
        }
      });
    }

    // Step 2: Use AI for complex parsing (ingredients and instructions annotation)
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("Missing ANTHROPIC_API_KEY");
    }

    const anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Define the prompt for the AI model - now focused just on parsing ingredients and annotating instructions
    const prompt = `
You're an expert at parsing recipe data. I have already extracted the basic recipe information and need your help with:
1. Parsing the ingredients into structured data
2. Annotating the instructions to link to the ingredients

Basic recipe info:
- Title: ${title}
- Description: ${description}
- Cook Time: ${cookTime} minutes
- Prep Time: ${prepTime} minutes

Raw Ingredients (as strings):
${JSON.stringify(rawIngredients, null, 2)}

Raw Instructions (as strings):
${JSON.stringify(rawInstructions, null, 2)}

IMPORTANT INSTRUCTIONS FOR ANNOTATING:

1. Each instruction step needs BOTH a "text" field (plain text) and if ingredients are mentioned, BOTH:
   - "annotatedText" field 
   - "annotations" array
   
2. The "annotatedText" field MUST use markdown-style links that reference positions in the annotations array:
   Example: "Mix [flour](#0) and [sugar](#1)" where:
   - [flour] is the ingredient name displayed to the user
   - #0 references annotations[0]
   - #1 references annotations[1]
   
3. For EVERY reference like [ingredient](#N) in annotatedText, there MUST be a corresponding entry in the annotations array at that index.

4. If you include "annotatedText" for a step, you MUST include a non-empty "annotations" array.

5. If there are no ingredients to annotate in a step, only include "text" field, DO NOT include empty "annotatedText" or "annotations".

6. Each annotation should have an "ingredientIndex" that points to the index of the ingredient in the ingredients array.

Example correct format for a step:
{
  "text": "Mix flour and sugar in a bowl.",
  "annotatedText": "Mix [flour](#0) and [sugar](#1) in a bowl.",
  "annotations": [
    { "ingredientIndex": 0 },
    { "ingredientIndex": 1 }
  ]
}

Example with no annotations needed:
{
  "text": "Preheat the oven to 350°F."
}

Convert the raw ingredients into structured data with name, quantity, unit, and notes.
Then annotate the instructions following the format above.
Generate an id for the recipe.
`;

    // Use the Vercel AI SDK to generate the structured recipe
    const aiEnhancedRecipe = await generateObject({
      model: anthropic("claude-3-5-sonnet-20240620"),
      schema: recipeSchema,
      prompt,
    });

    // Combine the directly extracted data with the AI-enhanced data
    const finalRecipe = {
      ...aiEnhancedRecipe,
      title: title || aiEnhancedRecipe.object.title,
      description: description || aiEnhancedRecipe.object.description, 
      imageUrl: imageUrl,
      cookTime: cookTime || aiEnhancedRecipe.object.cookTime,
      prepTime: prepTime || aiEnhancedRecipe.object.prepTime,
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
