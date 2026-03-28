# Project Research Summary

**Project:** ChatGPT-like Chatbot Web Application (Paralect Product Academy)
**Domain:** AI chatbot SaaS — full-stack Next.js + Supabase + OpenAI
**Researched:** 2026-03-27
**Confidence:** HIGH

## Executive Summary

This is a full-stack ChatGPT-clone assignment evaluated primarily on architectural purity, not feature breadth. The dominant constraint is a strict three-layer architecture — Client calls REST API routes, REST API routes call a database layer, and the database layer is the only code that touches Supabase — with zero shortcuts allowed. Every popular Next.js pattern (Server Components fetching data, Server Actions for mutations, `getSession()` for auth) violates the spec and must be actively avoided. The prescribed stack is Next.js 15 + React 19 + Supabase + Vercel AI SDK 6 + TanStack Query 5 + Shadcn/ui, all of which are well-documented, compatible, and have clear integration patterns.

The recommended approach is to build bottom-up in five phases: DB schema and data access layer first, then REST API routes with auth, then client foundations (providers, auth hooks, login UI), then core chat with SSE streaming, and finally enhancements (file upload, multi-tab sync, anonymous trial). This order is non-negotiable because every layer depends on the layer below it, and architectural violations introduced early propagate everywhere. The two highest-risk areas are the streaming persistence pattern (AI SDK `onFinish` does not fire on client disconnect without `consumeStream`) and the dual-state problem (AI SDK `useChat` and TanStack Query must manage orthogonal concerns, not the same data).

The core risk is developer autopilot: Next.js tutorials and the Supabase quickstart both demonstrate patterns that are correct for typical apps but explicitly forbidden by this assignment. Teams must deliberately reject Server Component data fetching, Server Actions, and the deprecated `@supabase/auth-helpers-nextjs` package, and instead route everything through `app/api/` route handlers. With that discipline in place, all features are achievable with well-supported, stable libraries.

## Key Findings

### Recommended Stack

The assignment prescribes Next.js 15 (not 16), and this is the right choice: Next.js 16 pushes toward Server Actions and renames `middleware.ts` to `proxy.ts`, both of which conflict with the assignment's REST-only architecture requirement. Use Next.js 15.5.x with React 19, TypeScript 5.5+ (required by Zod 4), and Tailwind CSS 4.x (CSS-first config, required by Shadcn/ui CLI v4). The Vercel AI SDK must be used in API route mode — not Server Action mode — with `streamText` returning `result.toUIMessageStreamResponse()` for the `useChat` hook. TanStack Query 5 handles all non-streaming data; `useChat` handles streaming state. These are complementary, not competing.

**Core technologies:**
- **Next.js 15.5.x + React 19**: Full-stack framework with App Router — assignment-prescribed, LTS, stable
- **TypeScript 5.5+**: Required for Zod 4 compatibility; strict mode, no `any`
- **Supabase (`@supabase/supabase-js` v2 + `@supabase/ssr` v0.9)**: PostgreSQL, Auth, Realtime, Storage — three separate client instances (admin/SSR/browser), each with a single allowed usage context
- **Vercel AI SDK 6 (`ai` + `@ai-sdk/openai` + `@ai-sdk/react`)**: SSE streaming via API routes, `useChat` hook for client-side token display
- **TanStack Query 5**: All CRUD data fetching, optimistic updates, cache invalidation — never for streaming
- **Shadcn/ui (CLI v4) + Tailwind CSS 4**: Component library vendored into project, zero runtime dependency
- **Zod 4**: Schema validation for all API request/response bodies; required by AI SDK
- **`gpt-4o-mini`**: Assignment-prescribed model; still available via API, 128K context, vision support
- **`react-markdown` + `rehype-highlight` + `remark-gfm`**: Markdown rendering with syntax highlighting for AI responses
- **`next-themes` + `sonner`**: Theme switching and toast notifications, both Shadcn/ui defaults
- **`pdf-parse` + `mammoth`**: Server-side document text extraction (Node.js runtime only, not Edge)
- **`@fingerprintjs/fingerprintjs` v5**: Client-side browser fingerprint for anonymous usage tracking

**What NOT to use:** `@supabase/auth-helpers-nextjs` (deprecated), `getSession()` on server, Server Actions, `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`, `OpenAIStream`/`StreamingTextResponse` (deprecated), `postgres_changes` for Realtime at scale (use `broadcast_changes` triggers instead), SWR (assignment prescribes TanStack Query).

### Expected Features

Research across ChatGPT, Claude, Gemini, and similar clones identifies a clear priority stack. Architecture purity and RESTful API design are P0 — invisible to users but the primary evaluation criterion. All user-facing features are P1 or P2.

**Must have (table stakes) — P1:**
- Chat CRUD (create, rename, delete) with sidebar history — primary nav pattern; demonstrates REST API design
- SSE streaming with real-time token display — the defining chatbot UX; evaluators will test this first
- Message persistence in PostgreSQL — demonstrates DB design competence
- User authentication (email/password via Supabase Auth) — gates all user-specific data
- Markdown rendering + syntax highlighting + copy code button — evaluators will paste code prompts
- Auto-generated chat titles (via LLM on first message) — shows LLM integration beyond basic chat
- Responsive layout (mobile sidebar as Sheet) — required for UI/UX score
- Loading skeletons + error toasts — demonstrates state management maturity
- Dark/light theme toggle — virtually universal expectation
- Empty state with suggested prompt cards — prevents blank-screen UX failure
- Auto-resizing textarea, scroll-to-bottom, stop generation button — baseline input UX
- TanStack Query with optimistic updates — demonstrates advanced client-side data management

**Should have (differentiators) — P2:**
- Image attachment with vision API (paste/upload, `gpt-4o-mini` vision) — multimodal capability
- Document upload (PDF/DOCX) with server-side text extraction — file processing pipeline
- Anonymous trial (3 free questions, fingerprint tracked server-side) — conversion funnel demonstration
- Multi-tab sync via Supabase Realtime — demonstrates real-time architecture understanding

**Defer (v2+):**
- Message editing and regeneration — explicitly out of scope per spec; creates branching conversation complexity
- Multi-model selection — adapter pattern in code suffices; only OpenAI needed for v1
- Full-text chat search — power user feature, low evaluator impact
- Voice input/output — not in spec, no architecture signal
- OAuth/social login — extra setup, email/password is sufficient

### Architecture Approach

The architecture enforces three strict layers with hard import boundaries: the **Client layer** (React components + custom hooks calling `fetch('/api/...')` via TanStack Query, plus `useChat` for streaming) communicates only through REST API routes, never touching the database; the **API layer** (`app/api/*/route.ts` files) validates auth with `getUser()`, validates input with Zod, orchestrates `lib/db/` and `lib/ai/` calls, and returns typed JSON or SSE streams; the **DB layer** (`lib/db/*.ts` files importing only the service-role Supabase admin client) contains all Supabase queries. The only permitted client-side Supabase usage is a Realtime subscription with the anon key in a dedicated hook. This separation is the primary evaluation criterion and must be established before any feature code is written.

**Major components:**
1. **`lib/db/`** — all database access functions; imports `lib/supabase/admin.ts` exclusively; marked `server-only`
2. **`app/api/`** — thin controller layer: validate auth, validate input (Zod), call `lib/db/` and `lib/ai/`, return response
3. **`lib/ai/`** — OpenAI client, `streamText` wrapper, title generator; isolated for provider swappability
4. **`hooks/`** — TanStack Query wrappers (`useChats`, `useMessages`, `useAuth`); call `fetch('/api/...')`; never import from `lib/db/`
5. **`components/`** — pure presentation; consume hooks; never import from `lib/db/` or `lib/supabase/admin.ts`
6. **`middleware.ts`** — session refresh and route protection using `@supabase/ssr`; NOT a security boundary on its own
7. **`hooks/use-realtime-sync.ts`** — sole allowed client-side Supabase usage; invalidates TanStack Query cache on chat changes

**Database schema (5 tables):** `users`, `chats` (with `user_id` FK, nullable for anonymous), `messages` (with `chat_id` FK + `CASCADE DELETE`, `role`, `content`, `image_urls[]`), `documents` (extracted text + storage URL), `anonymous_usage` (fingerprint + question count). Critical indexes: `(user_id, updated_at DESC)` on chats, `(chat_id, created_at ASC)` on messages.

**Dual-state pattern:** `useChat` (AI SDK) owns streaming message state for the active conversation. TanStack Query owns everything else — chat list, chat metadata, initial message history (passed as `initialMessages` to `useChat` when loading a saved chat). Never try to manage messages in both simultaneously.

### Critical Pitfalls

1. **Layer violation — DB calls in Server Components or components** — The most common failure mode: Next.js tutorials teach Server Component data fetching, which is forbidden by the spec. Prevention: add `server-only` to all `lib/db/` files (build error if imported in client code); add a CI grep that fails if Supabase is imported outside `lib/db/` and `app/api/`. Address in Phase 1 before writing any feature code.

2. **Streaming response not persisted on client disconnect** — `streamText`'s `onFinish` callback does not fire when the client closes the tab mid-stream, causing the AI response to be lost from the database. Prevention: call `consumeStream(result.stream)` in the API route to create a secondary consumer that completes independently of the client. Also set `export const maxDuration = 30` (or higher) on the streaming route. Address in Phase 3 alongside the streaming route handler.

3. **Using `getSession()` instead of `getUser()` in server code** — `getSession()` reads an unverified cookie; an attacker can forge it. `getUser()` validates the JWT against the Supabase Auth server. Always use `getUser()` in API routes and middleware. The deprecated `@supabase/auth-helpers-nextjs` package encourages `getSession()` — do not use it. Address in Phase 2.

4. **`service_role` key leaking to client** — `NEXT_PUBLIC_` env prefix auto-exposes the key to the browser. Even without the prefix, importing `lib/supabase/admin.ts` from a `'use client'` file pulls the key into the browser bundle. Prevention: no `NEXT_PUBLIC_` prefix, `server-only` import on the admin client file. Recovery cost is HIGH (rotate key, audit for breach). Address in Phase 1.

5. **Wrong AI SDK response method** — `toTextStreamResponse()` and `toDataStreamResponse()` are incompatible with `useChat`; use `toUIMessageStreamResponse()`. Older tutorials (6+ months old) use deprecated `OpenAIStream` + `StreamingTextResponse`. The symptom is responses appearing all at once instead of streaming. Address in Phase 3.

6. **Middleware redirect loop on auth routes** — Middleware running on `/login`, `/api/auth/*`, and static assets causes infinite redirects. Use an explicit `matcher` in `middleware.ts` that whitelists only protected routes. Address in Phase 2.

7. **TanStack Query stale cache** — Default `staleTime: 0` causes double-fetching on every mount. Set a default `staleTime` (e.g., 60s) in `QueryClient` config. Use `invalidateQueries` in `onSettled` (not `onSuccess`) so cache is always refreshed, even on error. Address in Phase 1 (QueryClient config) and Phase 3 (mutation patterns).

## Implications for Roadmap

Based on the dependency chain from ARCHITECTURE.md and pitfall prevention phases from PITFALLS.md, a 5-phase build order is strongly recommended.

### Phase 1: Foundation and Architecture Skeleton

**Rationale:** Every subsequent phase imports from `lib/db/`, uses types from `types/`, and validates with Zod schemas. Building this layer first ensures the import boundaries are enforced from day one. The two most catastrophic pitfalls (layer violation, `service_role` key leak) must be prevented here before any feature code exists.

**Delivers:** Supabase project with all 5 tables and indexes, `lib/supabase/admin.ts` (with `server-only`), all `lib/db/*.ts` functions, all `types/*.ts`, all `lib/validators/*.ts` Zod schemas, base `QueryClient` configuration with `staleTime`.

**Addresses:** Architecture setup, DB schema design, TypeScript types.

**Avoids:** Layer violation (Pitfall 1), `service_role` key exposure (Pitfall 4), TanStack Query stale cache from bad defaults (Pitfall 6).

**Research flag:** Standard patterns — well-documented Supabase schema design; no deeper research needed.

---

### Phase 2: Authentication and Route Protection

**Rationale:** All chat routes require an authenticated user; cannot build chat CRUD without auth context. Auth must be correct before any protected route is built, because retrofitting `getUser()` calls across all routes is error-prone.

**Delivers:** `middleware.ts` with correct matcher config, `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me` route handlers, `hooks/use-auth.ts`, login/register form components, `@supabase/ssr` session management.

**Addresses:** User authentication (table stakes feature), route protection.

**Avoids:** `getSession()` misuse (Pitfall 2), middleware redirect loop (Pitfall 5).

**Research flag:** Standard patterns — `@supabase/ssr` with Next.js is well-documented; follow official Supabase guide exactly.

---

### Phase 3: Chat CRUD, Client Foundation, and Core UI

**Rationale:** Chat CRUD is the foundational user-facing feature. TanStack Query must be wired up as the data-fetching layer from the start — adding it later means retrofitting optimistic updates across all existing fetches. The sidebar and chat layout are dependencies for the streaming UI.

**Delivers:** `/api/chats` (GET, POST) and `/api/chats/[chatId]` (GET, PATCH, DELETE) routes, `/api/chats/[chatId]/messages` (GET), `hooks/use-chats.ts` + `hooks/use-messages.ts` with optimistic updates, `QueryClientProvider` + `ThemeProvider` wiring, sidebar component, chat layout (route groups), login/register pages, dark/light theme.

**Addresses:** Chat CRUD, sidebar history, responsive layout, TanStack Query optimistic updates.

**Avoids:** TanStack Query stale cache and hydration issues (Pitfall 6); establishes correct mutation patterns.

**Research flag:** Standard patterns — TanStack Query optimistic updates are well-documented.

---

### Phase 4: SSE Streaming and Core Chat Experience

**Rationale:** Streaming is the highest-complexity technical feature and the core chatbot UX. It depends on Phase 3 (auth, chat CRUD, message DB functions). The `useChat` integration, persistence-on-disconnect, and auto-title generation must all be implemented together as they interact tightly.

**Delivers:** `lib/ai/openai.ts`, `lib/ai/stream.ts`, `lib/ai/title-generator.ts`, `/api/chat/route.ts` (SSE endpoint with `consumeStream`, `maxDuration`, `onFinish` persistence), chat UI components (messages list, input, streaming indicator, stop generation, scroll-to-bottom), `react-markdown` + `rehype-highlight` + `remark-gfm` integration, copy code button, empty state with suggested prompts, auto-generated chat titles.

**Addresses:** SSE streaming, markdown rendering, syntax highlighting, auto-generated titles, stop generation, scroll-to-bottom, empty state.

**Avoids:** Streaming not persisted on disconnect (Pitfall 3), wrong AI SDK response method (Pitfall 7), markdown rendering breaking during streaming.

**Research flag:** Needs attention — `consumeStream` pattern and `toUIMessageStreamResponse()` are not widely covered in tutorials; follow Vercel AI SDK official docs for storing messages.

---

### Phase 5: Enhancements — File Uploads, Realtime, and Anonymous Trial

**Rationale:** These features all depend on a working chat (Phase 4) and are independent of each other within this phase, so they can be built in parallel. File upload requires Supabase Storage setup; Realtime requires the browser Supabase client and TanStack Query invalidation integration; anonymous trial requires the fingerprinting client and a new DB table already provisioned in Phase 1.

**Delivers:** `/api/upload/route.ts` (Node.js runtime, direct-to-Supabase Storage via signed URL), `lib/utils/extract-text.ts` (pdf-parse + mammoth), image attachment UI with paste/clipboard support, `@fingerprintjs/fingerprintjs` client-side fingerprint, `/api/anonymous/route.ts` (server-side counter validation), `hooks/use-anonymous.ts`, `lib/supabase/browser.ts`, `hooks/use-realtime-sync.ts` (Realtime with `worker: true` for background tab handling), registration prompt at anonymous limit.

**Addresses:** Image attachment + vision, document upload + text extraction, anonymous trial (3 free questions), multi-tab Realtime sync.

**Avoids:** File upload size limit bypass via signed URLs (Pitfall 10), PDF extraction in Edge runtime failure (Pitfall 10), anonymous tracking client-side bypass (Pitfall 8), Realtime background tab silent disconnect (Pitfall 9).

**Research flag:** File upload via signed URLs (not documented in many Next.js tutorials — verify Supabase Storage signed URL flow); Realtime `worker: true` config (verify against Supabase Realtime troubleshooting guide).

---

### Phase Ordering Rationale

- **DB layer before API layer:** Cannot test or validate API routes without working DB functions. Schema errors surface immediately when the layer is built in isolation.
- **Auth before Chat CRUD:** Every chat API route calls `validateSession()`. Building chat routes without auth means retrofitting auth checks into every handler.
- **TanStack Query wired in Phase 3, not Phase 4:** Optimistic updates and cache invalidation patterns must be established before streaming complicates state management. Retrofitting optimistic updates is harder than building them alongside CRUD.
- **SSE streaming in Phase 4, not earlier:** Depends on messages DB table (Phase 1), chat CRUD (Phase 3), and auth middleware (Phase 2). The `useChat` + `initialMessages` handoff pattern requires working message history endpoints.
- **Enhancements parallel in Phase 5:** File upload, Realtime, and anonymous tracking have no inter-dependencies. Each can be completed independently by different team members if needed.
- **Markdown rendering placed in Phase 4 (not Phase 5):** Evaluators will immediately notice raw markdown in AI responses. It belongs with the core streaming experience, not as a late enhancement.

### Research Flags

Phases needing closer attention during implementation:

- **Phase 4 (Streaming):** `consumeStream` + `onFinish` persistence pattern is a known gotcha with sparse tutorial coverage. Use Vercel AI SDK official "Storing Messages" guide and the GitHub issues referenced in PITFALLS.md. Also verify `toUIMessageStreamResponse()` vs other response methods against current SDK version.
- **Phase 5 (File Upload):** Supabase Storage signed URL flow for direct client uploads (bypassing Next.js body limit) is underrepresented in Next.js tutorials. Test with real 5MB+ PDFs before considering this done. Also verify `worker: true` Realtime config against current Supabase client docs.

Phases with well-established patterns (safe to implement without additional research):

- **Phase 1 (Foundation):** Supabase schema design and `server-only` import enforcement are standard.
- **Phase 2 (Auth):** `@supabase/ssr` with Next.js 15 is the official recommended pattern with detailed Supabase docs.
- **Phase 3 (Chat CRUD + TanStack Query):** TanStack Query v5 optimistic updates are comprehensively documented.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All packages verified against npm (current versions confirmed March 2026). Version compatibility table is explicit. Assignment-prescribed stack aligns with stable, actively-maintained libraries. |
| Features | HIGH | Feature set derived from direct competitor analysis (ChatGPT, Claude, Gemini) plus UX research sources. MVP definition is explicit with priority ratings. |
| Architecture | HIGH | Three-layer pattern is verified against official Next.js App Router docs and Supabase SSR guide. All patterns have working code examples. Build order is validated against dependency analysis. |
| Pitfalls | HIGH | All 10 pitfalls traced to official docs, GitHub issues, or community sources. Recovery strategies included. Several pitfalls (streaming persistence, `getSession` misuse) are documented CVEs or known SDK bugs. |

**Overall confidence:** HIGH

### Gaps to Address

- **`gpt-4o-mini` API deprecation:** The model is currently available via API with no announced deprecation date, but it has been superseded by `gpt-4.1-mini` and `gpt-5.4-mini`. Design the model as an env var (`OPENAI_MODEL`) from day one to make swapping trivial. Monitor OpenAI deprecation notices.
- **FingerprintJS open-source accuracy:** The open-source `@fingerprintjs/fingerprintjs` v5 has 40-60% accuracy (not 99.5%). For a demo app, this is acceptable, but evaluators who clear cookies AND use a different browser will bypass the limit. Document this known limitation rather than treating it as a bug.
- **Supabase Realtime RLS requirement:** The ARCHITECTURE.md recommends `broadcast_changes` triggers (which bypass the RLS requirement of `postgres_changes`), but the ARCHITECTURE.md code example uses `postgres_changes`. Resolve this during Phase 5: use Supabase `broadcast_changes` trigger in SQL for production-correct behavior, or enable minimal RLS on the `chats` table if using `postgres_changes`. The STACK.md recommendation (broadcast) is correct; the ARCHITECTURE.md code example is illustrative.
- **PDF extraction quality:** `pdf-parse` returns poor results for scanned PDFs (image-based, no embedded text). Accept this limitation and document it in the UI (e.g., "Text-based PDFs only"). Do not attempt OCR.

## Sources

### Primary (HIGH confidence)

- [Next.js 16 Blog Post](https://nextjs.org/blog/next-16) — Next.js 16 features and breaking changes; rationale for staying on 15
- [Next.js Support Policy](https://nextjs.org/support-policy) — LTS model
- [AI SDK Getting Started: Next.js App Router](https://ai-sdk.dev/docs/getting-started/nextjs-app-router) — `useChat` + API route pattern
- [Vercel AI SDK: Chatbot Message Persistence](https://sdk.vercel.ai/docs/ai-sdk-ui/storing-messages) — `onFinish` and `consumeStream`
- [Vercel AI SDK: Stream Protocols](https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol) — response method selection
- [Supabase Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) — `@supabase/ssr` cookie-based auth
- [Supabase Realtime with Next.js](https://supabase.com/docs/guides/realtime/realtime-with-nextjs) — broadcast trigger setup
- [Supabase: Handling Silent Disconnections in Background Applications](https://supabase.com/docs/guides/troubleshooting/realtime-handling-silent-disconnections-in-backgrounded-applications-592794) — `worker: true` Realtime config
- [TanStack Query v5 Advanced SSR Guide](https://tanstack.com/query/v5/docs/react/guides/advanced-ssr) — hydration patterns
- [TanStack Query: Optimistic Updates](https://tanstack.com/query/v4/docs/react/guides/optimistic-updates) — mutation patterns
- [shadcn/ui CLI v4 Changelog](https://ui.shadcn.com/docs/changelog/2026-03-cli-v4) — March 2026 release
- [Tailwind CSS v4.0 Blog](https://tailwindcss.com/blog/tailwindcss-v4) — CSS-first config
- [Zod v4 Release Notes](https://zod.dev/v4) — TS 5.5+ requirement

### Secondary (MEDIUM confidence)

- [OpenAI Deprecations](https://developers.openai.com/api/docs/deprecations) — `gpt-4o-mini` API status (no deprecation announced; could change)
- [Vercel AI Issue #7900: onFinish on abort](https://github.com/vercel/ai/issues/7900) — streaming abort/persistence problem
- [Supabase Auth-js Issue #213: Concurrent Token Refreshes](https://github.com/supabase/auth-js/issues/213) — multi-tab token race
- [FingerprintJS GitHub](https://github.com/fingerprintjs/fingerprintjs) — open-source v5 accuracy characteristics
- [App Router Pitfalls (imidef.com)](https://imidef.com/en/2026-02-11-app-router-pitfalls) — common Next.js App Router mistakes
- Feature comparison sources: AITrove, DataStudios, Improvado — chatbot feature landscape

### Tertiary (LOW confidence)

- [Vercel AI SDK vs TanStack AI comparison](https://www.better-stack.ai/p/blog/vercel-ai-sdk-vs-tanstack-ai-2026-best-ai-sdk-for-developers) — TanStack AI alpha status; recommend avoiding

---
*Research completed: 2026-03-27*
*Ready for roadmap: yes*
