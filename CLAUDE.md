# RecipeRun Development Guide

## Commands
- Build: `pnpm build` - Build all packages and apps
- Dev: `pnpm dev` - Start all dev servers
- TypeCheck: `pnpm typecheck` - Check types
- Lint: `pnpm lint` - Run ESLint
- Lint + Fix: `pnpm lint:fix` - Run ESLint with auto-fix
- Format: `pnpm format` - Check formatting
- Format + Fix: `pnpm format:fix` - Fix formatting
- DB: `pnpm db:push` - Push schema changes
- DB Studio: `pnpm db:studio` - Open DB UI

## Code Style
- TypeScript: Strict mode, no non-null assertions
- Imports: Order by type → React → Expo → 3rd party → local → relative
- Naming: PascalCase for components/types, camelCase for variables/functions
- Environment: Always use `import { env } from '~/env'` instead of process.env
- Error Handling: No non-null assertions, proper error checks
- Monorepo: Packages in `/packages`, apps in `/apps`, tooling in `/tooling`
- Styling: Tailwind CSS for styling (packages tailwind and nativewind)