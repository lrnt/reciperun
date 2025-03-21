import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['./src/vercel.ts'],
  noExternal: [
    '@reciperun/auth',
    '@reciperun/db',
    '@reciperun/trpc'
  ],
  sourcemap: true,
  format: 'esm',
  clean: true,
})