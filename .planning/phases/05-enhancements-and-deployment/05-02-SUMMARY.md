---
phase: 05-enhancements-and-deployment
plan: 02
subsystem: auth, api, ui
tags: [fingerprintjs, supabase-realtime, anonymous-access, streaming, base-ui-dialog]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "anonymous_usage DB table and access functions"
  - phase: 04-streaming-and-core-chat-experience
    provides: "streaming chat pattern (useChat, streamText, consumeStream)"
provides:
  - "Anonymous trial access with 3-question limit via browser fingerprint"
  - "Non-dismissible limit dialog directing users to signup/login"
  - "Supabase Realtime subscription for multi-tab chat list sync"
  - "Public Supabase client (anon key) for Realtime"
  - "Proxy.ts updated to allow unauthenticated home page access"
affects: [05-04-deployment]

# Tech tracking
tech-stack:
  added: ["@fingerprintjs/fingerprintjs"]
  patterns: ["anonymous API route without requireAuth", "base-ui Dialog non-dismissible pattern", "Realtime postgres_changes with TanStack Query invalidation", "DefaultChatTransport for custom API endpoint"]

key-files:
  created:
    - hooks/use-anonymous-usage.ts
    - app/api/anonymous/chat/route.ts
    - components/auth/anonymous-limit-dialog.tsx
    - hooks/use-realtime-chats.ts
    - components/layout/realtime-provider.tsx
    - lib/supabase/public-client.ts
  modified:
    - proxy.ts
    - app/(main)/layout.tsx
    - app/(main)/page.tsx
    - package.json

key-decisions:
  - "FingerprintJS with crypto.randomUUID fallback for anonymous tracking"
  - "disablePointerDismissal + onOpenChange noop for non-dismissible base-ui Dialog"
  - "Realtime subscription scoped per userId in client wrapper component"
  - "Auth detection via /api/chats GET on mount (pragmatic, no extra endpoint)"
  - "DefaultChatTransport with body fingerprint for anonymous chat useChat integration"

patterns-established:
  - "Anonymous API route pattern: no requireAuth, fingerprint-based rate limiting"
  - "Non-dismissible dialog: Dialog open={true} + disablePointerDismissal + showCloseButton={false}"
  - "Realtime Provider pattern: Server Component passes userId to client wrapper"

requirements-completed: [ANON-01, ANON-02, ANON-03, SYNC-01]

# Metrics
duration: 5min
completed: 2026-03-29
---

# Phase 5 Plan 2: Anonymous Access & Multi-tab Sync Summary

**Anonymous trial access with FingerprintJS 3-question limit, non-dismissible signup dialog, and Supabase Realtime multi-tab chat list sync**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-29T20:31:45Z
- **Completed:** 2026-03-29T20:37:12Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments
- Anonymous users can visit home page without redirect and ask up to 3 questions with streaming AI responses
- After 3 questions, a non-dismissible modal appears with Sign Up and Log In buttons
- Supabase Realtime subscription invalidates chat list cache on INSERT/DELETE for multi-tab sync
- Home page detects auth state and branches between authenticated (create-chat-navigate) and anonymous (inline streaming) flows

## Task Commits

Each task was committed atomically:

1. **Task 1: Create anonymous chat API route, FingerprintJS hook, limit dialog, and update proxy.ts** - `386383d` (feat)
2. **Task 2: Create Realtime subscription hook and wire into main layout** - `1cdd25f` (feat)
3. **Task 3: Wire anonymous flow into home page** - `ecfb30b` (feat)

## Files Created/Modified
- `hooks/use-anonymous-usage.ts` - FingerprintJS fingerprint generation and question count tracking with 3-question limit
- `app/api/anonymous/chat/route.ts` - Anonymous streaming chat endpoint with fingerprint-based limit enforcement
- `components/auth/anonymous-limit-dialog.tsx` - Non-dismissible base-ui Dialog with Sign Up / Log In buttons
- `proxy.ts` - Updated publicRoutes to include '/' and separated isAuthPage check for login/signup redirect
- `lib/supabase/public-client.ts` - Public Supabase client with anon key for Realtime subscriptions
- `hooks/use-realtime-chats.ts` - Supabase Realtime postgres_changes subscription filtered by userId
- `components/layout/realtime-provider.tsx` - Client wrapper component that activates Realtime subscription
- `app/(main)/layout.tsx` - Async layout passing userId from requireAuth to RealtimeProvider
- `app/(main)/page.tsx` - Home page with auth detection, anonymous useChat, inline messages, and limit dialog
- `package.json` - Added @fingerprintjs/fingerprintjs dependency

## Decisions Made
- Used `disablePointerDismissal` prop on base-ui Dialog Root + `showCloseButton={false}` on DialogContent for non-dismissible behavior (base-ui v1.3.0 API)
- Auth detection via GET /api/chats on mount -- pragmatic approach reusing existing endpoint rather than adding a new auth-check endpoint
- Realtime subscription channel named per userId (`chat-changes-${userId}`) to avoid cross-user events
- DELETE events cannot be filtered server-side in Supabase Realtime -- client-side filtering via payload.old.user_id
- Anonymous messages are ephemeral (client-side only, not persisted to DB) per research recommendation
- Used DefaultChatTransport with body containing fingerprint for useChat integration with anonymous endpoint

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed @fingerprintjs/fingerprintjs dependency**
- **Found during:** Task 1 (pre-execution check)
- **Issue:** FingerprintJS not in package.json
- **Fix:** Ran `pnpm add @fingerprintjs/fingerprintjs`
- **Files modified:** package.json, pnpm-lock.yaml
- **Verification:** Import succeeds, TypeScript passes
- **Committed in:** 386383d (Task 1 commit)

**2. [Rule 3 - Blocking] Created lib/supabase/public-client.ts**
- **Found during:** Task 2 (Plan 01 had not run yet)
- **Issue:** public-client.ts did not exist -- needed for Realtime subscription
- **Fix:** Created the file with anon key Supabase client
- **Files modified:** lib/supabase/public-client.ts
- **Verification:** TypeScript passes, import works
- **Committed in:** 1cdd25f (Task 2 commit)

**3. [Rule 2 - Missing Critical] Used DefaultChatTransport for anonymous useChat**
- **Found during:** Task 3 (wiring anonymous flow into home page)
- **Issue:** Plan suggested `api` and `body` as direct useChat props, but AI SDK v6 requires DefaultChatTransport for custom API endpoints with body
- **Fix:** Used `transport: new DefaultChatTransport({ api: '/api/anonymous/chat', body: { fingerprint } })` matching the pattern in chat-view.tsx
- **Files modified:** app/(main)/page.tsx
- **Verification:** TypeScript passes
- **Committed in:** ecfb30b (Task 3 commit)

---

**Total deviations:** 3 auto-fixed (1 missing critical, 2 blocking)
**Impact on plan:** All auto-fixes necessary for correctness and functionality. No scope creep.

## Issues Encountered
- Pre-existing `/_global-error` build failure prevents `pnpm build` from completing -- not caused by our changes, TypeScript check (`tsc --noEmit`) passes cleanly

## User Setup Required

**Supabase Realtime requires manual configuration.** Run the following SQL in Supabase Dashboard SQL Editor:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE chats;
```
This enables Realtime events for the chats table, required for multi-tab sync.

## Known Stubs
None -- all data sources are wired and functional.

## Next Phase Readiness
- Anonymous access and multi-tab sync are fully wired
- Ready for Plan 03 (file attachments) and Plan 04 (deployment)
- Supabase Realtime table publication needs to be configured in dashboard

## Self-Check: PASSED

All 6 created files verified on disk. All 3 task commits verified in git log.

---
*Phase: 05-enhancements-and-deployment*
*Completed: 2026-03-29*
