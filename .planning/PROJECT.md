# Chatbot (Paralect Product Academy)

## What This Is

A ChatGPT-like chatbot web application built as a test assignment for Paralect Product Academy. Features authentication, real-time SSE streaming of AI responses, multi-tab synchronization via Supabase Realtime, image/document attachments, and anonymous trial access (3 free questions). Built with strict layered architecture separating Client, REST API, and Database layers.

## Core Value

Strict architectural separation (DB -> API -> Client) with zero database calls from components — this is the primary evaluation criterion and the foundation everything else builds on.

## Requirements

### Validated

- [x] Strict layered architecture: DB layer (`lib/db/`), API layer (`app/api/`), Client layer (components + hooks) with no cross-layer violations — Validated in Phase 1: Foundation and Architecture Skeleton
- [x] Supabase accessed via service_role key on server only; no public client except for Realtime — Validated in Phase 1: Foundation and Architecture Skeleton
- [x] User authentication (email/password) via Supabase Auth with server-side session validation — Validated in Phase 2: Authentication and Route Protection
- [x] Protected routes via Next.js proxy with redirect to login — Validated in Phase 2: Authentication and Route Protection
- [x] RESTful API with correct HTTP verbs and status codes (auth endpoints) — Validated in Phase 2: Authentication and Route Protection

- [x] Chat CRUD (create, delete) with ownership validation — Validated in Phase 3: Chat Management and Client Foundation
- [x] TanStack Query for all client-side data fetching with optimistic updates — Validated in Phase 3: Chat Management and Client Foundation
- [x] Responsive UI: sidebar chat list + main chat area, mobile sidebar as Sheet — Validated in Phase 3: Chat Management and Client Foundation
- [x] Loading states (skeletons), empty states (welcome screen) — Validated in Phase 3: Chat Management and Client Foundation
- [x] Dark/light theme toggle — Validated in Phase 3: Chat Management and Client Foundation

### Active
- [ ] Message history persisted in PostgreSQL per chat
- [ ] SSE streaming of AI responses (OpenAI gpt-4o-mini default) with real-time token display
- [ ] Auto-generated chat titles via LLM on first message
- [ ] Image attachment via paste/upload with vision API support
- [ ] Document upload (PDF/DOCX) with text extraction injected as LLM context
- [ ] Anonymous access: 3 free questions tracked server-side, then registration prompt
- [ ] Multi-tab sync via Supabase Realtime (chat list updates across tabs)
- [ ] Markdown rendering in AI responses with syntax highlighting
- [ ] Error states (toasts)
- [ ] Deploy to Vercel with README and Loom demo video

### Out of Scope

- Gemini/other LLM providers — OpenAI only for v1 (adapter abstraction stays for extensibility)
- Real-time chat (WebSocket messaging between users) — this is a single-user chatbot
- OAuth/social login — email/password sufficient for demo
- Mobile native app — web-only
- Message editing/regeneration — not in spec
- Payment/subscription system — anonymous limit is hardcoded

## Context

- **Assignment:** Paralect Product Academy test task
- **Evaluation focus:** Architecture purity (layer separation), API design (REST conventions), DB design (normalization, indexes), UI/UX quality (states, responsiveness), code quality (TypeScript strict, no `any`)
- **Stack (prescribed):** Next.js App Router, Supabase (PostgreSQL + Auth + Realtime + Storage), TanStack Query, Shadcn/ui, OpenAI API, Vercel AI SDK
- **Architecture rules from spec:**
  1. Client code, REST API, and DB layers must be separate
  2. Fetch data from API routes ONLY — no DB calls in components (including Server Components)
  3. Supabase via API with service account (service_role key on server)
  4. Do NOT use public client and RLS (except Realtime)
  5. For Realtime — public client with anon key is allowed

## Constraints

- **Tech stack**: Next.js 15 + App Router, Supabase, TanStack Query, Shadcn/ui, OpenAI — prescribed by assignment
- **Architecture**: Strict 3-layer separation (DB -> API -> Client) — assignment requirement, highest priority
- **Security**: service_role key server-only, no NEXT_PUBLIC_ for secrets, .env.local in .gitignore
- **LLM model**: gpt-4o-mini as default (cost-effective for testing)
- **Anonymous limit**: 3 free questions, server-validated via fingerprint
- **Deliverables**: Working deploy + README + Loom video

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Supabase service_role only (no RLS) | Assignment spec requires server-side DB access through API routes | -- Pending |
| gpt-4o-mini as default model | Cost-effective for demo with many test messages | -- Pending |
| TanStack Query over SWR | Better mutation support, optimistic updates, query invalidation | -- Pending |
| Separate `users` table from auth.users | Flexibility, avoids direct dependency on Supabase internals | -- Pending |
| image_urls as TEXT[] on messages | Images are 1:1 with messages, separate table unnecessary | -- Pending |
| Store extracted text, not binary files | Documents table stores parsed text; files go to Supabase Storage | -- Pending |
| Browser fingerprint for anonymous tracking | Server-validated, more reliable than cookie-only approach | -- Pending |

---
*Last updated: 2026-03-29 after Phase 3 completion — chat management sidebar with optimistic CRUD, responsive layout, and theme toggle*
