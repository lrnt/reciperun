import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['./api/index.ts'],
  noExternal: [
    '@reciperun/auth',
    '@reciperun/db',
    '@reciperun/trpc'
  ],
  sourcemap: true,
  format: 'esm',
})