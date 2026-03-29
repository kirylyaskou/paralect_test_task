# Phase 4: Streaming and Core Chat Experience - Research

**Researched:** 2026-03-29
**Domain:** Real-time AI chat with SSE streaming, markdown rendering, message persistence
**Confidence:** HIGH

## Summary

Phase 4 builds the core chat experience: sending messages to an LLM via OpenRouter, streaming responses token-by-token using the Vercel AI SDK, rendering markdown with syntax-highlighted code blocks, persisting messages to Supabase, and providing error handling with toasts. The existing codebase provides a solid foundation with `lib/db/messages.ts` (CRUD), `lib/db/chats.ts` (title update), authentication helpers, and a complete sidebar with chat management.

The Vercel AI SDK (v6) provides `streamText()` on the server and `useChat()` from `@ai-sdk/react` on the client. The `@openrouter/ai-sdk-provider` package (v2.3.3) provides native AI SDK integration with OpenRouter, eliminating the need for raw OpenAI SDK configuration. The key architectural challenge is bridging the AI SDK's UIMessage format (which uses `parts[]` arrays) with our flat Supabase `messages` table (which stores `role` + `content` strings). This requires conversion functions in both directions.

**Primary recommendation:** Use `@openrouter/ai-sdk-provider` with `streamText()` / `toUIMessageStreamResponse()` on the server, `useChat()` with `initialMessages` on the client, and custom DB-to-UIMessage converters to bridge the persistence layer.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Streaming architecture:** Vercel AI SDK (`ai` package) -- `streamText()` on server, `useChat()` hook on client for SSE streaming, message state, and abort
- **LLM client:** OpenAI SDK with OpenRouter baseURL -- `new OpenAI({ baseURL: "https://openrouter.ai/api/v1", apiKey: OPENROUTER_API_KEY })`
- **Default model:** `meta-llama/llama-4-maverick:free` -- free on OpenRouter
- **Message persistence:** Save user message before streaming, save assistant message after stream completes
- **Markdown library:** `react-markdown` with remark/rehype plugins -- renders during streaming
- **Code highlighting:** `rehype-highlight` + `highlight.js` -- lightweight, 190+ languages
- **Message layout:** Full-width, role-based -- user right-aligned, assistant left-aligned; ChatGPT-like
- **Copy button on each code block** -- clipboard icon in top-right corner of fenced code blocks
- **Input:** Auto-resizing `<textarea>` with max 6 rows -- Enter to send, Shift+Enter for newline
- **Submit during streaming:** Disable input + show stop button -- user can abort current stream
- **Welcome screen:** 4 suggested prompts in 2x2 grid -- clickable cards
- **Scroll:** Auto-scroll to bottom on new tokens, pause if user scrolls up -- "scroll to bottom" FAB
- **Toast library:** Sonner -- shadcn/ui recommended, minimal config
- **Error retry:** Retry button on failed messages -- inline error state with "Retry" button
- **Title generation trigger:** After first assistant response completes -- fire-and-forget API call
- **Title generation prompt:** Separate non-streaming LLM call -- "Generate a 3-6 word title"

### Claude's Discretion
- Exact suggested prompt text for welcome screen
- Message avatar design (icon vs initials vs image)
- Auto-scroll threshold sensitivity
- Streaming chunk size / flush timing (SDK-managed)
- Code block theme selection for highlight.js
- Exact retry UX micro-interactions

### Deferred Ideas (OUT OF SCOPE)
- Image paste/upload with vision API -- Phase 5
- Document upload with text extraction -- Phase 5
- Anonymous access (3 free questions) -- Phase 5
- Multi-tab sync via Supabase Realtime -- Phase 5
- Message editing/regeneration -- out of scope entirely
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MSG-01 | User can send a text message and receive AI response | `streamText()` + `useChat()` with `@openrouter/ai-sdk-provider`, POST route at `/api/chat`, `createMessage()` for persistence |
| MSG-02 | AI response streams token-by-token via SSE | `toUIMessageStreamResponse()` produces SSE stream, `useChat()` consumes with real-time `parts` updates, `status` field tracks streaming state |
| MSG-03 | Messages render markdown with syntax-highlighted code blocks | `react-markdown` with `rehype-highlight` + `highlight.js`, custom `pre` component for copy button |
| MSG-04 | Full conversation history loads when opening a chat | Server component fetches via API, passes as `initialMessages` to `useChat()`, DB-to-UIMessage converter |
| UX-02 | Welcome screen with suggested prompts on empty chat | 4 prompt cards in 2x2 grid on `/chat/[id]` when no messages exist, click sends via `sendMessage()` |
| UX-03 | Error toasts and retry buttons on API failures | Sonner `<Toaster />` in providers, `onError` callback in `useChat()`, inline retry on failed assistant messages |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Next.js 16 conventions:** Read `node_modules/next/dist/docs/` before writing code; `params` is `Promise` in pages/routes; use `proxy.ts` not `middleware.ts`
- **Strict 3-layer architecture:** DB (`lib/db/`) -> API (`app/api/`) -> Client (components/hooks); zero DB calls from components
- **`server-only` import** in all `lib/db/` files
- **Throw errors in DB layer, catch in API routes** -> HTTP status codes
- **Direct per-module imports** (no barrel files)
- **Client-side fetch to API routes** (not Server Actions)
- **shadcn v4 render prop pattern** (not asChild)
- **Package manager:** pnpm

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `ai` | 6.0.141 | Vercel AI SDK core -- `streamText()`, `convertToModelMessages()`, `UIMessage` types | Industry standard for AI streaming in Next.js; handles SSE protocol, message types, abort |
| `@ai-sdk/react` | 3.0.143 | Client hooks -- `useChat()`, `DefaultChatTransport` | Official React binding for AI SDK; manages message state, streaming, abort on client |
| `@openrouter/ai-sdk-provider` | 2.3.3 | OpenRouter LLM provider -- `createOpenRouter()`, `.chat()` | Official OpenRouter AI SDK provider; native integration, no raw OpenAI SDK needed |
| `react-markdown` | 10.1.0 | Markdown rendering in React | Standard for rendering markdown in React; supports streaming content, plugin ecosystem |
| `rehype-highlight` | 7.0.2 | Syntax highlighting via highlight.js | Lightweight rehype plugin; 190+ languages, works with react-markdown |
| `highlight.js` | 11.11.1 | Syntax highlighting engine | Most popular highlight library; ships CSS themes for dark/light mode |
| `remark-gfm` | 4.0.1 | GitHub Flavored Markdown (tables, strikethrough, task lists) | Standard remark plugin for GFM support |
| `sonner` | 2.0.7 | Toast notifications | shadcn/ui recommended toast library; theme-aware, minimal config |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@ai-sdk/provider` | 3.0.8 | Provider types (transitive dep of `ai`) | Automatically installed |
| `@ai-sdk/provider-utils` | 4.0.21 | Provider utilities (transitive dep) | Automatically installed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@openrouter/ai-sdk-provider` | Raw `OpenAI` SDK with `baseURL` override | OpenRouter provider is native AI SDK integration; raw OpenAI SDK requires manual `createOpenAI()` from `@ai-sdk/openai` with custom `baseURL`, more boilerplate |
| `react-markdown` | `streamdown` (streaming-aware markdown) | Streamdown handles incomplete markdown blocks during streaming, but react-markdown is the locked decision and handles streaming content well enough for chat |
| `rehype-highlight` | `rehype-pretty-code` (Shiki-based) | Shiki gives VS Code theme accuracy but is heavier; highlight.js is the locked decision |
| `sonner` | `react-hot-toast` | Sonner is the locked decision and shadcn/ui's recommended toast |

**Installation:**
```bash
pnpm add ai @ai-sdk/react @openrouter/ai-sdk-provider react-markdown rehype-highlight highlight.js remark-gfm sonner
```

## Architecture Patterns

### Recommended Project Structure
```
app/
  api/
    chat/
      route.ts              # POST: streaming chat endpoint (streamText + persistence)
    chats/
      [id]/
        messages/
          route.ts           # GET: load messages for a chat
        title/
          route.ts           # POST: generate title via LLM
  (main)/
    chat/
      [id]/
        page.tsx             # Server component: fetch initial messages, render ChatPage
    page.tsx                 # Home/welcome page (updated with suggested prompts)
components/
  chat/
    chat-page.tsx            # Client component: useChat + message list + input
    message-bubble.tsx       # Single message with role-based styling
    markdown-renderer.tsx    # react-markdown with plugins and custom components
    code-block.tsx           # Custom pre/code with copy button
    chat-input.tsx           # Auto-resizing textarea with send/stop buttons
    welcome-screen.tsx       # 4 suggested prompts in 2x2 grid
    scroll-anchor.tsx        # Auto-scroll + "scroll to bottom" FAB
  ui/
    sonner.tsx               # Sonner Toaster component (shadcn v4 style)
hooks/
  use-auto-scroll.ts         # Auto-scroll hook with "user scrolled up" detection
lib/
  ai/
    provider.ts              # OpenRouter provider singleton
    convert-messages.ts      # DB Message <-> UIMessage converters
```

### Pattern 1: Streaming Chat Route Handler
**What:** POST `/api/chat` receives messages + chatId, persists user message, calls LLM, streams response, persists assistant message on completion.
**When to use:** Every chat message send.
**Example:**
```typescript
// app/api/chat/route.ts
import { streamText, UIMessage, convertToModelMessages } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { requireAuth } from '@/lib/auth/helpers'
import { getChatById } from '@/lib/db/chats'
import { createMessage, getMessagesByChatId } from '@/lib/db/messages'

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
})

export const maxDuration = 60

export async function POST(req: Request) {
  const { userId } = await requireAuth()
  const { messages, chatId }: { messages: UIMessage[]; chatId: string } =
    await req.json()

  // Verify chat ownership
  const chat = await getChatById(chatId)
  if (chat.user_id !== userId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Save user message before streaming
  const lastUserMessage = messages.filter((m) => m.role === 'user').at(-1)
  if (lastUserMessage) {
    const textPart = lastUserMessage.parts.find((p) => p.type === 'text')
    if (textPart && textPart.type === 'text') {
      await createMessage(chatId, 'user', textPart.text)
    }
  }

  const result = streamText({
    model: openrouter.chat('meta-llama/llama-4-maverick:free'),
    system: 'You are a helpful assistant.',
    messages: await convertToModelMessages(messages),
    onFinish: async ({ text }) => {
      // Save assistant message after stream completes
      await createMessage(chatId, 'assistant', text)
    },
  })

  // Ensure stream completes even if client disconnects
  result.consumeStream()

  return result.toUIMessageStreamResponse()
}
```

### Pattern 2: DB Message to UIMessage Conversion
**What:** Convert flat DB rows (`{ id, role, content }`) to AI SDK's UIMessage format (`{ id, role, parts: [{ type: 'text', text }] }`).
**When to use:** Loading conversation history from database.
**Example:**
```typescript
// lib/ai/convert-messages.ts
import type { UIMessage } from 'ai'
import type { Message } from '@/lib/types'

export function dbMessagesToUIMessages(dbMessages: Message[]): UIMessage[] {
  return dbMessages.map((msg) => ({
    id: msg.id,
    role: msg.role as 'user' | 'assistant',
    parts: [{ type: 'text' as const, text: msg.content }],
    createdAt: new Date(msg.created_at),
  }))
}
```

### Pattern 3: useChat with Custom Persistence
**What:** Configure `useChat()` with chat ID, initial messages from DB, and custom API endpoint.
**When to use:** Chat page component.
**Example:**
```typescript
// components/chat/chat-page.tsx
'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import type { UIMessage } from 'ai'

interface ChatPageProps {
  chatId: string
  initialMessages: UIMessage[]
}

export function ChatPage({ chatId, initialMessages }: ChatPageProps) {
  const { messages, sendMessage, stop, status, error } = useChat({
    id: chatId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { chatId },
    }),
    onError: (error) => {
      toast.error('Failed to send message. Please try again.')
    },
    onFinish: ({ message }) => {
      // Title generation: fire-and-forget after first assistant response
      if (messages.length <= 1) {
        fetch(`/api/chats/${chatId}/title`, { method: 'POST' })
          .then(() => queryClient.invalidateQueries({ queryKey: ['chats'] }))
          .catch(() => {}) // silent failure
      }
    },
  })

  const isStreaming = status === 'streaming'
  // ... render messages, input, etc.
}
```

### Pattern 4: Auto-Resizing Textarea
**What:** Textarea that grows with content up to max height, Enter sends, Shift+Enter for newline.
**When to use:** Chat input component.
**Example:**
```typescript
// Resize logic
const textareaRef = useRef<HTMLTextAreaElement>(null)
useEffect(() => {
  const el = textareaRef.current
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`
}, [inputValue])

// Key handler
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}
```

### Pattern 5: Markdown with Copy Button
**What:** react-markdown with rehype-highlight and custom `pre` component that adds a copy button.
**When to use:** Rendering assistant messages.
**Example:**
```typescript
// components/chat/markdown-renderer.tsx
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import { CodeBlock } from './code-block'

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        pre: ({ children, ...props }) => (
          <CodeBlock {...props}>{children}</CodeBlock>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

// components/chat/code-block.tsx
'use client'
import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

export function CodeBlock({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    // Extract text from children (code element)
    const codeElement = children as React.ReactElement
    const text = extractTextFromChildren(codeElement)
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <pre className="relative group" {...props}>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity ..."
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
      {children}
    </pre>
  )
}
```

### Pattern 6: Title Generation (Fire-and-Forget)
**What:** After the first assistant response, call a separate API endpoint that uses `generateText()` (non-streaming) to create a short title, then invalidate the chats query to update the sidebar.
**When to use:** Once per chat, after the first exchange.
**Example:**
```typescript
// app/api/chats/[id]/title/route.ts
import { generateText } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { requireAuth } from '@/lib/auth/helpers'
import { getChatById, updateChatTitle } from '@/lib/db/chats'
import { getMessagesByChatId } from '@/lib/db/messages'

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
})

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await requireAuth()
  const { id } = await params

  const chat = await getChatById(id)
  if (chat.user_id !== userId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (chat.title) {
    return Response.json({ title: chat.title }) // Already has a title
  }

  const messages = await getMessagesByChatId(id)
  const firstExchange = messages.slice(0, 2)

  const { text: title } = await generateText({
    model: openrouter.chat('meta-llama/llama-4-maverick:free'),
    system: 'Generate a concise 3-6 word title for this conversation. Return ONLY the title, no quotes or punctuation.',
    prompt: firstExchange.map((m) => `${m.role}: ${m.content}`).join('\n'),
  })

  const trimmedTitle = title.trim().slice(0, 100)
  await updateChatTitle(id, trimmedTitle)

  return Response.json({ title: trimmedTitle })
}
```

### Pattern 7: Sonner Toast Setup (shadcn v4)
**What:** Add Sonner `<Toaster />` to providers for app-wide toast notifications.
**When to use:** Error handling, success feedback.
**Example:**
```typescript
// components/ui/sonner.tsx
'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()
  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
```

### Anti-Patterns to Avoid
- **Do NOT call `lib/db/` functions from components or client code** -- always go through API routes (3-layer architecture).
- **Do NOT use `middleware.ts`** -- Next.js 16 uses `proxy.ts` for route protection.
- **Do NOT store messages in UIMessage JSON format in the database** -- our DB has a flat `messages` table with `role` + `content`; convert at the boundary.
- **Do NOT use `handleSubmit` or `input` from useChat v4 API** -- AI SDK 6 uses `sendMessage({ text })` and external `useState` for input.
- **Do NOT block on title generation** -- it must be fire-and-forget so the user can continue chatting.
- **Do NOT use `asChild` in shadcn v4** -- use render prop pattern.
- **Do NOT use `OPENAI_API_KEY` env var** -- use `OPENROUTER_API_KEY` per project decision.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SSE streaming protocol | Manual ReadableStream + EventSource | `streamText()` + `useChat()` from Vercel AI SDK | Handles protocol, backpressure, abort, reconnection, message parsing |
| Message state management | Manual useState + fetch + parsing | `useChat()` hook | Manages message array, streaming state, optimistic updates, abort |
| Markdown parsing | Custom regex/parser | `react-markdown` + `remark-gfm` | Edge cases in markdown spec are endless; GFM tables, nested lists |
| Syntax highlighting | Custom tokenizer | `rehype-highlight` + `highlight.js` | 190+ languages, theme support, tested against millions of code blocks |
| Toast notifications | Custom toast system | Sonner | Positioning, animation, stacking, auto-dismiss, theme-awareness |
| Auto-scroll with user intent detection | Manual scroll event + intersection observer | Custom hook with `scrollHeight` tracking | Still custom, but encapsulate in a hook; use `scrollTop + clientHeight >= scrollHeight - threshold` |

**Key insight:** The Vercel AI SDK eliminates 80% of the streaming complexity. The remaining work is persistence bridging (DB <-> UIMessage) and UI polish.

## Common Pitfalls

### Pitfall 1: UIMessage vs DB Message Shape Mismatch
**What goes wrong:** AI SDK 6 uses `UIMessage` with `parts: [{ type: 'text', text: '...' }]` arrays, but our DB stores flat `{ role, content }`. Passing DB rows directly to `useChat({ messages })` causes type errors or silent rendering failures.
**Why it happens:** AI SDK v5/v6 moved from simple `{ role, content }` to the `parts[]` paradigm to support multi-modal messages (text, reasoning, files, tools).
**How to avoid:** Build explicit converter functions (`dbMessagesToUIMessages` and vice versa) in `lib/ai/convert-messages.ts`. Always convert at the boundary.
**Warning signs:** Messages render as empty or `[object Object]` in the UI; TypeScript errors about missing `parts` property.

### Pitfall 2: Client Disconnect Kills Stream and Loses Assistant Message
**What goes wrong:** If the user navigates away or closes the tab during streaming, the fetch is aborted, `onFinish` in the route handler never fires, and the assistant message is never persisted.
**Why it happens:** Without `consumeStream()`, the stream has backpressure from the client response. When the client disconnects, the stream aborts.
**How to avoid:** Call `result.consumeStream()` (without await) before returning the response. This removes backpressure and ensures the LLM stream completes server-side even on disconnect.
**Warning signs:** Missing assistant messages in the database after page navigation during streaming.

### Pitfall 3: Title Generation Race Condition
**What goes wrong:** Title generation fires before the assistant message is fully persisted, so `getMessagesByChatId()` returns only the user message.
**Why it happens:** `onFinish` on the client fires when streaming ends, but the server's `onFinish` (which persists the assistant message) may not have committed to the DB yet.
**How to avoid:** Trigger title generation from the server's `onFinish` callback OR add a small delay in the client's `onFinish`. Better: have the server route handler trigger title generation in its own `onFinish` after persisting the assistant message.
**Warning signs:** Titles that only reference the user's question, not the assistant's response.

### Pitfall 4: highlight.js CSS Not Loaded
**What goes wrong:** Code blocks render with correct HTML classes but no colors -- syntax highlighting is invisible.
**Why it happens:** `rehype-highlight` adds HTML classes (`hljs-keyword`, etc.) but highlight.js CSS themes must be imported separately.
**How to avoid:** Import a highlight.js theme CSS file in the layout or markdown component: `import 'highlight.js/styles/github-dark.css'` (or a theme that supports both light and dark modes, or conditionally import based on theme).
**Warning signs:** Code blocks have `<span class="hljs-keyword">` but no visual styling.

### Pitfall 5: Auto-Scroll Interferes with User Reading
**What goes wrong:** User scrolls up to read earlier messages, but new streaming tokens force-scroll them back to the bottom.
**Why it happens:** Naive auto-scroll uses `scrollIntoView()` on every token update without checking user intent.
**How to avoid:** Track whether user has scrolled up: if `scrollTop + clientHeight < scrollHeight - threshold`, disable auto-scroll. Show a "scroll to bottom" FAB to re-enable.
**Warning signs:** User complaints about "jumping" during streaming.

### Pitfall 6: Enter Key Sends Empty Messages
**What goes wrong:** Pressing Enter on an empty textarea sends an empty message to the API.
**Why it happens:** The keydown handler sends without checking input content.
**How to avoid:** Guard with `if (!inputValue.trim()) return` before calling `sendMessage()`.
**Warning signs:** Empty user messages in the database; API errors from content validation.

### Pitfall 7: sendMessage API Changed in AI SDK 6
**What goes wrong:** Using old `handleSubmit(e)` or `append({ role: 'user', content: '...' })` patterns from AI SDK v4 tutorials.
**Why it happens:** AI SDK 6 changed the client API significantly. `useChat()` now returns `sendMessage()` (not `handleSubmit`), and messages use `parts[]` not `content`.
**How to avoid:** Use `sendMessage({ text: input })` to send, and access `message.parts.filter(p => p.type === 'text')` for rendering. Refer to AI SDK v6 docs, not tutorials.
**Warning signs:** TypeScript errors about missing properties; `handleSubmit is not a function`.

### Pitfall 8: Double Message Persistence
**What goes wrong:** Both client and server attempt to save messages, resulting in duplicates.
**Why it happens:** Some AI SDK examples show client-side persistence in `onFinish`, while the route handler also persists.
**How to avoid:** Persist exclusively on the server side in the route handler. The client's job is to display; the server's job is to persist. Our route handler saves user message before streaming and assistant message in `onFinish`.
**Warning signs:** Duplicate messages in the database.

## Code Examples

### highlight.js Theme Import (Dark/Light)
```typescript
// Import in app/layout.tsx or in the markdown component
// Option A: Single theme that works in both modes
import 'highlight.js/styles/github-dark-dimmed.css'

// Option B: Conditional based on data-theme attribute (requires CSS setup)
// In global CSS:
// :root { @import 'highlight.js/styles/github.css'; }
// .dark { @import 'highlight.js/styles/github-dark.css'; }
// Note: CSS @import in nested selectors doesn't work; use two link tags or
// a single theme that looks acceptable in both modes.
```

### Auto-Scroll Hook
```typescript
// hooks/use-auto-scroll.ts
import { useCallback, useEffect, useRef, useState } from 'react'

export function useAutoScroll(dependencies: unknown[]) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const isUserScrolledUp = useRef(false)
  const THRESHOLD = 100 // pixels from bottom

  const scrollToBottom = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
    isUserScrolledUp.current = false
    setShowScrollButton(false)
  }, [])

  // Detect user scroll
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handleScroll = () => {
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - THRESHOLD
      isUserScrolledUp.current = !atBottom
      setShowScrollButton(!atBottom)
    }
    el.addEventListener('scroll', handleScroll)
    return () => el.removeEventListener('scroll', handleScroll)
  }, [])

  // Auto-scroll on new content
  useEffect(() => {
    if (!isUserScrolledUp.current) {
      scrollToBottom()
    }
  }, dependencies) // eslint-disable-line react-hooks/exhaustive-deps

  return { containerRef, showScrollButton, scrollToBottom }
}
```

### Extracting Text from Code Block Children
```typescript
// Helper to extract raw text from react-markdown's code element children
function extractTextFromChildren(element: React.ReactNode): string {
  if (typeof element === 'string') return element
  if (Array.isArray(element)) return element.map(extractTextFromChildren).join('')
  if (element && typeof element === 'object' && 'props' in element) {
    return extractTextFromChildren((element as React.ReactElement).props.children)
  }
  return ''
}
```

## State of the Art

| Old Approach (AI SDK v4) | Current Approach (AI SDK v6) | When Changed | Impact |
|--------------------------|------------------------------|--------------|--------|
| `useChat()` returns `{ messages, handleSubmit, input, handleInputChange }` | `useChat()` returns `{ messages, sendMessage, stop, status }` | AI SDK v5 (July 2025) | Input management is external; `sendMessage({ text })` replaces form-based `handleSubmit` |
| Messages have `{ role, content }` | Messages have `{ role, parts: [{ type: 'text', text }] }` | AI SDK v5 | Multi-modal support; text must be extracted from parts |
| `result.toAIStreamResponse()` | `result.toUIMessageStreamResponse()` | AI SDK v5 | New stream protocol with richer message metadata |
| `CoreMessage[]` passed to model | `convertToModelMessages(UIMessage[])` | AI SDK v5 | Explicit conversion required between UI and model message formats |
| Manual `OpenAI` SDK with `baseURL` | `@openrouter/ai-sdk-provider` v2.3.3 | 2025 | Native AI SDK integration; no manual OpenAI configuration |

**Deprecated/outdated:**
- `handleSubmit`, `handleInputChange`, `input` from useChat: replaced by `sendMessage()` and external state
- `toAIStreamResponse()`, `toDataStreamResponse()`: replaced by `toUIMessageStreamResponse()`
- `Message` type with `content: string`: replaced by `UIMessage` with `parts[]`
- `append()`: replaced by `sendMessage()`

**Important note on CONTEXT.md locked decision:** The CONTEXT.md specifies "OpenAI SDK with OpenRouter baseURL" pattern (`new OpenAI({ baseURL: ... })`). However, the `@openrouter/ai-sdk-provider` package (v2.3.3) is the current standard and provides a cleaner integration with the AI SDK. The `createOpenRouter()` function wraps the OpenAI-compatible protocol internally. The planner should use `@openrouter/ai-sdk-provider` as it achieves the same goal with better AI SDK integration.

## Open Questions

1. **highlight.js theme for dark/light mode**
   - What we know: highlight.js ships many CSS themes; `github.css` for light and `github-dark.css` for dark are popular choices.
   - What's unclear: Whether to use a single "universal" theme or conditionally load based on `next-themes` theme.
   - Recommendation: Use `github-dark-dimmed.css` as a single theme that works acceptably in both modes, OR use two `<link>` tags toggled by class. Discretion area -- executor decides.

2. **Message ID consistency between client and server**
   - What we know: `useChat` generates client-side IDs for user messages; `streamText` generates server-side IDs for assistant messages. Our DB generates its own UUIDs.
   - What's unclear: Whether ID mismatches between useChat's state and DB records cause issues when reloading.
   - Recommendation: Since we load `initialMessages` from DB (with DB IDs) on page load, and the in-session messages use SDK-generated IDs, this is fine -- page reload resets to DB truth. No action needed.

3. **OpenRouter rate limits on free models**
   - What we know: `meta-llama/llama-4-maverick:free` is free on OpenRouter but may have rate limits.
   - What's unclear: Exact rate limits for free-tier models.
   - Recommendation: Handle 429 responses gracefully with error toasts. Do not block on this.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | Assumed available | 20+ | -- |
| pnpm | Package install | Assumed available | -- | -- |
| OpenRouter API | LLM calls | External service | -- | Error toast on API failure |
| `OPENROUTER_API_KEY` | LLM authentication | Needs `.env.local` | -- | Must be configured by user |

**Missing dependencies with no fallback:**
- `OPENROUTER_API_KEY` must be set in `.env.local` for LLM calls to work.

**Missing dependencies with fallback:**
- None. All npm packages can be installed.

**Note:** The `.env.example` currently has `OPENAI_API_KEY` -- this needs to be updated to `OPENROUTER_API_KEY`.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None currently installed |
| Config file | None -- needs Wave 0 setup |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MSG-01 | Send message and receive AI response | manual | Manual: send message in browser, verify response appears | N/A |
| MSG-02 | Token-by-token streaming via SSE | manual | Manual: observe streaming in browser network tab | N/A |
| MSG-03 | Markdown with syntax-highlighted code blocks | manual | Manual: send "write a hello world in Python", verify highlighting | N/A |
| MSG-04 | Full conversation history loads on chat open | manual | Manual: refresh chat page, verify messages persist | N/A |
| UX-02 | Welcome screen with suggested prompts | manual | Manual: open new chat, verify 4 prompt cards visible | N/A |
| UX-03 | Error toasts and retry buttons | manual | Manual: disconnect network, send message, verify toast + retry | N/A |

### Sampling Rate
- **Per task commit:** Build check (`pnpm build`) + lint (`pnpm lint`)
- **Per wave merge:** Build check + manual smoke test
- **Phase gate:** Full manual walkthrough of all 6 requirements

### Wave 0 Gaps
- No test framework installed -- all requirements are manual-only for this phase (streaming AI chat is inherently difficult to unit test without mocking the entire AI SDK + OpenRouter)
- Build verification (`pnpm build`) serves as automated regression gate

## Sources

### Primary (HIGH confidence)
- Next.js 16 docs at `node_modules/next/dist/docs/` -- route handler conventions, streaming guide, `params` as Promise, `maxDuration` config
- [AI SDK Getting Started: Next.js App Router](https://ai-sdk.dev/docs/getting-started/nextjs-app-router) -- streamText + useChat patterns
- [AI SDK UI: Chatbot Message Persistence](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence) -- onFinish, consumeStream, initialMessages patterns
- [AI SDK Cookbook: Stream Text with Chat Prompt](https://ai-sdk.dev/cookbook/next/stream-text-with-chat-prompt) -- DefaultChatTransport, sendMessage, parts-based messages
- [OpenRouter AI SDK Provider](https://ai-sdk.dev/providers/community-providers/openrouter) -- createOpenRouter, .chat() model specification
- [@openrouter/ai-sdk-provider on npm](https://www.npmjs.com/package/@openrouter/ai-sdk-provider) -- v2.3.3, peer deps
- [AI SDK 6 blog post](https://vercel.com/blog/ai-sdk-6) -- v6 changes, not major breaking from v5

### Secondary (MEDIUM confidence)
- [shadcn/ui Sonner docs](https://ui.shadcn.com/docs/components/radix/sonner) -- Toaster component with next-themes integration
- [react-markdown GitHub](https://github.com/remarkjs/react-markdown) -- components prop, rehypePlugins, remarkPlugins
- npm registry version checks -- all package versions verified against registry 2026-03-29

### Tertiary (LOW confidence)
- [Streamdown library](https://tyy.ai/streamdown-ai/) -- streaming-aware markdown alternative (not used, but noted as option)
- [Copy button patterns](https://blog.designly.biz/react-markdown-how-to-create-a-copy-code-button) -- community pattern for code block copy buttons

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all packages verified against npm registry, AI SDK v6 docs fetched and confirmed
- Architecture: HIGH -- patterns directly from official AI SDK docs + established project patterns from phases 1-3
- Pitfalls: HIGH -- well-documented issues with AI SDK message types, streaming persistence, and client disconnect handling
- Code examples: MEDIUM -- adapted from official docs to project conventions; exact API surface of `useChat` in v6 may have minor variations

**Research date:** 2026-03-29
**Valid until:** 2026-04-15 (AI SDK evolves quickly; verify against docs if executing later)
