# Deferred Items - Phase 02

## Pre-existing Build Failure

- **Issue:** `pnpm build` fails on `/_global-error` prerendering with `TypeError: Cannot read properties of null (reading 'useContext')`
- **Root cause:** `next-themes` ThemeProvider uses React context which is not available during static prerendering of the auto-generated `_global-error` page in Next.js 16
- **Impact:** Build command fails, but TypeScript compilation (`tsc --noEmit`) passes cleanly
- **Scope:** Pre-existing on main branch, not caused by Phase 2 changes
- **Suggested fix:** Add a `global-error.tsx` file that does not use ThemeProvider, or conditionally wrap with ThemeProvider
