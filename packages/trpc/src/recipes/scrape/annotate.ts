import { createAnthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";

import type { Result } from "../../utils/try-catch";
import type { AnnotatedRecipe, BasicRecipe } from "../schemas";
import { failure, success } from "../../utils/try-catch";
import { annotatedRecipeSchema } from "../schemas";

/**
 * Takes a basic recipe and enhances it with AI annotations
 * @param recipe The basic recipe data to annotate
 * @returns The annotated recipe with structured ingredients and instruction annotations
 */
export async function annotateRecipe(
  recipe: BasicRecipe,
): Promise<Result<AnnotatedRecipe>> {
  try {
    // Ensure API key is available
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("Missing ANTHROPIC_API_KEY");
    }

    const anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Define the prompt for the AI model
    const prompt = `
You're an expert at parsing recipe data. I have already extracted the basic recipe information and need your help with:
1. Parsing the ingredients into structured data
2. Annotating the instructions to link to the ingredients

Basic recipe info:
- Title: ${recipe.title}
- Description: ${recipe.description}
- Cook Time: ${recipe.cookTime ?? 0} minutes
- Prep Time: ${recipe.prepTime ?? 0} minutes

Raw Ingredients (as strings):
${JSON.stringify(recipe.ingredients, null, 2)}

Raw Instructions (as strings):
${JSON.stringify(recipe.instructions, null, 2)}

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
`;

    // Use the Vercel AI SDK to generate the structured recipe
    const aiEnhancedRecipe = await generateObject({
      model: anthropic("claude-3-5-sonnet-20240620"),
      schema: annotatedRecipeSchema,
      prompt,
    });

    // Combine the directly extracted data with the AI-enhanced data
    const finalRecipe = {
      ...aiEnhancedRecipe.object,
      title: recipe.title,
      description: recipe.description,
      imageUrl: recipe.imageUrl,
      cookTime: recipe.cookTime ?? aiEnhancedRecipe.object.cookTime,
      prepTime: recipe.prepTime ?? aiEnhancedRecipe.object.prepTime,
    };

    console.log("AI annotation complete");
    return success(finalRecipe);
  } catch (error) {
    console.error("Error annotating recipe with AI:", error);
    return failure(
      error instanceof Error
        ? error
        : new Error("Unknown error annotating recipe with AI"),
    );
  }
}
