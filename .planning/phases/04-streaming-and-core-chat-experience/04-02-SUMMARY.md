---
phase: 04-streaming-and-core-chat-experience
plan: 02
subsystem: ui
tags: [react, useChat, streaming, markdown, react-markdown, rehype-highlight, auto-scroll, ai-sdk]

# Dependency graph
requires:
  - phase: 04-streaming-and-core-chat-experience plan 01
    provides: streaming API routes, OpenRouter provider, message converter, Sonner toaster
  - phase: 03-chat-management-and-client-foundation
    provides: sidebar with chat CRUD, layout shell, TanStack Query hooks
provides:
  - Complete chat UI with message list, markdown rendering, and syntax-highlighted code blocks
  - Auto-resizing chat input with Enter-to-send and stop-streaming button
  - Welcome screen with 4 suggested prompt cards in 2x2 grid
  - Auto-scroll hook with user-intent detection and scroll-to-bottom FAB
  - Chat page server component loading conversation history from DB
  - Home page creating chat and sending prompt in one flow
affects: [05-enhancements-and-deployment]

# Tech tracking
tech-stack:
  added: []
  patterns: [useChat with DefaultChatTransport, direct DB access in server components, URL query param for cross-page prompt passing]

key-files:
  created:
    - hooks/use-auto-scroll.ts
    - components/chat/code-block.tsx
    - components/chat/message-markdown.tsx
    - components/chat/message-item.tsx
    - components/chat/message-error.tsx
    - components/chat/streaming-indicator.tsx
    - components/chat/scroll-to-bottom.tsx
    - components/chat/chat-input.tsx
    - components/chat/welcome-screen.tsx
    - components/chat/chat-view.tsx
  modified:
    - app/(main)/chat/[id]/page.tsx
    - app/(main)/page.tsx

key-decisions:
  - "useChat uses 'messages' prop (not 'initialMessages') for initial data in AI SDK v6"
  - "Direct DB access in server component for chat page (not fetch to own API) - more reliable, still 3-layer compliant"
  - "URL query param (?prompt=) for passing prompt text from home page to chat page"
  - "github-dark-dimmed.css as single highlight.js theme for both light and dark modes"

patterns-established:
  - "ChatView as main orchestrator: useChat + message list + input + auto-scroll + title generation"
  - "Server component direct DB access for initial data loading (server components are server-only)"
  - "Fire-and-forget title generation with ref guard to prevent re-triggers"

requirements-completed: [MSG-01, MSG-02, MSG-03, MSG-04, UX-02, UX-03]

# Metrics
duration: 5min
completed: 2026-03-29
---

# Phase 4 Plan 2: Chat UI Components Summary

**Complete chat interface with streaming markdown, auto-scroll, code copy, welcome prompts, and useChat wiring to streaming API**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-29T12:47:00Z
- **Completed:** 2026-03-29T12:52:00Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Built 10 chat components: message item, markdown renderer, code block with copy, chat input, welcome screen, chat view orchestrator, streaming indicator, message error, scroll-to-bottom FAB, auto-scroll hook
- Wired ChatView to streaming API via useChat + DefaultChatTransport with real-time token rendering
- Chat page loads full conversation history from DB via server component with direct DB access
- Home page creates new chat and navigates with prompt query param for seamless first-message flow
- Title auto-generates after first assistant response via fire-and-forget API call

## Task Commits

Each task was committed atomically:

1. **Task 1: Foundational components** - `b06a31b` (feat)
2. **Task 2: Chat input, welcome screen, chat view, pages** - `25494a6` (feat)

## Files Created/Modified
- `hooks/use-auto-scroll.ts` - Auto-scroll hook with user-intent detection and scroll-to-bottom visibility
- `components/chat/code-block.tsx` - Fenced code block with copy button and recursive text extraction
- `components/chat/message-markdown.tsx` - react-markdown with rehype-highlight, remark-gfm, and prose styling
- `components/chat/message-item.tsx` - Message with role-based layout, avatar, streaming cursor, error state
- `components/chat/message-error.tsx` - Inline error with destructive styling and retry button
- `components/chat/streaming-indicator.tsx` - Three animated bouncing dots for waiting state
- `components/chat/scroll-to-bottom.tsx` - Floating action button with opacity transition
- `components/chat/chat-input.tsx` - Auto-resizing textarea with Enter-to-send, send/stop toggle, accessibility labels
- `components/chat/welcome-screen.tsx` - Heading + 4 suggested prompt cards in responsive grid
- `components/chat/chat-view.tsx` - Main orchestrator: useChat, message list, auto-scroll, title generation, error toasts
- `app/(main)/chat/[id]/page.tsx` - Server component: auth, ownership check, DB messages, renders ChatView
- `app/(main)/page.tsx` - Home page: welcome screen + input, creates chat and navigates with prompt param

## Decisions Made
- Used `messages` prop (not `initialMessages`) for useChat in AI SDK v6 -- confirmed by TypeScript type checking
- Preferred direct DB access in server component over fetch-to-own-API for initial message loading -- avoids URL resolution issues during build, still 3-layer compliant since server components are server-only
- Used URL query param (`?prompt=`) to pass prompt text from home page to chat page -- simplest approach, no global state needed
- Used single highlight.js theme (github-dark-dimmed) that works in both light and dark modes

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed initialMessages prop name for useChat**
- **Found during:** Task 2 (ChatView implementation)
- **Issue:** Plan specified `initialMessages` prop but AI SDK v6 useChat uses `messages` for initial data
- **Fix:** Changed to `messages: initialMessages` in useChat options
- **Files modified:** components/chat/chat-view.tsx
- **Verification:** TypeScript compilation passes
- **Committed in:** 25494a6

**2. [Rule 1 - Bug] Fixed type-unsafe extractTextFromChildren in code-block**
- **Found during:** Task 1 (CodeBlock implementation)
- **Issue:** TypeScript error: `Object is of type 'unknown'` when accessing `.props.children`
- **Fix:** Added proper type assertion `as React.ReactElement<{ children?: React.ReactNode }>`
- **Files modified:** components/chat/code-block.tsx
- **Verification:** TypeScript compilation passes
- **Committed in:** b06a31b

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both auto-fixes necessary for correctness. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## Known Stubs
None - all components are fully wired to their data sources and API endpoints.

## User Setup Required
None - no external service configuration required. (OPENROUTER_API_KEY was configured in Phase 4 Plan 1.)

## Next Phase Readiness
- Complete chat experience is functional: send messages, stream responses, markdown rendering, code copy, welcome prompts
- Ready for Phase 5: image/document attachments, anonymous access, multi-tab sync, deployment
- Pre-existing `/_global-error` build warning persists (unrelated to our code)

---
*Phase: 04-streaming-and-core-chat-experience*
*Completed: 2026-03-29*
