# Phase 1: Foundation and Architecture Skeleton - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the 3-layer architecture skeleton: DB schema (5 tables), data access layer (`lib/db/`), Supabase clients with `server-only` enforcement, TypeScript types (auto-generated from Supabase), and Zod schemas. Project scaffolded with Next.js 15 App Router, Tailwind CSS 4, Shadcn/ui, and TanStack Query configured. All subsequent feature code builds on these foundations.

</domain>

<decisions>
## Implementation Decisions

### DB Schema Design
- Message roles stored as **PostgreSQL enum type** (`CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system')`) -- enforced at DB level
- `users` table synced from `auth.users` via **database trigger** (auto-insert on signup) -- columns: id (FK to auth.users), email, display_name, created_at
- `anonymous_usage` tracks free questions with **fingerprint + counter row** -- one row per fingerprint: id, fingerprint (unique), question_count, last_question_at, created_at. Server validates count < 3
- `documents` table stores **extracted text inline + original file in Supabase Storage** -- columns: id, chat_id, file_name, file_type, file_url (Supabase Storage), extracted_text (TEXT), created_at

### Project Setup & Tooling
- Package manager: **pnpm**
- Linting/formatting: **ESLint + Prettier** (next/core-web-vitals + typescript-eslint)
- Folder structure: **Feature-grouped under layers**:
  - `lib/db/{users,chats,messages,documents,anonymous}.ts` -- one file per table
  - `lib/schemas/` -- Zod schemas for API validation
  - `lib/types/` -- shared TypeScript types (including auto-generated Supabase types)
  - `app/api/{auth,chats,messages}/route.ts` -- API routes
  - `app/(auth)/` -- auth pages route group
  - `app/(main)/` -- protected pages route group
  - `components/{ui,chat,sidebar}/` -- grouped by feature
  - `hooks/` -- TanStack Query hooks
- Path aliases: **`@/*` mapped to `./*`** via tsconfig paths

### Data Access Layer Patterns
- Error handling: **Throw errors in DB layer, catch in API routes** -- DB functions throw `DatabaseError`, API routes wrap in try/catch and return appropriate HTTP status codes
- Return types: **Inferred from Supabase + Zod parse** -- auto-generate types via `supabase gen types`, DB functions return Supabase-typed rows, Zod schemas validate API input/output separately
- Import pattern: **Direct per-module imports** -- `import { getChatById } from '@/lib/db/chats'`, no barrel files
- Server-only guard: **`import 'server-only'` at top of every file in `lib/db/`** -- explicit, build fails immediately if client component imports any DB function

### Supabase Migration Approach
- Schema management: **Supabase CLI migrations** -- `supabase/migrations/` with numbered SQL files, version-controlled and reproducible
- Seed data: **Minimal seed.sql** -- one test user, couple sample chats/messages for development and evaluator demo
- Development environment: **Remote Supabase project only** -- no Docker/local Supabase. Simpler setup for test assignment
- User-sync trigger: **Included in migrations** -- trigger function + trigger in migration file, fully reproducible

### Claude's Discretion
- Exact column types and constraints for remaining table fields (chats, messages)
- Index strategy beyond primary keys and foreign keys
- TanStack Query default configuration (staleTime, gcTime, retry)
- ESLint/Prettier specific rule configuration
- Shadcn/ui component selection and configuration
- .env.local template structure

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture
- `.planning/PROJECT.md` -- Architecture rules (3-layer separation, service_role server-only, no public client except Realtime)
- `.planning/REQUIREMENTS.md` -- ARCH-01, ARCH-02, ARCH-03 requirements for this phase

### Stack & Conventions
- `.planning/ROADMAP.md` -- Phase 1 success criteria (5 specific conditions that must be TRUE)

No external specs or ADRs -- requirements fully captured in PROJECT.md and decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None -- greenfield project, no existing code

### Established Patterns
- None -- this phase establishes the patterns all other phases will follow

### Integration Points
- Supabase project (remote) -- needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
- OpenAI API -- needs OPENAI_API_KEY in .env.local (used in Phase 4, but env template set up now)

</code_context>

<specifics>
## Specific Ideas

No specific requirements -- open to standard approaches. The assignment spec prescribes the stack; this phase focuses on setting it up correctly with clean architecture.

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-and-architecture-skeleton*
*Context gathered: 2026-03-27*
