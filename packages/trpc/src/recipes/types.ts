import type { inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "../root";

export type RouterOutput = inferRouterOutputs<AppRouter>;

export type Recipe = RouterOutput["recipes"]["getById"];
export type RecipeList = RouterOutput["recipes"]["getAll"];
export type RecipeListItem = RouterOutput["recipes"]["getAll"][number];

export type Annotations = Recipe["instructions"][number]["annotations"];
export type Annotation = NonNullable<Annotations>[number];

export type Ingredient = Recipe["ingredients"][number];
export type Instruction = Recipe["instructions"][number];
