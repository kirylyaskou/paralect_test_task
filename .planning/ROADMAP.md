# Roadmap: Chatbot (Paralect Product Academy)

## Overview

This roadmap delivers a ChatGPT-like chatbot with strict three-layer architecture as the primary evaluation criterion. The build order follows a bottom-up dependency chain: database and architecture skeleton first, then authentication (gates all user data), then chat CRUD with client foundations (establishes TanStack Query patterns), then SSE streaming (the core chatbot UX), and finally enhancement features plus deployment. Each phase completes a coherent capability that the next phase depends on.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation and Architecture Skeleton** - DB schema, data access layer, Supabase clients, types, and Zod schemas with enforced layer boundaries
- [x] **Phase 2: Authentication and Route Protection** - Email/password auth, session management, middleware route protection, and API validation patterns
- [ ] **Phase 3: Chat Management and Client Foundation** - Chat CRUD, sidebar, responsive layout, TanStack Query with optimistic updates, theme toggle
- [ ] **Phase 4: Streaming and Core Chat Experience** - SSE streaming of AI responses, message persistence, markdown rendering, welcome screen, error handling
- [ ] **Phase 5: Enhancements and Deployment** - Image/document attachments, anonymous trial, multi-tab sync, Vercel deployment, README, and demo video

## Phase Details

### Phase 1: Foundation and Architecture Skeleton
**Goal**: The three-layer architecture is established and enforced so that all subsequent feature code builds on correct foundations
**Depends on**: Nothing (first phase)
**Requirements**: ARCH-01, ARCH-02, ARCH-03
**Success Criteria** (what must be TRUE):
  1. Project builds and runs with Next.js 15 App Router, TypeScript strict mode, Tailwind CSS 4, and Shadcn/ui installed
  2. Supabase database contains all 5 tables (users, chats, messages, documents, anonymous_usage) with correct foreign keys and indexes
  3. All database access functions exist in `lib/db/` with `server-only` enforcement -- importing from a client file causes a build error
  4. Supabase service_role client is isolated in a single file with `server-only` -- no path exists for the key to reach the browser bundle
  5. TanStack Query `QueryClient` is configured with sensible defaults (staleTime, error handling)
**Plans:** 3 plans

Plans:
- [x] 01-01-PLAN.md — Scaffold Next.js 15 project, install dependencies, configure ESLint/Prettier, create providers and root layout
- [x] 01-02-PLAN.md — Create Supabase migration (5 tables, enum, trigger, indexes), push to remote, generate TypeScript types
- [x] 01-03-PLAN.md — Create DB access layer (lib/db/*.ts with server-only), Zod schemas, and shared TypeScript types

### Phase 2: Authentication and Route Protection
**Goal**: Users can securely create accounts, log in, and access protected routes while all API endpoints validate authentication and input
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, ARCH-04, ARCH-05
**Success Criteria** (what must be TRUE):
  1. User can create an account with email and password and is redirected to the chat interface
  2. User can log in and their session persists across browser refresh without re-authentication
  3. User can log out from any page and is redirected to the login screen
  4. Visiting any protected route while unauthenticated redirects to the login page (no flash of protected content)
  5. All API routes return proper HTTP status codes (401 for unauthenticated, 400 for bad input with Zod validation errors, 403 for unauthorized)
**Plans:** 2/2 plans executed

Plans:
- [x] 02-01-PLAN.md — Install jose, create auth infrastructure (dedicated auth client, JWT session management, requireAuth helper), proxy.ts route protection, and all 4 auth API endpoints
- [x] 02-02-PLAN.md — Install shadcn components (card, input, label, alert), create login/signup pages per UI-SPEC, auth/main route group layouts, and end-to-end flow verification

### Phase 3: Chat Management and Client Foundation
**Goal**: Users can create, browse, and manage chats through a responsive sidebar interface with real-time optimistic feedback
**Depends on**: Phase 2
**Requirements**: CHAT-01, CHAT-02, CHAT-03, CHAT-04, CHAT-05, UX-01, UX-04, UX-05
**Success Criteria** (what must be TRUE):
  1. User can create a new chat and it appears instantly in the sidebar (optimistic update via TanStack Query)
  2. Sidebar displays all user's chats sorted by most recent, with loading skeletons during fetch
  3. User can delete a chat with a confirmation dialog and it disappears immediately from sidebar (optimistic)
  4. User can only access their own chats -- attempting to open another user's chat returns 403
  5. Layout is responsive: sidebar is visible on desktop, collapses to a Sheet component on mobile
  6. Dark/light theme toggle works and preference persists across sessions
**Plans:** 2 plans

Plans:
- [x] 03-01-PLAN.md — Install shadcn components (sidebar, dialog, dropdown-menu, scroll-area), create chat CRUD API routes with ownership validation, create TanStack Query hooks with optimistic updates
- [x] 03-02-PLAN.md — Build sidebar UI (app-sidebar, chat-list, chat-item, delete dialog), content header with theme toggle, update main layout with SidebarProvider, create home page empty state and chat placeholder page

### Phase 4: Streaming and Core Chat Experience
**Goal**: Users can have real-time AI conversations with token-by-token streaming, markdown rendering, and polished chat UX
**Depends on**: Phase 3
**Requirements**: MSG-01, MSG-02, MSG-03, MSG-04, UX-02, UX-03
**Success Criteria** (what must be TRUE):
  1. User can type a message and receive an AI response that streams token-by-token in real time (not all at once)
  2. AI responses render markdown correctly with syntax-highlighted code blocks during and after streaming
  3. Opening an existing chat loads the full conversation history with all previous messages displayed
  4. Chat title is auto-generated by the LLM after the first message is sent
  5. Empty chat shows a welcome screen with suggested prompts that the user can click to start a conversation
  6. API failures display error toasts with contextual messages, and the user can retry failed operations
**Plans:** 2/2 plans executed

Plans:
- [x] 04-01-PLAN.md — Install AI SDK + markdown packages, create OpenRouter provider, DB-to-UIMessage converter, Sonner toast, and 3 API routes (streaming chat, message history, title generation)
- [x] 04-02-PLAN.md — Build chat UI components (message list, markdown renderer, code block with copy, auto-resize input, welcome screen, auto-scroll, error handling) and wire to streaming API

### Phase 5: Enhancements and Deployment
**Goal**: The application supports file attachments, anonymous trial access, multi-tab sync, and is deployed to production with documentation
**Depends on**: Phase 4
**Requirements**: IMG-01, IMG-02, IMG-03, IMG-04, DOC-01, DOC-02, DOC-03, ANON-01, ANON-02, ANON-03, SYNC-01, DEPL-01, DEPL-02, DEPL-03
**Success Criteria** (what must be TRUE):
  1. User can paste an image from clipboard or upload via button, see a preview, and the AI analyzes the image content in its response
  2. User can upload a PDF or DOCX document, the extracted text is used as LLM context, and attached documents are indicated in the chat
  3. An unauthenticated visitor can ask up to 3 questions; after the limit, a registration prompt appears and further questions are blocked
  4. Creating or deleting a chat in one browser tab updates the chat list in all other open tabs in real time
  5. The application is deployed to Vercel and accessible via a public URL with a README containing setup instructions and architecture diagram
**Plans:** 4 plans

Plans:
- [ ] 05-01-PLAN.md — Install deps (fingerprintjs, pdf-parse, mammoth), create Supabase public client, upload API routes (signed URL + text extraction), attachment UI components (preview bar, thumbnails, file chips), extend chat input with attach button and clipboard paste
- [x] 05-02-PLAN.md — Anonymous chat API route with fingerprint-based 3-question limit, FingerprintJS hook, limit dialog, proxy.ts anonymous access, Supabase Realtime hook for multi-tab chat list sync
- [ ] 05-03-PLAN.md — Wire attachments end-to-end: vision model selection for image messages, document context injection in system prompt, upload flow in ChatView, image/document rendering in messages
- [ ] 05-04-PLAN.md — README with setup instructions, architecture diagram (Mermaid), deploy link, Loom video placeholder; Vercel deployment (human action)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation and Architecture Skeleton | 3/3 | Complete | 2026-03-29 |
| 2. Authentication and Route Protection | 2/2 | Complete | 2026-03-29 |
| 3. Chat Management and Client Foundation | 2/2 | Complete | 2026-03-29 |
| 4. Streaming and Core Chat Experience | 2/2 | Complete | 2026-03-29 |
| 5. Enhancements and Deployment | 0/4 | Planning complete | - |
