import baseConfig from "@reciperun/eslint-config/base";
import reactConfig from "@reciperun/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ["dist/**"],
  },
  ...baseConfig,
  ...reactConfig,
];
