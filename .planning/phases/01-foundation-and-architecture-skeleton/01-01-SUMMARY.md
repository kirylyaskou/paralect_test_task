---
phase: 01-foundation-and-architecture-skeleton
plan: 01
subsystem: infra
tags: [nextjs, tailwind-v4, shadcn, tanstack-query, supabase, typescript, eslint, prettier, oklch]

# Dependency graph
requires: []
provides:
  - "Next.js 16 project with App Router, TypeScript strict, Tailwind CSS 4"
  - "Shadcn/ui initialized with OKLCH theme variables (light/dark)"
  - "TanStack Query v5 provider with singleton pattern"
  - "next-themes ThemeProvider for dark/light mode"
  - "ESLint flat config with Prettier integration"
  - "DatabaseError class for DB layer error handling"
  - "Directory structure: lib/db, lib/schemas, lib/types, components/ui, hooks, supabase/migrations"
  - ".env.example template for all required environment variables"
affects: [01-02, 01-03, 02, 03, 04, 05]

# Tech tracking
tech-stack:
  added: [next@16.2.1, react@19.2.4, typescript@5.9.3, tailwindcss@4.2.2, shadcn@4.1.1, "@supabase/supabase-js@2.100.1", "@tanstack/react-query@5.95.2", zod@4.3.6, server-only@0.0.1, next-themes@0.4.6, prettier@3.8.1, eslint-config-prettier@10.1.8, supabase-cli@2.84.4, tw-animate-css@1.4.0, lucide-react]
  patterns: [tanstack-query-singleton-provider, next-themes-class-attribute, oklch-color-variables, eslint-flat-config]

key-files:
  created: [app/providers.tsx, lib/errors.ts, .env.example, .prettierrc, components.json]
  modified: [package.json, app/layout.tsx, app/page.tsx, app/globals.css, eslint.config.mjs, tsconfig.json, .gitignore]

key-decisions:
  - "Used Next.js 16.2.1 (latest stable from create-next-app) instead of 15.5.14 from research -- shadcn v4 targets Next.js 16"
  - "TanStack Query uses getQueryClient() singleton pattern (not useState) per v5 docs to avoid suspense boundary issues"
  - "Inter font loaded via next/font/google for zero layout shift"

patterns-established:
  - "Provider tree pattern: QueryClientProvider > ThemeProvider > children > ReactQueryDevtools"
  - "DatabaseError class wraps PostgrestError with code/details for structured error handling"
  - "OKLCH color variables via shadcn init -- all theming through CSS custom properties"
  - "ESLint flat config with eslint-config-prettier/flat for formatting conflict resolution"

requirements-completed: [ARCH-01]

# Metrics
duration: 12min
completed: 2026-03-28
---

# Phase 01 Plan 01: Project Scaffolding Summary

**Next.js 16 project with Tailwind CSS 4, Shadcn/ui OKLCH theming, TanStack Query v5 singleton provider, next-themes dark/light toggle, ESLint+Prettier, and DatabaseError class**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-27T22:03:39Z
- **Completed:** 2026-03-27T22:15:43Z
- **Tasks:** 2
- **Files modified:** 19

## Accomplishments
- Full Next.js 16 project with TypeScript strict mode, Tailwind CSS 4, and Shadcn/ui OKLCH theme
- TanStack Query v5 provider using getQueryClient() singleton pattern (avoids hydration issues)
- next-themes ThemeProvider configured with class attribute and system default theme
- ESLint flat config with Prettier integration -- build and lint pass cleanly
- DatabaseError class ready for DB layer consumption in subsequent plans
- All required directories created for layer separation (lib/db, lib/schemas, lib/types, etc.)

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js 15 project, install all dependencies, configure ESLint + Prettier** - `4e774de` (feat)
2. **Task 2: Create providers, root layout, placeholder page, and DatabaseError class** - `42d5bc1` (feat)

## Files Created/Modified
- `package.json` - Project manifest with all core and dev dependencies
- `app/providers.tsx` - Client-side provider tree (QueryClientProvider + ThemeProvider + DevTools)
- `app/layout.tsx` - Root layout with Inter font, metadata, Providers wrapper, suppressHydrationWarning
- `app/page.tsx` - Minimal placeholder page ("Chatbot" / "Application is loading...")
- `app/globals.css` - Tailwind v4 imports + Shadcn OKLCH theme variables (light/dark)
- `lib/errors.ts` - DatabaseError class wrapping PostgrestError
- `eslint.config.mjs` - ESLint flat config with next/core-web-vitals, typescript, and prettier
- `.prettierrc` - Prettier config (no semi, single quotes, trailing comma es5)
- `.env.example` - Environment variable template (Supabase, OpenAI, public anon key)
- `tsconfig.json` - TypeScript strict mode with @/* path alias
- `.gitignore` - Updated with .env.local and supabase/.temp/
- `components.json` - Shadcn/ui configuration (neutral base, OKLCH)
- `lib/utils.ts` - Shadcn utility (cn function for class merging)
- `components/ui/button.tsx` - Shadcn button component (scaffolded by init)

## Decisions Made
- **Next.js 16 instead of 15:** create-next-app@latest produces Next.js 16.2.1; shadcn v4 targets this version. Staying with 16 avoids compatibility issues between shadcn v4 CSS imports and Next.js 15.
- **TanStack Query singleton pattern:** Using `getQueryClient()` module-level singleton instead of `useState(() => new QueryClient())` per TanStack v5 docs, preventing hydration/suspense issues.
- **Inter font:** Loaded via `next/font/google` in layout.tsx for zero layout shift, matching UI-SPEC typography contract.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Next.js version compatibility**
- **Found during:** Task 1 (project scaffolding)
- **Issue:** create-next-app@latest installs Next.js 16.2.1, not 15.5.14 as referenced in research. Build failed when trying to downgrade to 15 due to shadcn v4 CSS import (`shadcn/tailwind.css`) incompatibility.
- **Fix:** Kept Next.js 16.2.1 which is the compatible version for shadcn v4.1.1. The research version numbers were based on npm registry at research time; create-next-app now defaults to Next.js 16.
- **Files modified:** package.json
- **Verification:** `pnpm build` and `pnpm lint` pass cleanly
- **Committed in:** 4e774de (Task 1 commit)

**2. [Rule 3 - Blocking] NODE_ENV conflict during build**
- **Found during:** Task 1 (build verification)
- **Issue:** Shell had NODE_ENV=development set, causing Next.js 16 build to fail with `_global-error` prerendering error (useContext null reference).
- **Fix:** Unset NODE_ENV before build (next build internally sets NODE_ENV=production). This is a development environment issue, not a code issue -- Vercel/CI environments handle this correctly.
- **Files modified:** None
- **Verification:** `pnpm build` succeeds without NODE_ENV set
- **Committed in:** N/A (environment fix, no code change)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes necessary for build success. Next.js 16 is the forward-compatible choice since shadcn v4 targets it. No scope creep.

## Issues Encountered
- create-next-app refuses to scaffold when existing files are present -- temporarily moved .planning/ and plans/ directories out, then restored after scaffolding.
- create-next-app interactive prompts (React Compiler, AGENTS.md) required piping input via `yes ""` to auto-accept defaults.

## Known Stubs
None -- all wired functionality is real (providers, layout, error class). The placeholder page text "Application is loading..." is intentional per UI-SPEC copywriting contract and will be replaced by actual chat UI in Phase 3.

## User Setup Required
None - no external service configuration required for this plan.

## Next Phase Readiness
- Project builds and lints cleanly
- Provider tree (TanStack Query + next-themes) ready for components
- DatabaseError class ready for DB layer functions in Plan 02
- Directory structure established for all layers (lib/db/, lib/schemas/, components/ui/, etc.)
- Shadcn/ui initialized -- components can be added on-demand via `pnpm dlx shadcn@latest add <component>`

---
## Self-Check: PASSED

All claimed files exist. All commit hashes verified.

---
*Phase: 01-foundation-and-architecture-skeleton*
*Completed: 2026-03-28*
