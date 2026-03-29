---
phase: 04-streaming-and-core-chat-experience
plan: 01
subsystem: api
tags: [ai-sdk, openrouter, streaming, sse, sonner, react-markdown]

# Dependency graph
requires:
  - phase: 01-foundation-and-architecture-skeleton
    provides: "DB access layer (lib/db/messages.ts, lib/db/chats.ts), error classes, type definitions"
  - phase: 02-authentication-and-route-protection
    provides: "requireAuth() helper, session validation, route protection patterns"
  - phase: 03-chat-management-and-client-foundation
    provides: "Chat CRUD API routes (pattern to follow), providers.tsx with QueryClient + ThemeProvider"
provides:
  - "OpenRouter AI SDK provider singleton (lib/ai/provider.ts)"
  - "DB-to-UIMessage converter (lib/ai/convert-messages.ts)"
  - "POST /api/chat streaming endpoint with message persistence"
  - "GET /api/chats/[id]/messages endpoint for message history"
  - "POST /api/chats/[id]/title endpoint for auto-title generation"
  - "Sonner toast infrastructure (components/ui/sonner.tsx in providers)"
  - "Shadcn avatar and textarea components for chat UI"
affects: [04-02-chat-ui-and-streaming-display]

# Tech tracking
tech-stack:
  added: [ai@6.0.141, "@ai-sdk/react@3.0.143", "@openrouter/ai-sdk-provider@2.3.3", react-markdown@10.1.0, rehype-highlight@7.0.2, highlight.js@11.11.1, remark-gfm@4.0.1, sonner@2.0.7]
  patterns: [streaming-with-persistence, consume-stream-for-disconnect-resilience, convert-to-model-messages]

key-files:
  created:
    - lib/ai/provider.ts
    - lib/ai/convert-messages.ts
    - app/api/chat/route.ts
    - app/api/chats/[id]/messages/route.ts
    - app/api/chats/[id]/title/route.ts
    - components/ui/sonner.tsx
    - components/ui/avatar.tsx
    - components/ui/textarea.tsx
  modified:
    - app/providers.tsx
    - .env.example
    - package.json
    - pnpm-lock.yaml

key-decisions:
  - "convertToModelMessages must be awaited (returns Promise<ModelMessage[]> in AI SDK v6)"
  - "Used shadcn-generated sonner.tsx as base, added position/richColors/closeButton enhancements"
  - "No createdAt on UIMessage in AI SDK v6 - converter omits it"

patterns-established:
  - "Streaming pattern: streamText + consumeStream() + toUIMessageStreamResponse()"
  - "Message persistence: save user message before stream, assistant message in onFinish callback"
  - "Title generation: first 2 messages as prompt, 3-6 word constraint, skip if title already exists"

requirements-completed: [MSG-01, MSG-02, MSG-04, UX-03]

# Metrics
duration: 4min
completed: 2026-03-29
---

# Phase 04 Plan 01: Streaming API Backend Summary

**OpenRouter AI SDK streaming backend with 3 API routes (chat SSE, message history, title generation), Sonner toast infrastructure, and DB-UIMessage converter**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-29T12:41:22Z
- **Completed:** 2026-03-29T12:45:28Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Installed 8 npm packages (AI SDK, OpenRouter provider, markdown rendering, toast) and 3 shadcn components
- Created OpenRouter AI SDK provider singleton and DB-to-UIMessage format converter
- Built POST /api/chat with SSE streaming, user/assistant message persistence, and disconnect resilience via consumeStream()
- Built GET /api/chats/[id]/messages for chronological message history with ownership validation
- Built POST /api/chats/[id]/title for LLM-generated 3-6 word titles from first exchange
- Integrated Sonner Toaster into app providers with bottom-right position and richColors

## Task Commits

Each task was committed atomically:

1. **Task 1: Install packages, create AI provider, message converter, and Sonner toast** - `35e9d3e` (feat)
2. **Task 2: Create streaming chat, message history, and title generation API routes** - `78b5846` (feat)

## Files Created/Modified
- `lib/ai/provider.ts` - OpenRouter AI SDK provider singleton
- `lib/ai/convert-messages.ts` - DB Message to UIMessage converter
- `app/api/chat/route.ts` - Streaming chat POST endpoint with SSE
- `app/api/chats/[id]/messages/route.ts` - Message history GET endpoint
- `app/api/chats/[id]/title/route.ts` - Title generation POST endpoint
- `components/ui/sonner.tsx` - Theme-aware Sonner Toaster with richColors
- `components/ui/avatar.tsx` - Shadcn avatar component for chat UI
- `components/ui/textarea.tsx` - Shadcn textarea component for message input
- `app/providers.tsx` - Added Sonner Toaster import and rendering
- `.env.example` - Replaced OPENAI_API_KEY with OPENROUTER_API_KEY
- `package.json` - Added 8 dependencies
- `pnpm-lock.yaml` - Updated lockfile

## Decisions Made
- `convertToModelMessages` returns Promise in AI SDK v6 -- must be awaited before passing to `streamText`
- Used shadcn-generated sonner.tsx as base, enhanced with `position="bottom-right"`, `richColors`, `closeButton`
- UIMessage in AI SDK v6 has no `createdAt` field -- converter omits it (only id, role, parts)
- meta-llama/llama-4-maverick:free model selected for both chat and title generation (free tier on OpenRouter)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed convertToModelMessages async usage**
- **Found during:** Task 2 (chat route creation)
- **Issue:** Plan used `convertToModelMessages(messages)` synchronously but AI SDK v6 returns `Promise<ModelMessage[]>`, causing TypeScript error
- **Fix:** Extracted to `const modelMessages = await convertToModelMessages(messages)` before passing to `streamText`
- **Files modified:** app/api/chat/route.ts
- **Verification:** `npx tsc --noEmit` passes with no errors in new files
- **Committed in:** 78b5846 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Essential fix for type correctness. No scope creep.

## Issues Encountered
- Pre-existing TypeScript error in `.next/types/validator.ts` (missing `../../app/page.js` module) unrelated to our changes -- ignored as documented pre-existing issue.

## User Setup Required

Users need to configure:
- `OPENROUTER_API_KEY` environment variable (get key at https://openrouter.ai/settings/keys)
- Add to `.env.local` for local development

## Known Stubs

None -- all API routes are fully wired to the database layer and AI provider.

## Next Phase Readiness
- All 3 API routes are functional and ready for the chat UI (Plan 02) to consume
- AI provider singleton is importable from `@/lib/ai/provider`
- Message converter handles DB-to-UIMessage format for useChat hook
- Sonner toast available app-wide for error notifications

---
*Phase: 04-streaming-and-core-chat-experience*
*Completed: 2026-03-29*
