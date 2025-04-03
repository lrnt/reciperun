import { z } from "zod";

// Ingredient for annotated recipe
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

// Annotation for instruction step
export const annotationSchema = z.object({
  ingredientIndex: z
    .number()
    .optional()
    .describe(
      "Index of the ingredient in the recipe's ingredients array (zero-based). This creates the second level of the annotation system, connecting the annotation to the actual ingredient.",
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

const checkAnnotationReferences = (
  data: InstructionStep,
  ctx: z.RefinementCtx,
) => {
  // If no annotatedText, skip validation
  if (!data.annotatedText) return;

  // If annotatedText exists but no annotations, it's invalid
  if (!data.annotations || data.annotations.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "AnnotatedText exists but no annotations array was provided",
      path: ["annotations"],
    });
    return z.NEVER;
  }

  // Extract all reference indices from annotatedText using regex
  const linkPattern = /\[.*?\]\(#(\d+)\)/g;
  const annotatedText = data.annotatedText;
  const matches = [...annotatedText.matchAll(linkPattern)];

  // If no references found but annotations exist, that's a mismatch
  if (matches.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Annotations exist but no references found in annotatedText",
      path: ["annotatedText"],
    });
    return z.NEVER;
  }

  // Check each reference individually
  matches.forEach((match) => {
    const refIndex = parseInt(match[1] ?? "0");

    // Check if index is valid (non-negative)
    if (refIndex < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid annotation reference: negative index #${refIndex} in "${match[0]}"`,
        path: ["annotatedText"],
      });
    }
    // Check if reference has a corresponding annotation
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (refIndex >= data.annotations!.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        message: `Invalid annotation reference: index #${refIndex} exceeds annotations array length (${data.annotations!.length})`,
        path: ["annotatedText"],
      });
    }
  });
};

// Instruction step for annotated recipe
export const instructionStepSchemaWithoutCheck = z.object({
  text: z.string().describe("Plain text instruction without any annotations"),
  annotatedText: z
    .string()
    .optional()
    .describe(
      "Instruction text with markdown-style links that reference positions in the annotations array. For example, in 'Mix [flour](#0) and [sugar](#1)', #0 refers to annotations[0] and #1 refers to annotations[1]. The ingredient names in brackets are displayed to the user, while the numbers in parentheses link to the metadata in the annotations array.",
    ),
  annotations: z
    .array(annotationSchema)
    .optional()
    .describe(
      "Array of annotation objects containing metadata about ingredients mentioned in annotatedText. In the annotatedText, #0 refers to annotations[0], #1 to annotations[1], etc. Each annotation typically contains an ingredientIndex pointing to the actual ingredient in the ingredients array.",
    ),
});
export type InstructionStep = z.infer<typeof instructionStepSchemaWithoutCheck>;
export const instructionStepSchema =
  instructionStepSchemaWithoutCheck.superRefine(checkAnnotationReferences);

const checkAnnotationIngredientIndices = (
  recipe: AnnotatedRecipe,
  ctx: z.RefinementCtx,
) => {
  recipe.instructions.forEach((instruction, instructionIndex) => {
    if (!instruction.annotations) return;

    instruction.annotations.forEach((annotation, annotationIndex) => {
      const ingredientIndex = annotation.ingredientIndex;

      if (ingredientIndex === undefined) return;

      if (ingredientIndex < 0 || ingredientIndex >= recipe.ingredients.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invalid ingredient index: ${ingredientIndex} is out of bounds (0-${recipe.ingredients.length - 1})`,
          path: [
            `instructions`,
            instructionIndex,
            `annotations`,
            annotationIndex,
            `ingredientIndex`,
          ],
        });
      }
    });
  });
};

// Annotated recipe
const annotatedRecipeSchemaWithoutChecks = z.object({
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
export type AnnotatedRecipe = z.infer<
  typeof annotatedRecipeSchemaWithoutChecks
>;
export const annotatedRecipeSchema =
  annotatedRecipeSchemaWithoutChecks.superRefine(
    checkAnnotationIngredientIndices,
  );

// Recipe with id
const recipeWithIdSchemaWithoutChecks =
  annotatedRecipeSchemaWithoutChecks.extend({
    id: z.string().describe("Unique identifier for the recipe"),
  });
export type RecipeWithId = z.infer<typeof recipeWithIdSchemaWithoutChecks>;
export const recipeWithIdSchema = recipeWithIdSchemaWithoutChecks.superRefine(
  checkAnnotationIngredientIndices,
);

// Basic recipe
export const basicRecipeSchema = z.object({
  title: z.string().describe("Name of the recipe"),
  description: z
    .string()
    .describe("Brief summary or introduction to the recipe"),
  ingredients: z
    .array(z.string())
    .describe("List of all ingredients needed for the recipe"),
  instructions: z
    .array(z.string())
    .describe("Step-by-step cooking instructions"),
  prepTime: z.number().describe("Preparation time in minutes").optional(),
  cookTime: z.number().describe("Cooking time in minutes").optional(),
  totalTime: z
    .number()
    .describe("Total time in minutes (prep + cook)")
    .optional(),
  servings: z.number().describe("Number of servings the recipe makes"),
  imageUrl: z
    .string()
    .optional()
    .describe("URL to an image of the completed dish"),
});
export type BasicRecipe = z.infer<typeof basicRecipeSchema>;
