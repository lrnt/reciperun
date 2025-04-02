import { integer, json, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { generateId } from "../utils";
import { user } from "./auth";

export const recipe = pgTable("recipe", {
  id: text("id").primaryKey().$defaultFn(generateId),
  title: text("title").notNull(),
  description: text("description").notNull(),
  prepTime: integer("prep_time").notNull(),
  cookTime: integer("cook_time").notNull(),
  imageUrl: text("image_url"),
  userId: text("user_id").references(() => user.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const ingredient = pgTable("ingredient", {
  id: text("id").primaryKey().$defaultFn(generateId),
  recipeId: text("recipe_id")
    .notNull()
    .references(() => recipe.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  quantity: integer("quantity"),
  unit: text("unit"),
  note: text("note"),
  order: integer("order").notNull(),
});

export const instruction = pgTable("instruction", {
  id: text("id").primaryKey().$defaultFn(generateId),
  recipeId: text("recipe_id")
    .notNull()
    .references(() => recipe.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  annotatedText: text("annotated_text"),
  annotations: json("annotations"),
  order: integer("order").notNull(),
});
