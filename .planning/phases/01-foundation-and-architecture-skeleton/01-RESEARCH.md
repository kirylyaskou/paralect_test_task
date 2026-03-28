# Phase 1: Foundation and Architecture Skeleton - Research

**Researched:** 2026-03-28
**Domain:** Next.js 15 App Router, Supabase (PostgreSQL + CLI), Tailwind CSS 4, Shadcn/ui, TanStack Query v5, Zod, TypeScript, server-only enforcement
**Confidence:** HIGH

## Summary

Phase 1 establishes the project scaffolding and architectural skeleton that all subsequent phases build on. The core technical challenge is enforcing the strict 3-layer separation (DB -> API -> Client) at build time using the `server-only` npm package, while setting up Supabase with service_role key isolation, database schema with 5 tables, and auto-generated TypeScript types.

The entire stack is mature and well-documented. Next.js 15 App Router with Tailwind CSS 4 is the current standard scaffolding via `create-next-app`. Shadcn/ui has native Tailwind v4 support with OKLCH colors. Supabase CLI supports a remote-only workflow (no Docker needed) via `supabase link` + `supabase db push`. TanStack Query v5 has a documented Next.js App Router provider pattern. The `server-only` package provides build-time enforcement of server-only modules -- importing from a Client Component causes a compile error.

**Primary recommendation:** Use `pnpm create next-app@latest` with defaults (TypeScript, Tailwind, ESLint, App Router), then layer in Shadcn/ui, Supabase, TanStack Query, and Zod. Write migrations as local SQL files in `supabase/migrations/` and push to remote with `supabase db push`. Use `import 'server-only'` at the top of every file in `lib/db/` and the Supabase service_role client file.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Message roles stored as **PostgreSQL enum type** (`CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system')`) -- enforced at DB level
- `users` table synced from `auth.users` via **database trigger** (auto-insert on signup) -- columns: id (FK to auth.users), email, display_name, created_at
- `anonymous_usage` tracks free questions with **fingerprint + counter row** -- one row per fingerprint: id, fingerprint (unique), question_count, last_question_at, created_at. Server validates count < 3
- `documents` table stores **extracted text inline + original file in Supabase Storage** -- columns: id, chat_id, file_name, file_type, file_url (Supabase Storage), extracted_text (TEXT), created_at
- Package manager: **pnpm**
- Linting/formatting: **ESLint + Prettier** (next/core-web-vitals + typescript-eslint)
- Folder structure: **Feature-grouped under layers** as specified in CONTEXT.md
- Path aliases: **`@/*` mapped to `./*`** via tsconfig paths
- Error handling: **Throw errors in DB layer, catch in API routes** -- DB functions throw `DatabaseError`, API routes wrap in try/catch and return appropriate HTTP status codes
- Return types: **Inferred from Supabase + Zod parse** -- auto-generate types via `supabase gen types`, DB functions return Supabase-typed rows, Zod schemas validate API input/output separately
- Import pattern: **Direct per-module imports** -- `import { getChatById } from '@/lib/db/chats'`, no barrel files
- Server-only guard: **`import 'server-only'` at top of every file in `lib/db/`** -- explicit, build fails immediately if client component imports any DB function
- Schema management: **Supabase CLI migrations** -- `supabase/migrations/` with numbered SQL files, version-controlled and reproducible
- Seed data: **Minimal seed.sql** -- one test user, couple sample chats/messages for development and evaluator demo
- Development environment: **Remote Supabase project only** -- no Docker/local Supabase
- User-sync trigger: **Included in migrations** -- trigger function + trigger in migration file, fully reproducible

### Claude's Discretion
- Exact column types and constraints for remaining table fields (chats, messages)
- Index strategy beyond primary keys and foreign keys
- TanStack Query default configuration (staleTime, gcTime, retry)
- ESLint/Prettier specific rule configuration
- Shadcn/ui component selection and configuration
- .env.local template structure

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ARCH-01 | Strict 3-layer separation: DB (`lib/db/`) -> API (`app/api/`) -> Client (components/hooks) | `server-only` package enforces build-time separation; folder structure documented in Architecture Patterns; import pattern locks each layer |
| ARCH-02 | Zero database calls from components (including Server Components) | `server-only` import at top of every `lib/db/` file causes build error if imported from any client module; API routes are the only bridge |
| ARCH-03 | Supabase service_role key used only in `lib/db/client.ts` | Isolated in single file with `import 'server-only'`; env var without `NEXT_PUBLIC_` prefix; `persistSession: false` configuration |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 15.5.14 | App Router framework | Latest stable Next.js 15; prescribed by assignment |
| react / react-dom | 19.0.4 | UI library | Peer dependency of Next.js 15 |
| typescript | ~5.7 | Type safety | Strict mode required; Next.js scaffolds this |
| tailwindcss | 4.2.2 | Utility CSS | Prescribed stack; v4 uses CSS-native config, no tailwind.config needed |
| @tailwindcss/postcss | 4.2.2 | PostCSS plugin | Required for Tailwind v4 integration with Next.js |
| @supabase/supabase-js | 2.100.1 | Supabase client | Database access, auth, storage -- prescribed stack |
| @tanstack/react-query | 5.95.2 | Server state management | Prescribed stack; v5 with App Router provider pattern |
| zod | 4.3.6 | Schema validation | API input validation, type inference |
| server-only | 0.0.1 | Build-time guard | Causes compile error when server module imported by client code |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-query-devtools | 5.95.2 | Query debugging | Development only; inspect cache, queries, mutations |
| shadcn (CLI) | 4.1.1 | Component scaffolding | `pnpm dlx shadcn@latest init` and `add` commands |
| tw-animate-css | 1.4.0 | Animation utilities | Tailwind v4 compatible replacement for tailwindcss-animate |
| next-themes | 0.4.6 | Dark/light toggle | Theme switching with SSR support for shadcn/ui |
| eslint | 10.1.0 | Linting | Code quality; Next.js scaffolds with flat config |
| eslint-config-next | (matches next) | Next.js rules | core-web-vitals ruleset |
| eslint-config-prettier | 10.1.8 | Disable conflicting rules | Prevents ESLint/Prettier conflicts |
| prettier | 3.8.1 | Code formatting | Consistent formatting across codebase |
| supabase (CLI) | 2.84.4 | DB migrations & types | `supabase init`, `link`, `db push`, `gen types` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| zod 4.x | zod 3.x | Zod 4 is newer (released 2025); if any compatibility issues arise, fall back to zod 3.24.x which is battle-tested |
| tw-animate-css | tailwindcss-animate | tailwindcss-animate is incompatible with Tailwind v4; tw-animate-css is the replacement |
| eslint-plugin-prettier | eslint-config-prettier only | Plugin runs Prettier as ESLint rule (slower); config-only just disables conflicts (recommended approach) |

**Installation:**
```bash
# Project scaffolding (handles next, react, typescript, tailwind, eslint)
pnpm create next-app@latest . --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*"

# Shadcn/ui initialization
pnpm dlx shadcn@latest init

# Core dependencies
pnpm add @supabase/supabase-js @tanstack/react-query zod server-only next-themes

# Dev dependencies
pnpm add -D @tanstack/react-query-devtools prettier eslint-config-prettier supabase
```

**Version verification:** All versions above confirmed against npm registry on 2026-03-28.

**Note on `--no-src-dir`:** The CONTEXT.md folder structure shows `lib/db/`, `app/api/`, `components/`, `hooks/` at root level (not inside `src/`). Use `--no-src-dir` to match this layout. The path alias `@/*` maps to `./*`.

## Architecture Patterns

### Recommended Project Structure
```
app/
  layout.tsx              # Root layout (providers, fonts, metadata)
  page.tsx                # Home page (redirects or welcome)
  globals.css             # Tailwind v4 theme + imports
  providers.tsx           # 'use client' -- QueryClientProvider wrapper
  (auth)/                 # Auth pages route group (Phase 2)
  (main)/                 # Protected pages route group (Phase 3+)
  api/
    auth/route.ts         # Auth API (Phase 2)
    chats/route.ts        # Chat CRUD API (Phase 3)
    messages/route.ts     # Message API (Phase 4)
lib/
  db/
    client.ts             # Supabase service_role client (server-only)
    users.ts              # User DB functions (server-only)
    chats.ts              # Chat DB functions (server-only)
    messages.ts           # Message DB functions (server-only)
    documents.ts          # Document DB functions (server-only)
    anonymous.ts          # Anonymous usage DB functions (server-only)
  schemas/                # Zod schemas for API validation
  types/
    supabase.ts           # Auto-generated: supabase gen types
    index.ts              # Shared TypeScript types
  errors.ts               # DatabaseError class definition
components/
  ui/                     # Shadcn/ui components (auto-generated)
  chat/                   # Chat-specific components (Phase 3+)
  sidebar/                # Sidebar components (Phase 3+)
hooks/                    # TanStack Query hooks (Phase 3+)
supabase/
  config.toml             # Supabase CLI config
  migrations/
    YYYYMMDDHHMMSS_initial_schema.sql  # All 5 tables + enum + trigger
  seed.sql                # Minimal seed data
```

### Pattern 1: Server-Only Supabase Client Isolation

**What:** Single file creating the Supabase service_role client, guarded by `server-only` import
**When to use:** Every database access goes through this client

```typescript
// lib/db/client.ts
import 'server-only'

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/supabase'

if (!process.env.SUPABASE_URL) {
  throw new Error('Missing SUPABASE_URL environment variable')
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
}

export const supabase = createClient<Database>(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
)
```

**Key details:**
- Environment variables do NOT use `NEXT_PUBLIC_` prefix -- they are server-only
- `persistSession: false` because service_role bypasses auth entirely
- The `Database` generic from auto-generated types provides full type safety
- `import 'server-only'` at the top ensures build failure if this file enters the client bundle

### Pattern 2: Database Access Layer Functions

**What:** One file per table in `lib/db/`, each with `import 'server-only'` at the top
**When to use:** Every function that reads/writes database data

```typescript
// lib/db/chats.ts
import 'server-only'

import { supabase } from './client'
import { DatabaseError } from '@/lib/errors'

export async function getChatsByUserId(userId: string) {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) {
    throw new DatabaseError('Failed to fetch chats', error)
  }

  return data
}

export async function getChatById(chatId: string) {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('id', chatId)
    .single()

  if (error) {
    throw new DatabaseError('Failed to fetch chat', error)
  }

  return data
}
```

### Pattern 3: DatabaseError Class

**What:** Custom error class for DB layer errors, wrapping Supabase PostgrestError
**When to use:** Thrown by all DB functions, caught by API routes

```typescript
// lib/errors.ts
import type { PostgrestError } from '@supabase/supabase-js'

export class DatabaseError extends Error {
  public readonly code: string | null
  public readonly details: string | null

  constructor(message: string, pgError?: PostgrestError) {
    super(message)
    this.name = 'DatabaseError'
    this.code = pgError?.code ?? null
    this.details = pgError?.details ?? null
  }
}
```

### Pattern 4: TanStack Query Provider (App Router)

**What:** Client component wrapping the app with QueryClientProvider
**When to use:** Root layout, wraps all pages

```typescript
// app/providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from 'next-themes'
import { useState, type ReactNode } from 'react'

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,       // 1 minute -- avoid refetch on mount after SSR
        gcTime: 5 * 60 * 1000,      // 5 minutes garbage collection
        retry: 1,                    // One retry on failure
        refetchOnWindowFocus: false, // Disable aggressive refetching
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient()
  }
  // Browser: reuse singleton
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient()
  }
  return browserQueryClient
}

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

**Why this pattern (not `useState`):** TanStack v5 docs recommend avoiding `useState` for QueryClient creation because if a suspense boundary is missing between provider and suspending code, React will discard the client on initial render. The `getQueryClient()` singleton pattern avoids this.

### Pattern 5: Supabase Migration SQL

**What:** Single migration file creating all 5 tables, the enum, and the user-sync trigger
**When to use:** Initial schema setup

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_initial_schema.sql

-- Enum for message roles
CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system');

-- Users table (synced from auth.users via trigger)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger function to auto-create user row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Chats table
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  role message_role NOT NULL,
  content TEXT NOT NULL,
  image_urls TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  extracted_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Anonymous usage table
CREATE TABLE anonymous_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint TEXT NOT NULL UNIQUE,
  question_count INTEGER NOT NULL DEFAULT 0,
  last_question_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_chats_user_id ON chats(user_id);
CREATE INDEX idx_chats_updated_at ON chats(updated_at DESC);
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_documents_chat_id ON documents(chat_id);
CREATE INDEX idx_anonymous_usage_fingerprint ON anonymous_usage(fingerprint);
```

### Anti-Patterns to Avoid

- **Importing `lib/db/` in Client Components:** The `server-only` guard will cause a build error. Always access DB through API routes.
- **Using `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`:** The `NEXT_PUBLIC_` prefix exposes the variable to the browser bundle. Use `SUPABASE_SERVICE_ROLE_KEY` (without prefix).
- **Creating Supabase client per-request in DB functions:** Create one client in `lib/db/client.ts` and import it. The service_role client is stateless (no session), so a singleton is fine.
- **Using barrel files (`index.ts`) in `lib/db/`:** CONTEXT.md explicitly requires direct per-module imports. Barrel files can cause tree-shaking issues and accidental server-only leaks.
- **Putting `import 'server-only'` only in `client.ts`:** Every file in `lib/db/` must have its own `import 'server-only'` because a file could be imported directly without going through `client.ts`.
- **Using `@supabase/ssr` for service_role client:** The SSR helper is for cookie-based auth sessions. The service_role client should use `@supabase/supabase-js` directly with `persistSession: false`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Server/client boundary enforcement | Custom webpack checks | `server-only` npm package | Built-in Next.js support, zero config, build-time error |
| Component library | Custom design system | Shadcn/ui (`pnpm dlx shadcn@latest add`) | Copy-paste components, Tailwind v4 native, accessible |
| Dark/light theme | Custom CSS class toggling | next-themes + Shadcn theming | SSR-safe, no flash of wrong theme, localStorage persistence |
| Query state management | Custom fetch + useState | TanStack Query v5 | Caching, deduplication, retry, devtools, optimistic updates |
| Form/API validation | Custom validators | Zod schemas with `safeParse` | Type inference, composable, standard ecosystem choice |
| DB type generation | Manual TypeScript interfaces | `supabase gen types typescript` | Auto-syncs with schema, catches drift, zero maintenance |
| CSS animations | Custom keyframes | tw-animate-css | Tailwind v4 compatible, works with shadcn/ui out of the box |

**Key insight:** Every library in this stack was prescribed by the assignment. Hand-rolling any of these would waste time and score poorly with evaluators who expect idiomatic use of the specified tools.

## Common Pitfalls

### Pitfall 1: Tailwind v4 Config Confusion
**What goes wrong:** Developers create `tailwind.config.ts` from muscle memory, but Tailwind v4 uses CSS-native configuration in `globals.css` with `@theme inline` blocks.
**Why it happens:** Tailwind v3 required a JS/TS config file; v4 eliminated it.
**How to avoid:** Do NOT create `tailwind.config.ts`. All theme customization goes in `globals.css` using `@theme inline { ... }` syntax. `create-next-app` with `--tailwind` flag scaffolds this correctly.
**Warning signs:** If you see a `tailwind.config.ts` in the project, something went wrong.

### Pitfall 2: Shadcn/ui Init Overwrites
**What goes wrong:** Running `shadcn init` overwrites `globals.css` and other config files after manual customization.
**Why it happens:** Shadcn init scaffolds theme CSS from scratch.
**How to avoid:** Run `pnpm dlx shadcn@latest init` immediately after `create-next-app`, before any manual CSS changes. Commit before and after so changes are reversible.
**Warning signs:** Lost custom CSS after adding shadcn components.

### Pitfall 3: QueryClient Hydration Mismatch
**What goes wrong:** Using `useState(() => new QueryClient())` causes React to discard the client if a suspense boundary is missing.
**Why it happens:** React throws away state during initial render when suspense triggers without a boundary.
**How to avoid:** Use the `getQueryClient()` singleton pattern shown in Pattern 4 above. This is the pattern recommended by TanStack v5 docs for App Router.
**Warning signs:** Queries re-fetching unexpectedly on page load.

### Pitfall 4: Supabase Trigger SECURITY DEFINER
**What goes wrong:** The user-sync trigger fails silently because `supabase_auth_admin` role does not have permissions to insert into `public.users`.
**Why it happens:** Triggers on `auth.users` execute as `supabase_auth_admin`, which only has permissions within the `auth` schema.
**How to avoid:** Use `SECURITY DEFINER` on the trigger function AND set `SET search_path = ''` to prevent search_path injection. The function then runs with the permissions of the user who created it (typically `postgres`).
**Warning signs:** Users can sign up but no row appears in `public.users`.

### Pitfall 5: Missing `server-only` on Individual DB Files
**What goes wrong:** A developer adds `server-only` only to `lib/db/client.ts` thinking it covers the entire directory. Another file in `lib/db/` is then imported directly by a Client Component and the service_role key leaks.
**Why it happens:** `server-only` is a per-module guard, not a per-directory guard.
**How to avoid:** Add `import 'server-only'` as the very first line of EVERY file in `lib/db/`. This is a locked decision.
**Warning signs:** Client component imports from `lib/db/` without build error.

### Pitfall 6: Wrong Supabase Package for Service Role
**What goes wrong:** Developer uses `@supabase/ssr` `createServerClient()` for the service_role client, which expects cookie-based session management.
**Why it happens:** Supabase docs primarily show `@supabase/ssr` for Next.js, but that is for user-session clients.
**How to avoid:** Use `@supabase/supabase-js` `createClient()` directly for the service_role client. Only the service_role client is needed in this architecture (no public/anon client except for Realtime in Phase 5).
**Warning signs:** Errors about missing cookies or session.

### Pitfall 7: Zod 4 Breaking Changes
**What goes wrong:** Zod 4 (released 2025) has API changes from Zod 3 -- some imports and methods differ.
**Why it happens:** Zod 4 is a major version bump with some breaking changes.
**How to avoid:** If using Zod 4.x, follow the Zod 4 migration guide. If any ecosystem compatibility issues arise (e.g., with other libraries expecting Zod 3), fall back to `zod@3.24.x`. For this project, Zod 4 should work fine since we only use standard `z.object()`, `safeParse()`, and `z.infer`.
**Warning signs:** Import errors or type mismatches after install.

## Code Examples

### ESLint Flat Config with Prettier

```javascript
// eslint.config.mjs
import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import eslintConfigPrettier from 'eslint-config-prettier/flat'

const eslintConfig = defineConfig([
  ...nextVitals,
  eslintConfigPrettier,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
])

export default eslintConfig
```

### Prettier Configuration

```json
// .prettierrc
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "printWidth": 100
}
```

### Root Layout with Providers

```typescript
// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Chatbot',
  description: 'AI Chatbot - Paralect Product Academy',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

### .env.local Template

```bash
# .env.local
# Supabase (server-only -- NO NEXT_PUBLIC_ prefix for service_role)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI (used in Phase 4, template set up now)
OPENAI_API_KEY=your-openai-api-key

# Supabase public (for Realtime only -- Phase 5)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Supabase CLI Remote-Only Workflow

```bash
# One-time setup
npx supabase init                              # Creates supabase/ directory
npx supabase login                             # Authenticate with Supabase
npx supabase link --project-ref <project-id>   # Link to remote project

# Apply migrations to remote
npx supabase db push                           # Push local migrations to remote DB

# Generate TypeScript types from remote schema
npx supabase gen types typescript --linked > lib/types/supabase.ts
```

### .gitignore Additions

```
# Environment
.env.local
.env*.local

# Supabase
supabase/.temp/
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind v3 `tailwind.config.ts` | Tailwind v4 CSS-native `@theme inline` in globals.css | Jan 2025 | No config file needed; OKLCH colors |
| HSL color variables (shadcn) | OKLCH color variables (shadcn) | 2025 | Better perceptual uniformity |
| `tailwindcss-animate` | `tw-animate-css` | 2025 | Required for Tailwind v4 compatibility |
| ESLint legacy `.eslintrc.json` | ESLint flat config `eslint.config.mjs` | 2024-2025 | `create-next-app` now scaffolds flat config by default |
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` (but NOT for service_role) | 2024 | Auth helpers deprecated; SSR package for cookie sessions |
| Supabase gen types `--project-id` | Supabase gen types `--linked` | 2024-2025 | Simpler after running `supabase link` |
| TanStack Query `useState` provider | `getQueryClient()` singleton pattern | 2024 | Avoids suspense boundary issues in App Router |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Deprecated in favor of `@supabase/ssr`. Not needed here since we use service_role directly.
- `tailwindcss-animate`: Incompatible with Tailwind v4. Use `tw-animate-css` instead.
- `.eslintrc.json`: Legacy format. Use `eslint.config.mjs` (flat config).
- `tailwind.config.ts`: Not used in Tailwind v4. All configuration in `globals.css`.

## Open Questions

1. **Zod 4 vs Zod 3 ecosystem compatibility**
   - What we know: Zod 4.3.6 is the latest. API is mostly backward-compatible for basic usage (`z.object`, `safeParse`, `z.infer`).
   - What's unclear: Whether all ecosystem tools (e.g., potential future use of `next-zod-route` or form libraries) support Zod 4 yet.
   - Recommendation: Use Zod 4. If any compatibility issue surfaces in later phases, downgrade to `zod@3.24.x` -- the migration is trivial for the basic schemas used here.

2. **Supabase free tier trigger restrictions**
   - What we know: Some reports of free tier projects not allowing triggers on `auth.users` due to ownership restrictions.
   - What's unclear: Whether this is still the case on current Supabase free tier (some fixes were shipped).
   - Recommendation: Include the trigger in migrations. If `db push` fails on the trigger, fall back to creating the trigger via the Supabase dashboard SQL editor (which runs as `postgres` role). Document this in the README.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js (>=20.9) | Yes | 22.13.1 | -- |
| pnpm | Package management | Yes | 10.15.0 | -- |
| Supabase CLI | Migrations, type gen | Yes | 2.84.4 | -- |
| Remote Supabase project | Database | External (requires setup) | -- | Must be created manually in Supabase dashboard |

**Missing dependencies with no fallback:**
- A Supabase project must be created in the dashboard before `supabase link` can be run. The project ref and service_role key are needed in `.env.local`.

**Missing dependencies with fallback:**
- None -- all local tools are available.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected (greenfield) -- recommend minimal smoke tests |
| Config file | None -- see Wave 0 |
| Quick run command | `pnpm build` (compile-time checks are the primary validation for this phase) |
| Full suite command | `pnpm build && pnpm lint` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ARCH-01 | 3-layer separation enforced | build/compile | `pnpm build` (server-only import causes failure if violated) | N/A -- build system |
| ARCH-02 | Zero DB calls from components | build/compile | `pnpm build` (server-only guard) | N/A -- build system |
| ARCH-03 | service_role key isolated in single file | manual review + build | `pnpm build` + verify only `lib/db/client.ts` imports the key | N/A -- structural |

### Sampling Rate
- **Per task commit:** `pnpm build && pnpm lint`
- **Per wave merge:** `pnpm build && pnpm lint`
- **Phase gate:** `pnpm build` succeeds + manual verification of: (1) all 5 tables exist via Supabase dashboard, (2) `server-only` import in every `lib/db/` file, (3) service_role key only in `lib/db/client.ts`

### Wave 0 Gaps
- The primary validation for this phase is `pnpm build` -- TypeScript compilation + Next.js build catches `server-only` violations at compile time. No additional test framework is needed for Phase 1.
- A formal test framework (e.g., Vitest) should be introduced in Phase 2 when testable behavior (auth flows, API routes) begins.

## Sources

### Primary (HIGH confidence)
- [Next.js Installation Docs](https://nextjs.org/docs/app/getting-started/installation) - create-next-app defaults, Tailwind v4, App Router
- [Next.js Server/Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components) - server-only behavior
- [Shadcn/ui Next.js Installation](https://ui.shadcn.com/docs/installation/next) - init command, Tailwind v4 support
- [Shadcn/ui Tailwind v4 Guide](https://ui.shadcn.com/docs/tailwind-v4) - OKLCH colors, @theme inline
- [TanStack Query Advanced SSR](https://tanstack.com/query/v5/docs/react/guides/advanced-ssr) - App Router provider pattern
- [Supabase Generating Types](https://supabase.com/docs/guides/api/rest/generating-types) - supabase gen types workflow
- [Supabase Triggers Docs](https://supabase.com/docs/guides/database/postgres/triggers) - auth.users trigger pattern
- [Supabase Enums Docs](https://supabase.com/docs/guides/database/postgres/enums) - PostgreSQL enum creation
- [Supabase CLI db push](https://supabase.com/docs/reference/cli/supabase-db-push) - remote migration push
- npm registry (2026-03-28) - all version numbers verified

### Secondary (MEDIUM confidence)
- [Supabase GitHub Discussion #30739](https://github.com/orgs/supabase/discussions/30739) - service_role client pattern with server-only
- [Supabase GitHub Discussion #306](https://github.com/orgs/supabase/discussions/306) - auth.users trigger to public profiles
- [Builder.io: Server-only in Next.js](https://www.builder.io/blog/server-only-next-app-router) - server-only package explanation
- [Next.js ESLint flat config docs](https://nextjs.org/docs/pages/api-reference/config/eslint) - defineConfig approach
- [eslint-config-prettier GitHub](https://github.com/prettier/eslint-config-prettier) - flat config integration
- [Storieasy: TanStack + App Router Guide](https://www.storieasy.com/blog/integrate-tanstack-query-with-next-js-app-router-2025-ultimate-guide) - provider pattern confirmation

### Tertiary (LOW confidence)
- Zod 4 ecosystem compatibility: only verified for basic API (z.object, safeParse, z.infer). Full ecosystem compatibility not confirmed.
- Supabase free tier trigger restrictions: anecdotal reports, may have been resolved.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all versions verified against npm registry, all libraries prescribed by assignment
- Architecture: HIGH - patterns verified against official docs for server-only, Supabase, TanStack Query
- Pitfalls: HIGH - documented in official sources and community discussions
- Migration SQL: MEDIUM - trigger SECURITY DEFINER pattern confirmed, but free tier behavior not fully verified

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (stable stack, all major versions settled)
