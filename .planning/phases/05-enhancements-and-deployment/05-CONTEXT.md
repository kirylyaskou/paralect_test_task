# Phase 5: Enhancements and Deployment - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

The application supports file attachments (images via clipboard paste/upload with vision API, PDF/DOCX documents with text extraction as LLM context), anonymous trial access (3 free questions tracked server-side via browser fingerprint, then registration prompt), multi-tab sync (chat list updates across browser tabs via Supabase Realtime), and is deployed to production on Vercel with README and Loom demo video. Does NOT include: message editing/regeneration, OAuth/social login, search, multiple LLM providers.

</domain>

<decisions>
## Implementation Decisions

### File Attachment UX
- **D-01:** Image input via **clipboard paste (Ctrl+V) AND upload button** in chat input bar — covers power users and discoverable UI
- **D-02:** **Inline thumbnail preview** above the input bar with X to remove — user sees what they're about to send before hitting Enter
- **D-03:** **Single attach button** (paperclip icon) that opens file picker accepting images + PDFs + DOCX — file type determines handling server-side
- **D-04:** **10 MB per file** size limit — validated both client-side (before upload) and server-side (in API route)

### Document Text Extraction
- **D-05:** **Server-side extraction** in the upload API route — `pdf-parse` for PDF, `mammoth` for DOCX — extract before saving to `documents` table
- **D-06:** Extracted text injected as **system prompt context** — prepend "Document context: ..." to system prompt before sending to LLM, truncate to ~4000 chars if too long
- **D-07:** Attached documents displayed as **file chip with icon** below user message — shows document icon + filename, clickable to download original from Supabase Storage

### Anonymous Access Flow
- **D-08:** Browser fingerprinting via **FingerprintJS free tier** (`@fingerprintjs/fingerprintjs`) — generates stable fingerprint from canvas, fonts, screen, etc.
- **D-09:** When 3-question limit reached, show **modal dialog** — "You've used your 3 free questions. Sign up to continue." with Sign Up and Log In buttons, blocks further input
- **D-10:** **No chat continuity** after signup — anonymous chats are not linked to new accounts, clean separation, anonymous chats exist in temporary state only
- **D-11:** Anonymous users use the same streaming chat API but with fingerprint-based tracking instead of userId — `anonymous_usage` table already built in Phase 1

### Multi-Tab Sync
- **D-12:** Use Supabase Realtime **postgres_changes** — subscribe to INSERT/DELETE on `chats` table filtered by user_id, uses anon key public client (allowed per architecture rules)
- **D-13:** Sync **chat list only** — creates and deletes across tabs. Messages don't need cross-tab sync since each tab views one chat at a time
- **D-14:** On Realtime event, trigger **TanStack Query invalidation** — `queryClient.invalidateQueries(['chats'])` to refetch chat list. Leverages existing hooks, no manual cache manipulation

### Deployment
- **D-15:** Deploy to **Vercel** — standard Next.js deployment, environment variables configured in Vercel dashboard
- **D-16:** README with setup instructions, architecture diagram (text-based or Mermaid), and deploy link
- **D-17:** Loom demo video (2-5 minutes) — user records separately, link added to README

### Claude's Discretion
- Exact paperclip/attach icon design and positioning in input bar
- FingerprintJS configuration options (which signals to include)
- Supabase Realtime channel naming and subscription setup details
- Document text truncation strategy (first N chars vs smart truncation)
- Vercel configuration details (build settings, rewrites)
- README formatting and architecture diagram style
- Anonymous chat storage strategy (ephemeral vs persisted without user_id)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above and in these project files:

### Requirements
- `.planning/REQUIREMENTS.md` — IMG-01 through IMG-04, DOC-01 through DOC-03, ANON-01 through ANON-03, SYNC-01, DEPL-01 through DEPL-03

### Architecture
- `.planning/PROJECT.md` — Architecture rules (3-layer separation, service_role server-only, public client allowed for Realtime only)

### Prior phase context
- `.planning/phases/04-streaming-and-core-chat-experience/04-CONTEXT.md` — Streaming architecture decisions, AI SDK v6 patterns, OpenRouter provider setup
- `.planning/phases/03-chat-management-and-client-foundation/03-CONTEXT.md` — TanStack Query patterns, sidebar/layout, Sonner toasts

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/db/anonymous.ts` — `getAnonymousUsage(fingerprint)` and `incrementAnonymousUsage(fingerprint)` already built with upsert logic
- `lib/db/documents.ts` — `getDocumentsByChatId(chatId)` and `createDocument(chatId, fileName, fileType, fileUrl, extractedText?)` ready to use
- `lib/db/messages.ts` — `createMessage(chatId, role, content, imageUrls?)` already supports image_urls parameter
- `lib/ai/provider.ts` — OpenRouter provider configured with `@openrouter/ai-sdk-provider`
- `lib/ai/convert-messages.ts` — DB-to-UIMessage converter for AI SDK v6
- `app/api/chat/route.ts` — Streaming endpoint with streamText/convertToModelMessages, needs extension for image parts
- `hooks/use-chats.ts` — TanStack Query hooks for chat CRUD with optimistic updates
- `hooks/use-auto-scroll.ts` — Auto-scroll hook for chat view
- `components/chat/chat-input.tsx` — Existing chat input, needs attach button + paste handler + preview additions
- `components/chat/message-item.tsx` — Message rendering, needs image display and document chip support
- `app/providers.tsx` — QueryClientProvider + ThemeProvider configured

### Established Patterns
- `server-only` import in all `lib/db/` files
- Throw errors in DB layer, catch in API routes -> HTTP status codes
- Client-side fetch to API routes (not Server Actions)
- shadcn v4 render prop pattern (not asChild)
- AI SDK v6: `streamText()` server, `useChat()` client, `convertToModelMessages()`, `toUIMessageStreamResponse()`
- Route groups: `(auth)` for login/signup, `(main)` for protected routes

### Integration Points
- `app/api/chat/route.ts` — Needs image URL support in message parts for vision API
- `app/api/` — Needs new document upload route and anonymous chat route
- `components/chat/chat-input.tsx` — Needs attach button, paste handler, inline preview
- `components/chat/message-item.tsx` — Needs image rendering and document chip
- `hooks/` — Needs new hook for Supabase Realtime subscription
- `app/(main)/layout.tsx` — Realtime subscription provider placement
- `lib/db/client.ts` — May need separate public anon client for Realtime
- Supabase Storage — Needs bucket for document uploads

</code_context>

<specifics>
## Specific Ideas

- OpenRouter with `OPENROUTER_API_KEY` and `@openrouter/ai-sdk-provider` — established in Phase 4, vision model support via same provider
- `messages.image_urls` column (TEXT[]) already in DB schema — store Supabase Storage URLs there
- `documents` table has `extracted_text` column — server extracts on upload, stores alongside file metadata
- `anonymous_usage` table with fingerprint + question_count already exists — just need API route + client-side fingerprinting
- Supabase project already configured — just need to enable Realtime on `chats` table and create Storage bucket

</specifics>

<deferred>
## Deferred Ideas

- Chat rename/title editing — v2 (CHAT-06)
- Message regeneration — v2 (MSG-07)
- Stop generation button — v2 (MSG-05)
- Multiple LLM providers — v2 (PROV-01, PROV-02)
- Rate limiting — v2 (SEC-01)
- Search across chats — out of scope

</deferred>

---

*Phase: 05-enhancements-and-deployment*
*Context gathered: 2026-03-29*
