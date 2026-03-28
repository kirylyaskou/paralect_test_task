# Stack Research

**Domain:** ChatGPT-like chatbot web application
**Researched:** 2026-03-27
**Confidence:** HIGH

## Version Decision: Next.js 15 (Not 16)

The project spec prescribes **Next.js 15**. While Next.js 16 (16.2 as of March 2026) is the latest, the assignment explicitly says "Next.js 15 + App Router." Stick with **Next.js 15.x** (latest 15.5+) because:

1. **Assignment compliance** -- the spec says Next.js 15, so that is what evaluators will expect.
2. **Architecture requirement conflicts with Next.js 16 changes** -- the project requires strict REST API routes (`app/api/`). Next.js 16 pushes toward Server Actions and renames `middleware.ts` to `proxy.ts`. These shifts add confusion without value for this assignment.
3. **Stability** -- Next.js 15 is in Maintenance LTS with active security patches. It is production-ready and well-documented.
4. **Async Request APIs** -- Next.js 15 already introduced async `params`, `cookies()`, `headers()` but with synchronous fallback. This means less migration friction if the evaluators test on 15.x.

If for any reason Next.js 16 is required, the main migration steps are: async request APIs fully enforced, `middleware.ts` renamed to `proxy.ts`, Turbopack becomes default, and `"use cache"` replaces implicit caching.

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 15.5.x (latest 15.x) | Full-stack React framework with App Router | Assignment-prescribed. App Router gives file-based routing, API routes, middleware, server/client component separation. LTS with security patches. |
| React | 19.x | UI rendering | Ships with Next.js 15. Required for hooks like `useChat` from AI SDK. |
| TypeScript | 5.5+ | Type safety | Assignment requires strict TS with no `any`. Zod 4 also requires TS 5.5+. |
| Supabase (`@supabase/supabase-js`) | ^2.100.x | PostgreSQL database, Auth, Realtime, Storage | Assignment-prescribed. v2 is the current major line. Provides typed client, Auth with cookie-based sessions, Realtime subscriptions, and file storage in one service. |
| `@supabase/ssr` | ^0.9.x | Server-side cookie-based auth for Next.js | Required companion to supabase-js for App Router. Handles session cookies in middleware and server components. Replaces deprecated `@supabase/auth-helpers-nextjs`. |
| Vercel AI SDK (`ai`) | ^6.x (6.0.138+) | AI streaming, `useChat` hook, `streamText` | Assignment-prescribed. v6 is current stable. Provides `useChat` for client-side streaming UI, `streamText` for server-side SSE streaming, and provider-agnostic model interface. |
| `@ai-sdk/openai` | ^3.0.x | OpenAI provider for Vercel AI SDK | Connects AI SDK to OpenAI API. Required for `gpt-4o-mini` model calls. |
| `@ai-sdk/react` | latest | React hooks for AI SDK (`useChat`) | Provides `useChat`, `useCompletion`, and other React-specific hooks. Ships as a separate package in AI SDK 6. |
| TanStack Query (`@tanstack/react-query`) | ^5.95.x | Client-side data fetching, caching, mutations | Assignment-prescribed. Handles all non-streaming data: loading chats, CRUD operations, optimistic updates, cache invalidation. v5 is the React version (v6 is Svelte-only). |
| Shadcn/ui (CLI) | v4 (latest) | Component library (vendored, not a dependency) | Assignment-prescribed. Components are copied into your project -- zero runtime dependency. Built on Radix UI primitives + Tailwind CSS. CLI v4 (March 2026) supports framework templates and AI agent skills. |
| Tailwind CSS | ^4.x | Utility-first CSS framework | Required by Shadcn/ui. v4 is the current standard with CSS-first config (`@theme` directives), Oxide engine (5x faster builds), and native CSS variable theming. |

### AI/LLM Configuration

| Technology | Version/Model | Purpose | Why Recommended |
|------------|---------------|---------|-----------------|
| OpenAI API | Chat Completions API | LLM inference | Assignment-prescribed. Only provider needed for v1. |
| `gpt-4o-mini` | `gpt-4o-mini` (model ID) | Default chat model | Assignment-prescribed as cost-effective default. Still available in OpenAI API (no announced API deprecation date). Retired from ChatGPT UI but API access continues. 128K context, 16K output tokens. |
| `gpt-4o-mini` (vision) | Same model | Image understanding | gpt-4o-mini supports vision (image inputs). Use for paste/upload image analysis without needing a separate model. |

**Model note:** gpt-4o-mini is technically superseded by gpt-4.1-mini, gpt-5-mini, and gpt-5.4-mini. However, it remains available via API and is the cheapest option. For this demo project, it is the right choice. Design an adapter layer so the model can be swapped via environment variable.

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod` | ^4.3.x | Schema validation, type inference | Validate API request/response bodies, AI SDK tool inputs. Required by AI SDK. Use Zod 4 (current stable, massive perf improvement over v3). |
| `next-themes` | latest | Dark/light theme toggle | Shadcn/ui's recommended approach for theme switching. Wraps `ThemeProvider` in root layout, provides `useTheme` hook. Trivial setup. |
| `sonner` | latest | Toast notifications | Shadcn/ui's default toast component (the old `toast` is deprecated). Non-blocking, accessible, supports promise-based async toasts. |
| `react-markdown` | ^10.x | Render markdown in AI responses | Needed for formatting LLM output (code blocks, lists, links, etc.). ESM-only package. |
| `rehype-highlight` | ^6.x | Syntax highlighting in code blocks | Plugin for react-markdown. Uses highlight.js via lowlight. Bundles 37 languages by default. Import a highlight.js CSS theme for styling. |
| `remark-gfm` | latest | GitHub-flavored markdown (tables, strikethrough) | Plugin for react-markdown. LLM responses often contain GFM features like tables. |
| `pdf-parse` | ^2.4.x | PDF text extraction | Extract text from uploaded PDF files server-side. Pure TypeScript, works in Next.js API routes and Vercel serverless. |
| `mammoth` | latest | DOCX text extraction | Convert .docx files to plain text server-side. Lightweight, no native dependencies. Extract text to inject as LLM context. |
| `@fingerprintjs/fingerprintjs` | latest (v5) | Browser fingerprinting for anonymous tracking | Generate stable browser ID for anonymous users (3 free questions limit). Open-source version has 40-60% accuracy -- sufficient for a demo. Client-side only. |
| `lucide-react` | latest | Icons | Shadcn/ui's default icon library. Tree-shakeable, consistent style. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| ESLint | Linting | Ships with `create-next-app`. Use Next.js recommended config. |
| Prettier | Code formatting | Pair with `prettier-plugin-tailwindcss` for class sorting. |
| `prettier-plugin-tailwindcss` | Auto-sort Tailwind classes | Ensures consistent class ordering across the team. |
| Turbopack | Dev server bundler | Stable in Next.js 15.5+. Use `next dev --turbopack` for faster HMR. |
| Supabase CLI | Local development, migrations | Run `supabase init` and `supabase start` for local Postgres + Auth + Realtime + Storage. Write SQL migrations in `supabase/migrations/`. |

## Architecture-Critical Stack Decisions

### Vercel AI SDK: API Routes (Not Server Actions)

The assignment requires strict layered architecture: **Client -> REST API -> Database**. AI SDK 6 defaults to Server Actions, but this project MUST use the API route approach:

```
// app/api/chat/route.ts (API Route -- USE THIS)
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  const { messages } = await req.json();
  const result = streamText({
    model: openai('gpt-4o-mini'),
    messages,
  });
  return result.toDataStreamResponse();
}
```

The `useChat` hook auto-detects whether it is connected to a Server Action or an API route URL. By default, it hits `/api/chat`. This is exactly what the assignment wants.

**Do NOT use Server Actions for data mutations either.** All data flows through REST API routes per the architecture spec.

### TanStack Query + useChat: Complementary, Not Competing

These two handle **orthogonal concerns**:

| Concern | Tool |
|---------|------|
| AI chat streaming (real-time token display) | `useChat` from AI SDK |
| Loading saved conversations from DB | `useQuery` from TanStack Query |
| Chat CRUD (create, rename, delete) | `useMutation` from TanStack Query |
| User profile, settings, sidebar data | `useQuery` from TanStack Query |
| Optimistic updates (e.g., new chat appears immediately) | `useMutation` with `onMutate` |
| Cache invalidation after mutations | `queryClient.invalidateQueries` |

**Pattern for loading a saved chat:**
1. `useQuery(['chat', chatId])` fetches persisted messages from your REST API
2. Pass result as `initialMessages` to `useChat`
3. `useChat` handles the live streaming session from that point

### Supabase Client Architecture

Per assignment rules, **three** distinct Supabase client usages:

| Client | Key | Where | Purpose |
|--------|-----|-------|---------|
| Server client | `service_role` key | API routes (`app/api/`), `lib/db/` layer only | All database reads/writes. Never exposed to browser. |
| SSR client | `anon` key via `@supabase/ssr` | Middleware only | Session refresh, auth token validation in middleware. |
| Browser client | `anon` key (public) | Client components (limited) | Supabase Realtime subscriptions ONLY. No DB queries from client. |

**Critical:** The `service_role` key bypasses RLS. Store it in `.env.local` as a non-`NEXT_PUBLIC_` variable. The browser Realtime client uses the `anon` key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`).

### Supabase Realtime: Use Broadcast Triggers

For multi-tab chat list sync, use `realtime.broadcast_changes()` triggers, **not** `postgres_changes`:

- `postgres_changes` is simpler but single-threaded, does per-user RLS checks, and does not scale.
- `broadcast_changes` reads the WAL directly, lets you choose which columns to send, supports selective channel routing, and handles reconnection gracefully.

Since this project does not use RLS (service_role key on server), broadcast triggers are the correct pattern for pushing updates to connected browser clients.

## Installation

```bash
# Create Next.js 15 project
npx create-next-app@15 chatbot --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Core dependencies
npm install @supabase/supabase-js @supabase/ssr ai @ai-sdk/openai @ai-sdk/react @tanstack/react-query zod next-themes sonner

# Markdown rendering
npm install react-markdown remark-gfm rehype-highlight

# Document processing (server-side only)
npm install pdf-parse mammoth

# Anonymous tracking
npm install @fingerprintjs/fingerprintjs

# Dev dependencies
npm install -D prettier prettier-plugin-tailwindcss @tanstack/react-query-devtools

# Shadcn/ui initialization (run after project creation)
npx shadcn@latest init

# Add commonly needed shadcn components
npx shadcn@latest add button input textarea dialog sheet dropdown-menu scroll-area skeleton avatar sonner separator tooltip
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| TanStack Query v5 | SWR | Never for this project. TanStack Query has better mutation support, optimistic updates, and query invalidation. SWR is simpler but less powerful for CRUD-heavy apps. Assignment prescribes TanStack Query. |
| Vercel AI SDK (api route mode) | TanStack AI | Never for this project. TanStack AI is alpha software (March 2026) with only 4 providers. Vercel AI SDK is mature with 30+ providers and battle-tested streaming. Assignment implies Vercel AI SDK. |
| Shadcn/ui (Radix primitives) | Headless UI, Chakra, MUI | Never for this project. Assignment prescribes Shadcn/ui. It gives full code ownership, Tailwind-native styling, zero runtime overhead. |
| `react-markdown` + `rehype-highlight` | `react-syntax-highlighter` | If you need Prism.js themes instead of highlight.js themes. `rehype-highlight` is lighter and integrates as a plugin rather than a component wrapper. |
| `pdf-parse` | `officeparser` | If you need a single library for PDF + DOCX + PPTX + XLSX. For this project, separate `pdf-parse` + `mammoth` gives more control and smaller bundle. |
| `@fingerprintjs/fingerprintjs` (open-source) | Fingerprint Pro (commercial) | If you need 99.5% accuracy. Open-source version (40-60% accuracy) is sufficient for a demo's 3-question limit. |
| `gpt-4o-mini` | `gpt-4.1-mini` or `gpt-5.4-mini` | If budget allows or you need better quality. For this demo, gpt-4o-mini is cheapest and spec-compliant. Make the model configurable via env var. |
| Next.js 15 | Next.js 16 | If you want the latest features (Cache Components, `"use cache"`, `proxy.ts`). For this assignment, 15 is prescribed and avoids unnecessary migration complexity. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@supabase/auth-helpers-nextjs` | Deprecated. No longer receives bug fixes. | `@supabase/ssr` (^0.9.x) |
| `supabase.auth.getSession()` on server | Returns unverified data from cookies. Can be spoofed. | `supabase.auth.getUser()` or `supabase.auth.getClaims()` |
| Server Actions for data mutations | Violates the assignment's REST API architecture requirement | API Route Handlers (`app/api/*/route.ts`) |
| `useChat` with Server Actions | Same -- breaks layered architecture requirement | `useChat` with default `/api/chat` endpoint |
| Supabase `postgres_changes` for Realtime | Single-threaded, does not scale, per-user RLS checks | `realtime.broadcast_changes()` trigger |
| Supabase public client for DB queries | Assignment forbids client-side DB access (except Realtime) | `service_role` client in API routes only |
| `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` | Exposes admin key to browser. Catastrophic security flaw. | Non-prefixed env var in `.env.local` only |
| Tailwind CSS v3 | Outdated. Shadcn/ui CLI v4 defaults to v4. Slower builds. | Tailwind CSS v4 (CSS-first config, Oxide engine) |
| `tailwind.config.js` (v3 style) | Tailwind v4 uses CSS-first `@theme` directives. JS config is legacy. | `@theme` in `globals.css` |
| Next.js `middleware.ts` (if using Next.js 16) | Deprecated in v16, renamed to `proxy.ts` | `proxy.ts` (only relevant if you upgrade to 16) |
| SWR for data fetching | Assignment prescribes TanStack Query. SWR lacks mutation primitives. | `@tanstack/react-query` v5 |
| `react-hot-toast` or custom toast | Shadcn/ui deprecated its old toast in favor of Sonner | `sonner` |
| Direct `fetch` to OpenAI API | Loses streaming abstractions, error handling, type safety | Vercel AI SDK `streamText` + `@ai-sdk/openai` |

## Stack Patterns by Variant

**If evaluators require Next.js 16:**
- Rename `middleware.ts` to `proxy.ts`, rename `middleware` export to `proxy`
- Ensure all `params`, `cookies()`, `headers()` are awaited (no sync fallback)
- Move `experimental.turbopack` config to top-level `turbopack` key
- API route approach still works in Next.js 16 -- no architecture changes needed

**If you want to swap the LLM model:**
- Set `OPENAI_MODEL=gpt-4o-mini` in `.env.local`
- Read it in the API route: `model: openai(process.env.OPENAI_MODEL || 'gpt-4o-mini')`
- Works with any OpenAI chat model (gpt-4o, gpt-4.1-mini, gpt-5.4-mini, etc.)

**If you need to support non-OpenAI providers later:**
- AI SDK's provider-agnostic interface makes this trivial
- Install `@ai-sdk/anthropic` or `@ai-sdk/google` and swap the provider
- The `useChat` hook, streaming, and all client code remains unchanged

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `next@15.5.x` | `react@19.x`, `react-dom@19.x` | Next.js 15 ships with React 19. Do not mix React 18. |
| `ai@6.x` | `next@15.x`, `@ai-sdk/openai@3.x`, `@ai-sdk/react@latest` | AI SDK 6 supports both API routes and Server Actions. Auto-detects. |
| `ai@6.x` | `zod@4.x` | AI SDK uses Zod for tool/schema definitions. Zod 4 is compatible. |
| `@tanstack/react-query@5.x` | `react@18+` | Works with React 18 and 19. v5 is the stable React version. |
| `@supabase/supabase-js@2.x` | `@supabase/ssr@0.9.x` | Always use together. SSR package handles cookie-based auth. |
| `@supabase/supabase-js@2.79+` | Node.js 20+ | Node.js 18 support dropped in v2.79.0. Use Node 20 LTS or 22 LTS. |
| `shadcn/ui` (CLI v4) | `tailwindcss@4.x`, `react@19.x` | CLI v4 scaffolds with Tailwind v4 and Radix UI by default. |
| `react-markdown@10.x` | ESM only | Must be imported as ESM. Next.js App Router handles this natively. |
| `rehype-highlight@6.x` | `react-markdown@10.x` | Pass as `rehypePlugins={[rehypeHighlight]}`. Import highlight.js CSS theme. |
| `pdf-parse@2.x` | Node.js 18+ | Server-side only. Use in API routes, never in client components. |

## Key Environment Variables

```bash
# .env.local (NEVER commit this file)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...          # Public: used for Realtime + SSR auth
SUPABASE_SERVICE_ROLE_KEY=eyJ...               # Private: server-only DB access

# OpenAI
OPENAI_API_KEY=sk-...                          # Private: server-only
OPENAI_MODEL=gpt-4o-mini                       # Optional: model override

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000       # For CORS, redirects
```

## Sources

- [Next.js 16 Blog Post](https://nextjs.org/blog/next-16) -- Next.js 16 features and breaking changes (HIGH confidence)
- [Next.js Support Policy](https://nextjs.org/support-policy) -- LTS and maintenance support model (HIGH confidence)
- [Next.js 15-to-16 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-16) -- Breaking changes list (HIGH confidence)
- [AI SDK 6 Announcement](https://vercel.com/blog/ai-sdk-6) -- Server Actions shift, v3 Language Model Spec (HIGH confidence)
- [AI SDK Getting Started: Next.js App Router](https://ai-sdk.dev/docs/getting-started/nextjs-app-router) -- useChat + API route pattern (HIGH confidence)
- [AI SDK npm](https://www.npmjs.com/package/ai) -- ai@6.0.138 current (HIGH confidence)
- [@ai-sdk/openai npm](https://www.npmjs.com/package/@ai-sdk/openai) -- v3.0.48 current (HIGH confidence)
- [TanStack Query npm](https://www.npmjs.com/package/@tanstack/react-query) -- v5.95.x current (HIGH confidence)
- [@supabase/supabase-js npm](https://www.npmjs.com/package/@supabase/supabase-js) -- v2.100.1 current (HIGH confidence)
- [@supabase/ssr npm](https://www.npmjs.com/package/@supabase/ssr) -- v0.9.0 current (HIGH confidence)
- [Supabase Realtime with Next.js](https://supabase.com/docs/guides/realtime/realtime-with-nextjs) -- Broadcast trigger setup (HIGH confidence)
- [Supabase Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) -- Cookie/middleware pattern (HIGH confidence)
- [shadcn/ui CLI v4 Changelog](https://ui.shadcn.com/docs/changelog/2026-03-cli-v4) -- March 2026 release (HIGH confidence)
- [shadcn/ui Dark Mode Next.js](https://ui.shadcn.com/docs/dark-mode/next) -- next-themes integration (HIGH confidence)
- [Tailwind CSS v4.0 Blog](https://tailwindcss.com/blog/tailwindcss-v4) -- CSS-first config, Oxide engine (HIGH confidence)
- [OpenAI Models Documentation](https://developers.openai.com/api/docs/models) -- gpt-4o-mini availability (HIGH confidence)
- [OpenAI Deprecations](https://developers.openai.com/api/docs/deprecations) -- No API deprecation for gpt-4o-mini yet (MEDIUM confidence -- could change)
- [Zod v4 Release Notes](https://zod.dev/v4) -- Zod 4 stable, requires TS 5.5+ (HIGH confidence)
- [Vercel AI SDK vs TanStack AI comparison](https://www.better-stack.ai/p/blog/vercel-ai-sdk-vs-tanstack-ai-2026-best-ai-sdk-for-developers) -- TanStack AI is alpha, not production-ready (MEDIUM confidence)
- [FingerprintJS GitHub](https://github.com/fingerprintjs/fingerprintjs) -- Open-source v5, 40-60% accuracy (MEDIUM confidence)

---
*Stack research for: ChatGPT-like chatbot web application (Paralect Product Academy)*
*Researched: 2026-03-27*
