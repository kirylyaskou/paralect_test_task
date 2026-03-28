# Pitfalls Research

**Domain:** ChatGPT-like chatbot web app (Next.js + Supabase + OpenAI)
**Researched:** 2026-03-27
**Confidence:** HIGH (verified across official docs, GitHub issues, and community sources)

## Critical Pitfalls

### Pitfall 1: Database Calls in Server Components (Layer Violation)

**What goes wrong:**
Next.js Server Components can directly access databases. Developers instinctively use this -- it is the recommended Next.js pattern. But this project's assignment explicitly forbids it: all data must flow through REST API routes (`app/api/`). A single `supabase.from('chats').select()` inside a Server Component or layout fails the primary evaluation criterion.

**Why it happens:**
Every Next.js tutorial, including the official docs, teaches Server Components as the place for data fetching. The Supabase Next.js quickstart itself shows database queries in Server Components. The "correct" Next.js pattern is the "wrong" pattern for this assignment. Developers on autopilot will follow framework conventions and violate the spec without noticing.

**How to avoid:**
- Create a `lib/db/` layer that is the ONLY code importing the Supabase admin client. Mark every file in it with `"server-only"` import.
- API route handlers in `app/api/` call `lib/db/` functions. Nothing else does.
- Client components and hooks call API routes via `fetch()` (wrapped by TanStack Query). Server Components do NOT fetch data at all -- they render client components that handle data fetching.
- Add an ESLint rule or a grep check in CI: if `supabase` or `@supabase/supabase-js` appears outside `lib/db/` and `app/api/`, the build fails.

**Warning signs:**
- Any import of the Supabase client outside `lib/db/` or `app/api/` directories
- Server Components that contain `await` calls fetching data
- Components that import from `lib/db/` directly
- The word `async` on a page or layout component (suggests server-side data fetching)

**Phase to address:**
Phase 1 (Foundation/Scaffolding). Establish the directory structure and `server-only` boundaries before writing any feature code. This is the architectural skeleton that everything else builds on.

---

### Pitfall 2: Using `getSession()` Instead of `getUser()` in Server Code

**What goes wrong:**
Supabase's `getSession()` reads the session from cookies/storage without revalidating the JWT against the Supabase Auth server. In server-side code (middleware, API routes), this means you are trusting an unverified token. An attacker can forge session data. Separately, stale sessions cause authentication redirect loops in middleware.

**Why it happens:**
`getSession()` is faster and the more obvious API name. Many tutorials (especially older ones using `@supabase/auth-helpers`) use it. The Supabase docs now explicitly warn against it but the warning is buried in troubleshooting pages. Developers copy-paste patterns from outdated examples.

**How to avoid:**
- Always use `supabase.auth.getUser()` in API routes and middleware for auth verification. It makes a server round-trip to Supabase Auth, verifying the token is legitimate.
- In middleware specifically, use the `updateSession()` pattern from `@supabase/ssr` to refresh expired tokens.
- Never use the deprecated `@supabase/auth-helpers-nextjs` package. Use `@supabase/ssr` exclusively.

**Warning signs:**
- `getSession()` called anywhere in `app/api/` or `middleware.ts`
- Authentication working in development but failing intermittently in production
- Users getting logged out when switching tabs
- Redirect loops on protected routes

**Phase to address:**
Phase 2 (Authentication). Get this right from the first auth implementation. Retrofitting is cheap code-wise but easy to miss in scattered locations.

---

### Pitfall 3: Streaming Response Not Persisted on Client Disconnect

**What goes wrong:**
When using the Vercel AI SDK's `streamText`, the `onFinish` callback only fires when the stream completes normally. If the user closes the tab, navigates away, or loses network during an AI response, `onFinish` never fires. The partially-generated (or fully-generated but unacknowledged) response is lost -- it never reaches the database. The user returns to find their message sent but no AI reply.

**Why it happens:**
HTTP streaming (SSE) relies on the client keeping the connection open. When the client disconnects, the server-side stream is aborted. The default `onFinish` in `streamText` runs in the `flush()` phase of the stream's `TransformStream`, which is never called on abort. Developers assume "the server got all the tokens from OpenAI, so it must be saved" but the save logic was chained to stream completion, not to token reception.

**How to avoid:**
- Call `consumeStream(result.stream)` on the server side. This creates a secondary consumer that reads the full stream regardless of whether the client disconnects. The `onFinish` callback then fires reliably.
- Alternatively, accumulate tokens in the route handler as they arrive and write to the database in a `finally` block or via a separate `result.text` promise that resolves when the LLM finishes (independent of client connection).
- Set `export const maxDuration = 30` (or higher) on the route handler to prevent Vercel from killing long-running streams prematurely.

**Warning signs:**
- AI responses occasionally missing from chat history after page refresh
- Users reporting "I asked a question but got no answer" even though the API logged a successful OpenAI call
- `onFinish` logs not appearing in production when they always appear locally

**Phase to address:**
Phase 3 (Chat/Streaming). Must be implemented at the same time as the streaming route handler. Not something to bolt on later.

---

### Pitfall 4: Exposing `service_role` Key to the Client

**What goes wrong:**
The Supabase `service_role` key bypasses all Row-Level Security. If it leaks to the browser via `NEXT_PUBLIC_` env prefix, client-side bundle, or accidental import chain, any user can read/write/delete all data in every table. This is equivalent to handing out database root access.

**Why it happens:**
Next.js auto-exposes any env var prefixed with `NEXT_PUBLIC_`. Developers sometimes prefix all Supabase vars the same way for convenience. Additionally, importing a server-side module (e.g., `lib/db/supabase-admin.ts`) into a Client Component pulls the key into the browser bundle without any build error -- just a runtime failure (or worse, silent success).

**How to avoid:**
- Store `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` with NO `NEXT_PUBLIC_` prefix. Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` get the public prefix.
- The admin Supabase client (`createClient` with `service_role`) lives exclusively in `lib/db/` files marked with `import "server-only"`. The `server-only` package causes a build error if any server-only module is imported into a Client Component.
- The only public Supabase client (using `anon` key) is the Realtime subscription client, created in a dedicated `lib/supabase/realtime.ts` file.

**Warning signs:**
- `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` in any `.env` file
- Browser DevTools Network tab showing the `service_role` key in request headers
- `import "server-only"` missing from `lib/db/` files
- Build succeeding when `lib/db/` is imported in a `"use client"` file

**Phase to address:**
Phase 1 (Foundation). Environment variables and client creation patterns must be established on day one.

---

### Pitfall 5: Middleware Redirect Loop on Auth Routes

**What goes wrong:**
Next.js middleware runs on every request, including static assets, API routes, and auth callback URLs. If middleware checks authentication on the OAuth/magic-link callback route or on the login page itself, it creates an infinite redirect loop: unauthenticated user hits `/login` -> middleware redirects to `/login` -> repeat. Similarly, middleware running on `/api/` routes can break API calls from the client.

**Why it happens:**
Developers write a simple "if not authenticated, redirect to /login" middleware without excluding specific paths. Next.js middleware's `matcher` config is easy to forget or misconfigure. Route prefetching by `<Link>` components can also trigger server requests before auth cookies are set, causing false "unauthenticated" states.

**How to avoid:**
- Use an explicit `matcher` in `middleware.ts` that excludes: `/login`, `/register`, `/auth/callback`, `/api/auth/*`, all static assets (`/_next/static`, `/_next/image`, `/favicon.ico`).
- Keep the middleware matcher pattern whitelist-based (protect specific paths) rather than blacklist-based (protect everything except...).
- On the post-login redirect page, avoid `<Link>` prefetching to other protected pages until the auth cookie is set.
- Test the full auth flow (register -> email confirm -> login -> redirect) end-to-end, including in incognito mode.

**Warning signs:**
- Browser showing "too many redirects" error
- Login page flickering or briefly showing before redirecting
- API routes returning 307 redirects instead of JSON
- Middleware running on `/_next/static` requests (visible in server logs)

**Phase to address:**
Phase 2 (Authentication). Middleware is part of the auth implementation. Configure the matcher at the same time as the login/register pages.

---

### Pitfall 6: TanStack Query Hydration Mismatch and Stale Cache After Mutation

**What goes wrong:**
Two related issues. First: not setting `staleTime` causes TanStack Query to immediately refetch data after SSR hydration, wasting the server-side prefetch and causing a visible flash. Second: after a mutation (create chat, send message), developers call `invalidateQueries` but the cache still shows stale data because the invalidation races with a prefetch from a Server Component that returns cached data.

**Why it happens:**
TanStack Query defaults to `staleTime: 0`, meaning all data is considered stale immediately. In SSR contexts, this means the client refetches everything the server just fetched. The second issue occurs because in the App Router, Server Component data (from route handler prefetching) and TanStack Query's client-side cache can get out of sync. Developers assume `invalidateQueries` always forces a fresh fetch, but if the query is not currently mounted or if a server-side cache intervenes, the stale data persists.

**How to avoid:**
- Set a default `staleTime` in the `QueryClient` config (e.g., 60 seconds for this chatbot). This prevents immediate refetches after hydration.
- For this project, skip server-side prefetching entirely. Since the spec requires all data to flow through API routes and the client uses TanStack Query, let the client fetch on mount. This avoids the entire SSR/hydration cache conflict.
- After mutations, use `queryClient.invalidateQueries({ queryKey: ['chats'] })` in the `onSettled` callback (not `onSuccess`, so it runs even on error).
- For optimistic updates on chat creation/deletion: always snapshot previous data in `onMutate`, cancel outgoing refetches, and invalidate in `onSettled`.

**Warning signs:**
- Data flickering on page load (fetch -> show -> refetch -> show again)
- Mutations succeeding but the UI not updating until manual refresh
- Console showing duplicate network requests to the same API endpoint
- New chats not appearing in the sidebar until page refresh

**Phase to address:**
Phase 1 (Foundation) for QueryClient config. Phase 3 (Chat) for mutation patterns. Phase 4 (Streaming) for message optimistic updates.

---

### Pitfall 7: Wrong Vercel AI SDK Response Method

**What goes wrong:**
The Vercel AI SDK has evolved rapidly. Older tutorials use `OpenAIStream` + `StreamingTextResponse` (deprecated). Current SDK versions offer `toTextStreamResponse()`, `toDataStreamResponse()`, and `toUIMessageStreamResponse()` -- each for different protocols. Using the wrong one causes the `useChat` hook on the client to receive data it cannot parse, resulting in silent failures, garbled output, or the entire response appearing at once instead of streaming.

**Why it happens:**
The AI SDK went through major breaking changes across v3, v4, v5, and v6. Most blog posts and Stack Overflow answers reference older APIs. Developers following tutorials from even 6 months ago will use deprecated methods. The three current response methods look similar but are incompatible with different client hooks.

**How to avoid:**
- Use `streamText` from `ai` package (not from `openai` package directly).
- Return `result.toUIMessageStreamResponse()` when the client uses the `useChat` hook. This is the most feature-complete protocol supporting tool calls, metadata, and proper message boundaries.
- Pin the AI SDK version and check the changelog before upgrading.
- If using a custom fetch instead of `useChat`, use `toDataStreamResponse()` or `toTextStreamResponse()` and parse accordingly.
- Include `abortSignal: req.signal` in the `streamText` call so server resources are freed when the client disconnects.

**Warning signs:**
- AI responses appearing all at once instead of token-by-token
- `useChat` returning unparseable data or throwing JSON parse errors
- Build warnings about deprecated imports from `ai` package
- Streaming working in development but not in production (often a runtime mismatch)

**Phase to address:**
Phase 3 (Streaming). This is the core streaming implementation. Get the SDK version and response method right from the start.

---

### Pitfall 8: Anonymous User Tracking That Fails or Is Trivially Bypassed

**What goes wrong:**
The spec requires 3 free questions for anonymous users tracked server-side. Developers either: (a) track by cookie only (user clears cookies, gets 3 more), (b) try to fingerprint server-side (impossible -- fingerprinting needs browser APIs), or (c) track client-side only (user opens DevTools and resets the counter). The anonymous limit becomes meaningless.

**Why it happens:**
Browser fingerprinting is inherently client-side -- it relies on canvas, WebGL, screen resolution, and other browser APIs unavailable on the server. But the spec says "server-validated." Developers get confused about where the fingerprint is generated vs. where it is validated. Some skip fingerprinting entirely and use IP-only tracking (fails behind NAT/VPN for legitimate users, trivially bypassed by others).

**How to avoid:**
- Generate the fingerprint client-side using a lightweight library (e.g., `@fingerprintjs/fingerprintjs` open-source, or a custom hash of user-agent + screen + timezone + other signals).
- Send the fingerprint to the server with each anonymous request.
- Server stores fingerprint in an `anonymous_usage` table and increments a counter. The server validates the count, not the client.
- Accept that this is not bulletproof (fingerprints can be spoofed) but meets the "server-validated" requirement. For a demo app, this is sufficient.
- Handle the "no fingerprint yet" state: the first render is SSR with no browser APIs. Use a loading state or defer the first anonymous question until the fingerprint resolves client-side.

**Warning signs:**
- Anonymous usage API accepting requests without a fingerprint parameter
- Counter tracked in localStorage or cookies only
- Fingerprint library imported in a Server Component (will crash or produce meaningless output)
- Clearing cookies resets the question counter

**Phase to address:**
Phase 2 (Authentication) or Phase 5 (Anonymous Access) depending on roadmap. Must be designed when the auth system is built, even if implemented later.

---

### Pitfall 9: Supabase Realtime Silent Disconnection in Background Tabs

**What goes wrong:**
Browsers throttle inactive/background tabs, reducing timer frequency and potentially killing WebSocket connections. Supabase Realtime uses WebSocket heartbeats to keep connections alive. When a tab goes to background, heartbeats stop, the connection silently dies, and the tab no longer receives real-time updates (new chats, sidebar changes). The user switches back to the tab and sees stale data with no indication that sync broke.

**Why it happens:**
This is browser behavior optimization, not a bug. Chrome, Firefox, and Safari all throttle background tabs. The default Supabase Realtime client runs heartbeat timers on the main thread, which gets throttled. Multi-tab sync is one of this project's explicit features, making this a direct conflict.

**How to avoid:**
- Configure the Supabase Realtime client with `worker: true` to offload heartbeats to a Web Worker (not subject to main-thread throttling).
- Add a `heartbeatCallback` as a fallback to detect when heartbeats fail and trigger reconnection.
- On tab visibility change (`document.visibilityState`), force a refetch of critical data (chat list) via TanStack Query invalidation as a safety net.
- Handle the concurrent token refresh race condition: when multiple tabs refresh the auth token simultaneously, one succeeds and the other fails, potentially signing the user out. Use Supabase's built-in `lock` mechanism (`storageAccessType: 'cookie'`) or coordinate via `BroadcastChannel`.

**Warning signs:**
- Chat sidebar not updating after leaving the tab in background for a few minutes
- Console showing WebSocket close/reconnect events when tab regains focus
- Users reporting they need to refresh to see new chats from other tabs
- Intermittent sign-outs when multiple tabs are open

**Phase to address:**
Phase 5 or 6 (Realtime/Polish). Realtime is a late feature, but the Supabase client configuration should account for this from Phase 1.

---

### Pitfall 10: File Upload Size Limits and PDF Extraction Failures

**What goes wrong:**
Next.js Server Actions have a default 1MB body size limit. API routes have a default 4MB limit (configurable). Users try to upload a 5MB PDF and get a cryptic error. Separately, PDF text extraction libraries (`pdf-parse`, `pdfjs-dist`) work locally but fail in Vercel's serverless environment due to missing native modules or memory limits. Extracted text from complex PDFs (scanned documents, multi-column layouts) may be garbage.

**Why it happens:**
Next.js body parser limits are not documented prominently. Developers test with small files locally and never hit the limit. PDF extraction libraries vary wildly in serverless compatibility -- `pdf-parse` requires `fs` (unavailable in Edge runtime), `pdfjs-dist` is large and slow in serverless cold starts. Scanned PDFs require OCR, which no lightweight library provides.

**How to avoid:**
- Upload files directly to Supabase Storage using signed URLs (bypasses Next.js body size limits entirely). The API route generates the signed URL; the client uploads directly to Supabase.
- For PDF text extraction, use `pdf-parse` in Node.js runtime (not Edge). Set `export const runtime = 'nodejs'` on the extraction API route.
- For DOCX extraction, use `mammoth` (lightweight, no native dependencies).
- Set reasonable file size limits in the UI (e.g., 10MB for images, 20MB for documents) and validate both client-side and server-side.
- For the demo, accept that scanned PDFs won't extract well. Document this limitation rather than trying to solve OCR.
- Truncate extracted text to fit within OpenAI's context window (gpt-4o-mini has ~128K tokens but cost scales linearly).

**Warning signs:**
- File uploads failing silently (no error shown to user)
- PDF extraction returning empty strings for some files
- Serverless function timing out during PDF processing
- Memory limit errors in Vercel logs

**Phase to address:**
Phase 4 (Attachments). Design the upload flow and extraction pipeline together. Test with real-world PDFs early.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skipping `server-only` imports on `lib/db/` files | Faster initial setup | Accidental client-side import of admin client goes undetected until production security incident | Never -- takes 1 line per file |
| Using `any` type for API responses | Faster prototyping | Loss of type safety at the API boundary; bugs surface at runtime not compile time | Never -- spec requires strict TypeScript |
| Inline fetch calls instead of API client abstraction | Fewer files to create | Duplicated URL strings, headers, error handling across every component | Only acceptable in Phase 1 prototype; refactor before Phase 3 |
| Storing full message history in React state instead of TanStack Query cache | Simpler mental model | No cache invalidation, no optimistic updates, no deduplication, no background refetch | Never -- TanStack Query is a spec requirement |
| Using `initialData` instead of prefetch/dehydrate for TanStack Query | Quick SSR integration | Prop-drilling pain in nested components; stale data issues | Acceptable for this project since we skip SSR prefetching per spec |
| Hardcoding OpenAI model string throughout codebase | Faster to type | Cannot switch models without find-replace across files | Never -- put model in config/env var from day one |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase Auth + Next.js Middleware | Using `getSession()` for auth checks | Use `getUser()` which validates the JWT server-side |
| Supabase Auth + Multi-tab | Concurrent token refresh causing sign-outs | Use `@supabase/ssr` with proper cookie-based session management; set `storageAccessType` |
| Vercel AI SDK + Database persistence | `onFinish` not firing on client disconnect | Use `consumeStream(result.stream)` to ensure server-side completion |
| Vercel AI SDK + `useChat` | Using `toTextStreamResponse()` with `useChat` hook | Use `toUIMessageStreamResponse()` for full protocol support |
| TanStack Query + Next.js App Router | Creating QueryClient at module scope (shared across requests) | Create QueryClient inside component state or React ref (per-request on server) |
| Supabase Storage + Next.js | Uploading through API route (hits body size limit) | Use signed URLs for direct client-to-Supabase uploads |
| OpenAI + Token counting | Sending entire chat history without length checks | Trim old messages to stay within context window; count tokens before sending |
| Supabase Realtime + Background tabs | Heartbeats killed by browser throttling | Configure `worker: true` on the Realtime client |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Sending full chat history to OpenAI on every message | Slow responses, high API costs, eventual context overflow | Truncate or summarize old messages; track token count per chat | At ~50 messages in a single chat (128K context fills up with long messages) |
| Creating a new Supabase client on every API request | Connection overhead, cold start latency | Create client once per request using a factory function; avoid per-query instantiation | Noticeable at >10 concurrent requests |
| Not setting `staleTime` on TanStack Query | Double-fetch on every page navigation (SSR fetch + client refetch) | Set `staleTime: 60_000` (or appropriate value) in QueryClient defaults | Immediately visible as flickering UI |
| Loading entire chat message list without pagination | Page hangs on chats with 100+ messages | Implement cursor-based pagination or virtual scrolling | At ~200 messages per chat |
| Rendering markdown with syntax highlighting on every token | Jank/lag during streaming as markdown is re-parsed per token | Debounce markdown rendering or only render markdown after stream completes; use `memo` on message components | Noticeable with code blocks >20 lines during active streaming |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| `service_role` key in `NEXT_PUBLIC_` env var | Full database access from any browser | Never prefix with `NEXT_PUBLIC_`; use `server-only` imports |
| No ownership check on chat CRUD operations | User A can read/delete User B's chats by guessing chat ID | Every API route must verify `chat.user_id === authenticated_user.id` |
| Trusting client-sent fingerprint without rate limiting | Attacker can generate unlimited anonymous sessions | Rate limit anonymous endpoints by IP; add a daily cap per fingerprint |
| Passing raw user input to OpenAI without sanitization | Prompt injection (user manipulates system prompt behavior) | Use a system message boundary; don't interpolate user content into system prompts; sanitize extracted document text |
| Not validating file types server-side | User uploads executable/malicious file disguised as PDF | Validate MIME type AND file extension server-side; use Supabase Storage's built-in type restrictions |
| API routes without authentication middleware | Any unauthenticated request can access protected data | Wrap all non-public API routes with auth verification; return 401 for missing/invalid tokens |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No loading state during AI streaming start | User clicks send, nothing happens for 1-2 seconds (LLM cold start) | Show "thinking" indicator immediately on send; display streaming tokens as they arrive |
| Losing message input on accidental navigation | User types a long question, accidentally clicks a chat in sidebar, loses text | Store draft per chat in local state or localStorage |
| No error recovery for failed messages | Message appears sent but AI never responds; no way to retry | Show error state on the message with a "Retry" button; keep the failed message visible |
| Sidebar covering chat on mobile without easy dismiss | User opens sidebar, can't easily get back to chat | Use Sheet component (per spec) with proper overlay and swipe-to-dismiss |
| No empty state for new users | User logs in and sees a blank screen with no guidance | Show a welcome screen with suggested prompts or instructions |
| Chat title "New Chat" persisting after conversation starts | Every chat in the sidebar is named "New Chat" | Auto-generate title via LLM after first message exchange (per spec); update sidebar optimistically |
| Markdown rendering breaking during streaming | Partial markdown (unclosed backticks, incomplete tables) renders as broken HTML during token streaming | Use a markdown renderer that handles partial/incomplete markdown gracefully; only render complete blocks |

## "Looks Done But Isn't" Checklist

- [ ] **Authentication:** Often missing session refresh in middleware -- verify that expired tokens auto-refresh via `updateSession()` and that the user is not silently logged out after token expiry (default 1 hour)
- [ ] **Chat ownership:** Often missing authorization checks on GET/PATCH/DELETE -- verify every chat API route checks `user_id` matches the authenticated user, not just that a user is logged in
- [ ] **Streaming:** Often missing `maxDuration` export -- verify the API route has `export const maxDuration = 30` (or higher) to prevent Vercel from killing the stream at 10 seconds
- [ ] **Streaming persistence:** Often missing `consumeStream` -- verify AI responses are saved to database even when the user closes the tab mid-stream
- [ ] **Error states:** Often missing on API failure -- verify every data-fetching component shows an error state (toast or inline) when the API returns 4xx/5xx, not a blank screen or infinite spinner
- [ ] **Anonymous limit:** Often validated client-side only -- verify the server rejects the 4th anonymous question with a 403, not just the client hiding the input
- [ ] **Mobile layout:** Often only tested on desktop -- verify the sidebar Sheet opens/closes correctly on mobile, chat input is not hidden behind the keyboard, and long messages don't overflow
- [ ] **Dark mode:** Often missing on specific components -- verify toasts, modals (Sheet), code blocks in markdown, and loading skeletons all respect the theme
- [ ] **Realtime cleanup:** Often missing subscription cleanup on unmount -- verify Supabase Realtime channels are unsubscribed when the component unmounts to prevent memory leaks
- [ ] **ENV configuration:** Often missing from deployment -- verify `.env.local` variables are set in Vercel dashboard; the app works in production, not just locally

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Layer violation (DB calls in components) | MEDIUM | Grep for Supabase imports outside `lib/db/` and `app/api/`; move to API routes; create fetch hooks |
| `service_role` key leaked to client | HIGH | Rotate the key immediately in Supabase dashboard; audit for data breach; fix env vars; add `server-only` |
| Wrong AI SDK response method | LOW | Change one line in the route handler (`toUIMessageStreamResponse()`); verify client hook matches |
| Missing auth ownership checks | MEDIUM | Add `user_id` check to each API route; audit database for cross-user data access |
| TanStack Query stale cache | LOW | Add `staleTime` to QueryClient config; add `invalidateQueries` in `onSettled` callbacks |
| Streaming not persisted on disconnect | MEDIUM | Add `consumeStream` call; backfill any lost messages if detectable |
| Redirect loop in middleware | LOW | Update matcher config; test login flow in incognito |
| Realtime silent disconnect | MEDIUM | Add `worker: true` to Realtime config; add visibility change handler for refetch |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Layer violation (DB in components) | Phase 1: Foundation | Grep codebase for Supabase imports outside `lib/db/` and `app/api/`; no matches = pass |
| `service_role` key exposure | Phase 1: Foundation | Check `.env` files for `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`; check browser DevTools for key in network requests |
| Auth `getSession()` misuse | Phase 2: Auth | Search codebase for `getSession()`; should only appear in client-side code if at all |
| Middleware redirect loop | Phase 2: Auth | Test full auth flow in incognito browser; no redirect loops; API routes return JSON not redirects |
| Streaming response method | Phase 3: Chat/Streaming | `useChat` hook renders tokens incrementally; no all-at-once dump |
| Streaming persistence on disconnect | Phase 3: Chat/Streaming | Open chat, send message, close tab mid-stream, reopen -- AI response is in history |
| TanStack Query hydration/stale data | Phase 3: Chat | Create a chat, verify it appears in sidebar without manual refresh |
| Wrong AI SDK version/deprecated API | Phase 3: Chat/Streaming | No deprecation warnings in build output; `OpenAIStream` and `StreamingTextResponse` not in codebase |
| File upload size limits | Phase 4: Attachments | Upload a 5MB PDF and a 3MB image; both succeed without error |
| PDF extraction failures | Phase 4: Attachments | Upload a real multi-page PDF; extracted text is readable and sent to LLM as context |
| Anonymous tracking bypass | Phase 5: Anonymous Access | Clear cookies, send 4 messages -- 4th message returns 403 from server |
| Realtime background disconnect | Phase 5/6: Realtime/Polish | Open two tabs, background one for 5 minutes, create chat in foreground tab -- background tab shows it after regaining focus |
| Optimistic update rollback issues | Phase 3-4: Chat/Attachments | Create a chat while offline (if possible) or with API error -- UI rolls back to previous state |

## Sources

- [Supabase: Understanding API Keys](https://supabase.com/docs/guides/api/api-keys) -- official docs on service_role key security
- [Supabase: Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) -- official auth setup with `@supabase/ssr`
- [Supabase: Realtime Troubleshooting](https://supabase.com/docs/guides/realtime/troubleshooting) -- official Realtime connection issues
- [Supabase: Handling Silent Disconnections in Background Applications](https://supabase.com/docs/guides/troubleshooting/realtime-handling-silent-disconnections-in-backgrounded-applications-592794) -- worker-based heartbeat solution
- [Supabase Auth-js Issue #213: Concurrent Token Refreshes](https://github.com/supabase/auth-js/issues/213) -- multi-tab token race condition
- [TanStack Query: Advanced SSR Guide](https://tanstack.com/query/v5/docs/react/guides/advanced-ssr) -- official hydration patterns for App Router
- [TanStack Query Discussion #5725](https://github.com/TanStack/query/discussions/5725) -- App Router compatibility
- [Vercel AI SDK: Stream Protocols](https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol) -- response method documentation
- [Vercel AI SDK: Chatbot Message Persistence](https://sdk.vercel.ai/docs/ai-sdk-ui/storing-messages) -- onFinish and consumeStream patterns
- [Vercel AI Issue #7900: onFinish on abort](https://github.com/vercel/ai/issues/7900) -- stream abort persistence problem
- [Vercel AI Discussion #4845: Persisting Messages](https://github.com/vercel/ai/discussions/4845) -- UI vs Core message shapes
- [App Router Pitfalls (imidef.com)](https://imidef.com/en/2026-02-11-app-router-pitfalls) -- common Next.js App Router mistakes
- [Next.js + Supabase Common Mistakes](https://www.iloveblogs.blog/post/nextjs-supabase-common-mistakes) -- integration anti-patterns
- [Vercel AI SDK Memory Leaks (Medium)](https://medium.com/@ace.code.pt/you-might-be-creating-memory-leaks-with-vercel-ai-sdk-6202d2441a07) -- consumeStream importance
- [Using SSE to Stream LLM Responses in Next.js (Upstash)](https://upstash.com/blog/sse-streaming-llm-responses) -- SSE implementation patterns
- [FingerprintJS: Usage with SSR Frameworks](https://dev.fingerprint.com/docs/usage-with-server-side-rendering-frameworks) -- client-side fingerprinting in Next.js

---
*Pitfalls research for: ChatGPT-like chatbot (Next.js + Supabase + OpenAI)*
*Researched: 2026-03-27*
