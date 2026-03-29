# Phase 4: Streaming and Core Chat Experience - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning
**Mode:** Smart Discuss (autonomous — all recommended defaults accepted)

<domain>
## Phase Boundary

Users can have real-time AI conversations with token-by-token streaming, markdown rendering, and polished chat UX. Includes: SSE streaming via Vercel AI SDK, message persistence (user before stream, assistant after), markdown rendering with syntax-highlighted code blocks, auto-resize chat input, stop/abort streaming, welcome screen with suggested prompts, auto-generated chat titles after first exchange, error toasts with inline retry. Does NOT include: image/document attachments, anonymous access, multi-tab sync, deployment.

</domain>

<decisions>
## Implementation Decisions

### Streaming Architecture
- Use **Vercel AI SDK** (`ai` package) — `streamText()` on server, `useChat()` hook on client for SSE streaming, message state, and abort
- LLM client: **OpenAI SDK with OpenRouter baseURL** — `new OpenAI({ baseURL: "https://openrouter.ai/api/v1", apiKey: OPENROUTER_API_KEY })`
- Default model: **`meta-llama/llama-4-maverick:free`** — free on OpenRouter, strong chat quality
- Message persistence: **Save user message before streaming, save assistant message after stream completes** — ensures user message persisted even on stream failure

### Message UI & Markdown Rendering
- Markdown library: **`react-markdown`** with remark/rehype plugins — renders during streaming
- Code highlighting: **`rehype-highlight` + `highlight.js`** — lightweight, 190+ languages, easy dark/light theme switching
- Message layout: **Full-width, role-based** — user messages right-aligned with user avatar, assistant messages left-aligned with bot avatar; ChatGPT-like layout
- **Copy button on each code block** — copy-to-clipboard icon in top-right corner of fenced code blocks

### Chat Input & Welcome Screen
- Input: **Auto-resizing `<textarea>`** with max 6 rows — Enter to send, Shift+Enter for newline
- Submit during streaming: **Disable input + show stop button** — user can abort current stream, then send new message
- Welcome screen: **4 suggested prompts in 2x2 grid** — clickable cards (e.g., "Explain quantum computing", "Write a Python script", "Help me brainstorm", "Summarize a topic")
- Scroll: **Auto-scroll to bottom on new tokens, pause if user scrolls up** — "scroll to bottom" FAB when not at bottom

### Error Handling & Title Generation
- Toast library: **Sonner** — shadcn/ui recommended, minimal config, promise toasts, auto-dismiss
- Error retry: **Retry button on failed messages** — inline error state with "Retry" button re-sends the same user message
- Title generation trigger: **After first assistant response completes** — fire-and-forget API call, updates sidebar via query invalidation
- Title generation prompt: **Separate non-streaming LLM call** — "Generate a 3-6 word title for this conversation" from first exchange

### Claude's Discretion
- Exact suggested prompt text for welcome screen
- Message avatar design (icon vs initials vs image)
- Auto-scroll threshold sensitivity
- Streaming chunk size / flush timing (SDK-managed)
- Code block theme selection for highlight.js
- Exact retry UX micro-interactions

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/db/messages.ts` — `getMessagesByChatId(chatId)` and `createMessage(chatId, role, content, imageUrls?)` ready to use
- `lib/db/chats.ts` — `updateChatTitle(chatId, title)` available for auto-title
- `lib/schemas/message.ts` — `createMessageSchema` with content validation (1-10000 chars)
- `hooks/use-chats.ts` — TanStack Query hooks for chat CRUD with optimistic updates
- `lib/auth/helpers.ts` — `requireAuth()` returns `{ userId }` from session JWT
- `lib/errors.ts` — `DatabaseError`, `AuthenticationError` classes
- `app/providers.tsx` — QueryClientProvider + ThemeProvider configured
- `components/ui/` — shadcn button, card, input, label, alert installed
- `components/layout/content-header.tsx` — header component with sidebar trigger + theme toggle

### Established Patterns
- `server-only` import in all `lib/db/` files
- Throw errors in DB layer, catch in API routes → HTTP status codes
- Direct per-module imports (no barrel files)
- Client-side fetch to API routes (not Server Actions)
- Route groups: `(auth)` for login/signup, `(main)` for protected routes
- shadcn v4 render prop pattern (not asChild)
- Next.js 16 conventions: `params` is Promise in page components, proxy.ts for route protection

### Integration Points
- `app/(main)/chat/[id]/page.tsx` — currently a placeholder, needs full chat UI
- `app/(main)/page.tsx` — current welcome screen needs suggested prompts upgrade
- `app/api/chats/[id]/` — exists with DELETE, needs messages sub-routes or separate messages API
- `hooks/` — needs new `use-messages.ts` or chat-specific hooks
- `components/chat/` — has `delete-chat-dialog.tsx`, needs message components
- `app/providers.tsx` — may need Sonner `<Toaster />` added

</code_context>

<specifics>
## Specific Ideas

- OpenRouter with `OPENROUTER_API_KEY` env var (not `OPENAI_API_KEY`) — user preference from project setup
- Vercel AI SDK `useChat()` manages message state client-side; server route uses `streamText()` with OpenAI-compatible provider
- Title generation is fire-and-forget — don't block the user; invalidate `['chats']` query to update sidebar
- Phase 3 established chat creation with null title — this phase fills that gap with auto-generation

</specifics>

<deferred>
## Deferred Ideas

- Image paste/upload with vision API — Phase 5
- Document upload with text extraction — Phase 5
- Anonymous access (3 free questions) — Phase 5
- Multi-tab sync via Supabase Realtime — Phase 5
- Message editing/regeneration — out of scope entirely

</deferred>

---

*Phase: 04-streaming-and-core-chat-experience*
*Context gathered: 2026-03-29 via Smart Discuss (autonomous)*
