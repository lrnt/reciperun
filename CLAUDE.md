# RecipeRun Development Guide

## Project Overview
RecipeRun is a full-stack application for recipe management with a mobile app (Expo) and backend API. It uses the T3 stack in a Turborepo monorepo structure.

## Tech Stack
- **Frontend**: React Native (Expo), TailwindCSS (NativeWind)
- **Backend**: Hono.js, tRPC
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: better-auth

## Repository Structure
- **apps/**: Application code
  - **backend/**: Hono.js API server
  - **expo/**: Mobile app
- **packages/**: Shared libraries
  - **auth/**: Authentication logic
  - **db/**: Database schema and client
  - **trpc/**: API router definitions
- **tooling/**: Development tools configuration

## Setup
1. Install dependencies: `pnpm i`
2. Copy `.env.example` to `.env` and configure
3. Push database schema: `pnpm db:push`
4. Start development servers: `pnpm dev`

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

## Authentication
The project uses better-auth for authentication with email/password support. Mobile authentication works through an API endpoint at `/api/auth/*`.

## Deployment
- Backend: Deploy to Vercel or similar platform
- Mobile: Build using Expo EAS and submit to app stores

## Code Style
- TypeScript: Strict mode, no non-null assertions
- Imports: Order by type → React → Expo → 3rd party → local → relative
- Naming: PascalCase for components/types, camelCase for variables/functions
- Environment: Always use `import { env } from '~/env'` instead of process.env
- Error Handling: No non-null assertions, proper error checks
- Results Pattern: Do not wrap calls in try catch, use the tryCatch function and results pattern
- Early returns: Favor a linear flow with no nested if/else, use a return early pattern
- Monorepo: Packages in `/packages`, apps in `/apps`, tooling in `/tooling`
- Styling: Tailwind CSS for styling (packages tailwind and nativewind)

## Design Aesthetic

1. **Color Palette**: 
   - White content areas for recipes and instructions
   - Accent colors for interactive elements (highlighted text, buttons)

2. **Typography**:
   - Clean sans-serif fonts throughout
   - Bold headers with high contrast against backgrounds
   - Hierarchical text sizing for easy scanning (larger titles, medium subheadings, smaller body text)

3. **UI Components**:
   - Rounded corners on all containers and cards
   - Simple iconography with consistent styling
   - Generous white space between elements
   - Shadow effects for subtle depth on cards

4. **Layout Structure**:
   - Single column, vertically scrolling content
   - Card-based information presentation
   - Clear step numbering for recipes
   - Bottom navigation with simple icons

5. **Visual Elements**:
   - High-quality food photography with consistent styling
   - Minimal decorative elements (only where they add value)
   - Progress indicators (timer circles) for action steps
   - Small badges/awards displayed subtly

6. **Interaction Design**:
   - Prominent tap targets
   - Clear visual feedback for interactive elements
   - Simplified user flows with minimal steps
   - "Hands-free" consideration for cooking contexts

This design approach prioritizes clarity, usability, and visual appeal for a cooking app, making information easily scannable while cooking.