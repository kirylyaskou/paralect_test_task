# Architecture Research

**Domain:** ChatGPT-like chatbot web application (Next.js App Router + Supabase + TanStack Query)
**Researched:** 2026-03-27
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
                          BROWSER (Client Layer)
 =====================================================================
 |  [Chat UI]     [Sidebar]     [Auth Forms]    [Theme Toggle]       |
 |       |            |              |                                |
 |  [useChat]   [useQuery/      [useMutation]                        |
 |  (AI SDK)    useMutation]    (TanStack Q)                         |
 |       |      (TanStack Q)        |                                |
 |       |            |              |                                |
 |  [Supabase        |              |                                |
 |   Realtime] ------+--- fetch() --+--- to /api/* routes            |
 |  (anon key)                                                       |
 =====================================================================
              |  SSE stream   |  JSON req/res  |
              v               v                v
                       SERVER (API Layer)
 =====================================================================
 |  app/api/chat/route.ts     app/api/chats/route.ts                 |
 |  app/api/auth/route.ts     app/api/messages/route.ts              |
 |  app/api/upload/route.ts   app/api/anonymous/route.ts             |
 |       |                          |                                |
 |  [Auth validation]    [Input validation (Zod)]                    |
 |       |                          |                                |
 |  [OpenAI SDK]          [DB function calls]                        |
 |  (streamText)                    |                                |
 =====================================================================
                                    |
                                    v
                       DATABASE (DB Layer)
 =====================================================================
 |  lib/db/users.ts    lib/db/chats.ts    lib/db/messages.ts         |
 |  lib/db/documents.ts    lib/db/anonymous.ts                       |
 |       |                                                           |
 |  [Supabase Admin Client - service_role key]                       |
 |       |                                                           |
 |  PostgreSQL: users | chats | messages | documents | anonymous     |
 |  Storage: file attachments (images, PDFs, DOCX)                   |
 =====================================================================
```

### The Three Iron Laws

1. **Client NEVER touches the database.** All data flows through `/api/*` route handlers.
2. **Supabase `service_role` key NEVER leaves the server.** Only `lib/db/` and `app/api/` code can use it.
3. **The ONLY client-side Supabase usage is Realtime** with the `anon` key for multi-tab sync.

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Chat UI** | Display messages, handle input, stream AI responses | Client Component using Vercel AI SDK `useChat` hook |
| **Sidebar** | List chats, create/rename/delete chats | Client Component with TanStack Query `useQuery`/`useMutation` |
| **Auth Forms** | Login/register, session management | Client Component with `useMutation` calling `/api/auth/*` |
| **API Route Handlers** | Validate auth, validate input, orchestrate DB + LLM calls | `app/api/*/route.ts` files, thin controller layer |
| **DB Functions** | All database reads/writes via Supabase admin client | `lib/db/*.ts` files, pure data access functions |
| **Supabase Admin Client** | Single server-side Supabase instance with `service_role` key | `lib/supabase/admin.ts`, imported only by `lib/db/` |
| **Supabase Browser Client** | Realtime subscriptions only | `lib/supabase/browser.ts` with `anon` key, used only in Realtime hook |
| **Middleware** | Session refresh, route protection, redirect unauthenticated users | `middleware.ts` at project root |

## Recommended Project Structure

```
src/
├── app/
│   ├── layout.tsx                 # Root layout: Providers wrapper
│   ├── page.tsx                   # Landing / redirect to chat
│   ├── (auth)/
│   │   ├── login/page.tsx         # Login page
│   │   └── register/page.tsx      # Register page
│   ├── (chat)/
│   │   ├── layout.tsx             # Chat layout: sidebar + main area
│   │   ├── page.tsx               # New chat / welcome screen
│   │   └── [chatId]/
│   │       └── page.tsx           # Specific chat conversation
│   └── api/
│       ├── auth/
│       │   ├── register/route.ts  # POST: create account
│       │   ├── login/route.ts     # POST: sign in
│       │   ├── logout/route.ts    # POST: sign out
│       │   └── me/route.ts        # GET: current user
│       ├── chats/
│       │   ├── route.ts           # GET: list chats, POST: create chat
│       │   └── [chatId]/
│       │       ├── route.ts       # GET: chat detail, PATCH: rename, DELETE: delete
│       │       └── messages/
│       │           └── route.ts   # GET: messages for chat
│       ├── chat/
│       │   └── route.ts           # POST: send message + stream AI response (SSE)
│       ├── upload/
│       │   └── route.ts           # POST: upload image/document
│       └── anonymous/
│           └── route.ts           # POST: check/increment anonymous question count
├── components/
│   ├── ui/                        # Shadcn/ui primitives (Button, Input, Sheet, etc.)
│   ├── chat/
│   │   ├── chat-messages.tsx      # Message list with markdown rendering
│   │   ├── chat-input.tsx         # Message input with attachment support
│   │   ├── chat-message.tsx       # Single message bubble (user or assistant)
│   │   ├── chat-welcome.tsx       # Empty state / welcome screen
│   │   └── chat-streaming.tsx     # Streaming indicator
│   ├── sidebar/
│   │   ├── sidebar.tsx            # Chat list sidebar
│   │   ├── sidebar-item.tsx       # Single chat item (rename/delete)
│   │   └── sidebar-mobile.tsx     # Mobile Sheet-based sidebar
│   ├── auth/
│   │   ├── login-form.tsx         # Login form component
│   │   └── register-form.tsx      # Register form component
│   ├── layout/
│   │   ├── header.tsx             # Top bar with theme toggle
│   │   └── providers.tsx          # QueryClientProvider + ThemeProvider
│   └── shared/
│       ├── markdown-renderer.tsx  # Markdown + syntax highlighting
│       └── file-upload.tsx        # Drag-and-drop / paste file handler
├── hooks/
│   ├── use-chats.ts               # TanStack Query: fetch/mutate chats
│   ├── use-messages.ts            # TanStack Query: fetch messages for a chat
│   ├── use-auth.ts                # TanStack Query: auth state + mutations
│   ├── use-realtime-sync.ts       # Supabase Realtime: multi-tab chat list sync
│   └── use-anonymous.ts           # Anonymous question tracking
├── lib/
│   ├── supabase/
│   │   ├── admin.ts               # Server-only: createClient with service_role key
│   │   └── browser.ts             # Client-only: createClient with anon key (Realtime ONLY)
│   ├── db/
│   │   ├── users.ts               # DB operations: user CRUD
│   │   ├── chats.ts               # DB operations: chat CRUD
│   │   ├── messages.ts            # DB operations: message CRUD
│   │   ├── documents.ts           # DB operations: document metadata
│   │   └── anonymous.ts           # DB operations: anonymous usage tracking
│   ├── ai/
│   │   ├── openai.ts              # OpenAI client setup
│   │   ├── stream.ts              # streamText wrapper with system prompt
│   │   └── title-generator.ts     # Auto-generate chat titles
│   ├── validators/
│   │   ├── chat.ts                # Zod schemas for chat endpoints
│   │   ├── message.ts             # Zod schemas for message endpoints
│   │   └── auth.ts                # Zod schemas for auth endpoints
│   └── utils/
│       ├── auth.ts                # Server-side auth helpers (validate session)
│       ├── errors.ts              # Standardized API error responses
│       └── extract-text.ts        # PDF/DOCX text extraction
├── types/
│   ├── chat.ts                    # Chat, Message, User type definitions
│   ├── api.ts                     # API request/response types
│   └── database.ts                # Database row types (generated or manual)
└── middleware.ts                   # Session refresh + route protection
```

### Structure Rationale

- **`app/api/`**: Thin controller layer. Each route handler validates auth, validates input with Zod, calls `lib/db/` functions, and returns responses. No business logic leaks into routes.
- **`lib/db/`**: The ONLY code that imports the Supabase admin client. Every function is a pure data operation (e.g., `getChatsForUser(userId)`, `createMessage(chatId, content, role)`). This makes the layer testable and enforces the separation constraint.
- **`lib/ai/`**: Isolated AI/LLM logic. Easy to swap providers later (the adapter abstraction). Called only from API route handlers.
- **`lib/supabase/admin.ts`**: Single file creating the service_role client. Imported ONLY by `lib/db/` functions. Never imported from `components/`, `hooks/`, or client code.
- **`lib/supabase/browser.ts`**: Creates client with `anon` key. Imported ONLY by `hooks/use-realtime-sync.ts`. This is the sole allowed client-side Supabase usage.
- **`hooks/`**: Custom hooks wrap TanStack Query operations. They call `fetch('/api/...')` -- never database functions. Each hook encapsulates query keys, fetch logic, and mutation/optimistic update logic.
- **`components/`**: Pure presentation + interactivity. Components consume hooks. They never import from `lib/db/` or `lib/supabase/admin.ts`.
- **`(auth)/` and `(chat)/` route groups**: Separate layout trees. Auth pages have a centered layout; chat pages have the sidebar layout. Route groups don't affect URLs.

## Architectural Patterns

### Pattern 1: Strict Layer Boundary Enforcement

**What:** Each layer has a strict import boundary. Client code imports hooks; hooks import fetch utilities; API routes import DB functions and validators; DB functions import the admin Supabase client. No layer skips another.

**When to use:** Always -- this is the core architectural constraint for this project.

**Trade-offs:** Slightly more boilerplate (a simple read requires hook -> fetch -> route -> db function -> response) but provides absolute separation, testability, and the architectural purity the assignment demands.

**Example:**
```typescript
// lib/db/chats.ts (DB Layer)
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function getChatsForUser(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('chats')
    .select('id, title, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data;
}

// app/api/chats/route.ts (API Layer)
import { getChatsForUser } from '@/lib/db/chats';
import { validateSession } from '@/lib/utils/auth';

export async function GET(request: Request) {
  const user = await validateSession(request);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const chats = await getChatsForUser(user.id);
  return Response.json(chats);
}

// hooks/use-chats.ts (Client Layer)
import { useQuery } from '@tanstack/react-query';

export function useChats() {
  return useQuery({
    queryKey: ['chats'],
    queryFn: async () => {
      const res = await fetch('/api/chats');
      if (!res.ok) throw new Error('Failed to fetch chats');
      return res.json();
    },
  });
}
```

### Pattern 2: SSE Streaming for AI Responses

**What:** The chat endpoint uses Vercel AI SDK's `streamText` to stream LLM tokens via Server-Sent Events. The client uses the AI SDK's `useChat` hook which manages the SSE connection, message state, and streaming display automatically.

**When to use:** For the main chat interaction -- sending a message and receiving the AI response.

**Trade-offs:** `useChat` manages its own message state separately from TanStack Query. This means chat messages are NOT managed by TanStack Query -- the AI SDK handles streaming state. TanStack Query manages the chat list, chat metadata, and other non-streaming data. This dual-state approach is necessary because TanStack Query is not designed for streaming token-by-token updates.

**Example:**
```typescript
// app/api/chat/route.ts (API Layer -- SSE streaming)
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { getMessagesForChat } from '@/lib/db/messages';
import { createMessage } from '@/lib/db/messages';
import { validateSession } from '@/lib/utils/auth';

export async function POST(request: Request) {
  const user = await validateSession(request);
  const { messages, chatId } = await request.json();

  // Persist user message to DB
  await createMessage(chatId, messages[messages.length - 1].content, 'user', user.id);

  // Stream AI response
  const result = streamText({
    model: openai('gpt-4o-mini'),
    messages,
    onFinish: async ({ text }) => {
      // Persist assistant message after streaming completes
      await createMessage(chatId, text, 'assistant', null);
    },
  });

  return result.toUIMessageStreamResponse();
}

// components/chat/chat-messages.tsx (Client Layer)
'use client';
import { useChat } from '@ai-sdk/react';

export function ChatArea({ chatId }: { chatId: string }) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    body: { chatId },
    initialMessages: [], // loaded from /api/chats/[chatId]/messages on mount
  });
  // render messages + input form
}
```

### Pattern 3: TanStack Query for CRUD Operations with Optimistic Updates

**What:** All non-streaming data fetching (chat list, chat metadata, initial message history) goes through TanStack Query. Mutations for creating, renaming, and deleting chats use optimistic updates for instant UI feedback.

**When to use:** All CRUD operations on chats. Also used for loading initial message history before `useChat` takes over.

**Trade-offs:** Optimistic updates add complexity but are essential for a snappy chatbot UX. The cache-level approach is needed because the sidebar and main area both display chat data.

**Example:**
```typescript
// hooks/use-chats.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useDeleteChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chatId: string) => {
      const res = await fetch(`/api/chats/${chatId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
    },
    onMutate: async (chatId) => {
      await queryClient.cancelQueries({ queryKey: ['chats'] });
      const previous = queryClient.getQueryData(['chats']);
      queryClient.setQueryData(['chats'], (old: Chat[]) =>
        old.filter((c) => c.id !== chatId)
      );
      return { previous };
    },
    onError: (_err, _chatId, context) => {
      queryClient.setQueryData(['chats'], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
}
```

### Pattern 4: Supabase Realtime for Multi-Tab Sync (Client-Side Only Exception)

**What:** A single hook subscribes to Supabase Realtime `postgres_changes` on the `chats` table using the browser client (anon key). When another tab creates, renames, or deletes a chat, this hook invalidates the TanStack Query cache so the sidebar updates.

**When to use:** Only for multi-tab synchronization of the chat list.

**Trade-offs:** Requires a separate Supabase browser client with the anon key, which is the one exception to the "no client-side Supabase" rule. Realtime needs RLS enabled on the monitored tables (or use Broadcast as a simpler alternative).

**Example:**
```typescript
// hooks/use-realtime-sync.ts
'use client';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabaseBrowser } from '@/lib/supabase/browser';

export function useRealtimeSync(userId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabaseBrowser
      .channel('chat-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chats', filter: `user_id=eq.${userId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['chats'] });
        }
      )
      .subscribe();

    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, [userId, queryClient]);
}
```

## Data Flow

### Request Flow: Standard CRUD (e.g., Create Chat)

```
User clicks "New Chat"
    |
    v
[ChatSidebar Component] calls useCreateChat().mutate()
    |
    v
[hooks/use-chats.ts] onMutate: optimistically adds chat to cache
    |
    v
[fetch POST /api/chats] sends request to API route
    |
    v
[app/api/chats/route.ts] validates session, validates input (Zod),
    |                      calls createChat() from lib/db/chats.ts
    v
[lib/db/chats.ts] supabaseAdmin.from('chats').insert({...})
    |
    v
[PostgreSQL] inserts row, returns new chat
    |
    v
Response bubbles back: DB -> API Route -> fetch response -> onSuccess
    |
    v
[hooks/use-chats.ts] onSettled: invalidates ['chats'] query
    |
    v
[Supabase Realtime] broadcasts INSERT event to other tabs
    |
    v
[Other tabs] useRealtimeSync invalidates ['chats'] -> sidebar refreshes
```

### Request Flow: Send Message + Stream AI Response

```
User types message, presses Enter
    |
    v
[ChatArea Component] useChat.handleSubmit()
    |
    v
[AI SDK useChat] appends user message to local state,
    |              sends POST to /api/chat with full message history
    v
[app/api/chat/route.ts]
    |-- validates session
    |-- persists user message: lib/db/messages.createMessage()
    |-- calls streamText() with OpenAI gpt-4o-mini
    |-- returns SSE stream via toUIMessageStreamResponse()
    v
[SSE Stream] tokens arrive one by one
    |
    v
[AI SDK useChat] appends tokens to assistant message in real time
    |
    v
[ChatArea Component] re-renders with each new token (streaming effect)
    |
    v
[streamText onFinish callback] persists complete assistant message to DB
    |
    v
(If first message) auto-generate title via LLM, update chat title in DB
    |
    v
[Supabase Realtime] broadcasts chat UPDATE (new title) to other tabs
```

### Request Flow: Authentication

```
User submits login form
    |
    v
[LoginForm Component] calls useLogin().mutate({ email, password })
    |
    v
[hooks/use-auth.ts] fetch POST /api/auth/login
    |
    v
[app/api/auth/login/route.ts]
    |-- validates input (Zod)
    |-- calls supabaseAdmin.auth.signInWithPassword()
    |-- sets session cookie in response headers
    |-- returns user data
    v
[middleware.ts] on subsequent requests:
    |-- reads session cookie
    |-- calls supabase.auth.getUser() to validate
    |-- refreshes token if needed, updates cookie
    |-- redirects to /login if unauthenticated on protected routes
```

### State Management

```
TanStack Query Cache (client)              AI SDK State (client)
 |- ['chats'] -> chat list                  |- messages[] -> current conversation
 |- ['chats', chatId] -> chat detail        |- input -> current input text
 |- ['messages', chatId] -> initial msgs    |- isLoading -> streaming status
 |- ['user'] -> current user data
 |
 |--- Invalidated by: mutations, Realtime   |--- Managed by: useChat hook
 |--- Persisted: no (refetch on mount)      |--- Persisted: no (per-session)
```

### Key Data Flows

1. **Chat CRUD:** Component -> Hook (TanStack Query) -> fetch -> API Route -> DB Function -> Supabase Admin -> PostgreSQL. Response reverses. Realtime broadcasts to other tabs.
2. **AI Streaming:** Component -> useChat (AI SDK) -> fetch POST -> API Route -> streamText (Vercel AI SDK) -> OpenAI API -> SSE stream back to useChat -> Component renders tokens.
3. **Multi-tab Sync:** Supabase Realtime (postgres_changes on `chats` table) -> `useRealtimeSync` hook -> TanStack Query `invalidateQueries` -> sidebar refetch.
4. **File Upload:** Component -> fetch POST /api/upload -> API Route -> Supabase Storage (via admin client) -> returns URL. URL attached to message on send.

## Database Schema Overview

```
users
 |- id: UUID (PK, matches auth.users.id)
 |- email: TEXT (UNIQUE)
 |- created_at: TIMESTAMPTZ

chats
 |- id: UUID (PK)
 |- user_id: UUID (FK -> users.id, nullable for anonymous)
 |- title: TEXT (nullable, auto-generated after first message)
 |- created_at: TIMESTAMPTZ
 |- updated_at: TIMESTAMPTZ
 INDEX: (user_id, updated_at DESC)

messages
 |- id: UUID (PK)
 |- chat_id: UUID (FK -> chats.id, ON DELETE CASCADE)
 |- role: TEXT ('user' | 'assistant' | 'system')
 |- content: TEXT
 |- image_urls: TEXT[] (nullable)
 |- created_at: TIMESTAMPTZ
 INDEX: (chat_id, created_at ASC)

documents
 |- id: UUID (PK)
 |- message_id: UUID (FK -> messages.id, ON DELETE CASCADE)
 |- file_name: TEXT
 |- file_url: TEXT (Supabase Storage URL)
 |- extracted_text: TEXT
 |- created_at: TIMESTAMPTZ
 INDEX: (message_id)

anonymous_usage
 |- id: UUID (PK)
 |- fingerprint: TEXT (UNIQUE)
 |- questions_used: INTEGER (default 0)
 |- created_at: TIMESTAMPTZ
 |- updated_at: TIMESTAMPTZ
 INDEX: (fingerprint)
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-100 users (demo/academy) | Current architecture is perfect. Single Supabase project, Vercel serverless. No optimization needed. |
| 100-1k users | Add pagination to chat list and message history. Consider cursor-based pagination for messages. Set `staleTime` on TanStack Query to reduce refetches. |
| 1k-10k users | Move LLM calls behind a queue to avoid serverless timeout limits. Add Redis caching for session validation. Consider database connection pooling via Supabase's built-in PgBouncer. |

### Scaling Priorities

1. **First bottleneck: OpenAI rate limits and latency.** The LLM API call dominates response time. Mitigation: the streaming pattern already hides latency from the user. For rate limits, implement per-user rate limiting in the API layer.
2. **Second bottleneck: Database connections on serverless.** Each Vercel function opens a new connection. Mitigation: Supabase includes PgBouncer by default, but monitor connection count. Use a single admin client instance per request, not per query.

## Anti-Patterns

### Anti-Pattern 1: Importing DB Functions in Components

**What people do:** Import `lib/db/chats.ts` directly in a Server Component because "it runs on the server anyway."
**Why it's wrong:** Violates the strict layer separation that is the primary evaluation criterion. Even though Server Components technically run on the server, the assignment spec explicitly forbids this. Data must flow through API routes.
**Do this instead:** Always go through hooks -> fetch -> API routes -> DB functions. No shortcuts.

### Anti-Pattern 2: Using `useChat` AND TanStack Query for the Same Messages

**What people do:** Try to manage chat messages both in TanStack Query cache and in `useChat` state, leading to sync conflicts.
**Why it's wrong:** `useChat` already manages message state internally (including streaming). Duplicating this in TanStack Query creates two sources of truth that drift apart during streaming.
**Do this instead:** Use TanStack Query to fetch initial messages (for loading a previous chat), pass them to `useChat` as `initialMessages`, then let `useChat` own the message state for the active conversation. Use TanStack Query for everything else (chat list, metadata, user data).

### Anti-Pattern 3: Exposing service_role Key to Client

**What people do:** Use `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` or import the admin client in a file that gets bundled for the browser.
**Why it's wrong:** The service_role key bypasses ALL security. Anyone with it has full database access.
**Do this instead:** The env var must be `SUPABASE_SERVICE_ROLE_KEY` (no `NEXT_PUBLIC_` prefix). The admin client file (`lib/supabase/admin.ts`) must never be imported from any file that uses `'use client'` or is imported by a client component.

### Anti-Pattern 4: Relying Only on Middleware for Auth

**What people do:** Check auth in middleware and assume API routes are protected.
**Why it's wrong:** CVE-2025-29927 showed middleware can be bypassed. Defense in depth is mandatory.
**Do this instead:** Validate the session in EVERY API route handler independently. Middleware is a convenience layer for redirects, not a security boundary. Use `supabase.auth.getUser()` (not `getSession()`) in each route handler.

### Anti-Pattern 5: Forgetting Realtime Channel Cleanup

**What people do:** Subscribe to Supabase Realtime in a `useEffect` without returning a cleanup function.
**Why it's wrong:** Each navigation or re-render creates a new subscription without closing the old one. This leaks WebSocket connections and causes duplicate event processing.
**Do this instead:** Always return a cleanup function that calls `supabase.removeChannel(channel)` in the `useEffect` return.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **OpenAI API** | Vercel AI SDK `streamText()` in API route handlers | Use `@ai-sdk/openai` provider. Model: `gpt-4o-mini`. System prompt defined in `lib/ai/stream.ts`. |
| **Supabase Auth** | `@supabase/ssr` for cookie-based server-side auth | PKCE flow by default. Middleware refreshes tokens. `getUser()` for validation, never `getSession()`. |
| **Supabase PostgreSQL** | `@supabase/supabase-js` admin client with `service_role` key | All queries in `lib/db/`. No RLS needed (service_role bypasses it). |
| **Supabase Storage** | Admin client `.storage.from('attachments').upload()` | For images and documents. Return public URL to attach to messages. |
| **Supabase Realtime** | Browser client with `anon` key, `postgres_changes` channel | Need minimal RLS on monitored tables OR use Broadcast channel instead. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Components <-> Hooks | Direct import, React hook pattern | Components call hooks; hooks return data + mutation functions |
| Hooks <-> API Routes | HTTP fetch (GET/POST/PATCH/DELETE) | Standard REST. JSON bodies. Proper status codes. |
| API Routes <-> DB Layer | Direct function import | Routes import from `lib/db/`. Synchronous call within the same serverless function. |
| API Routes <-> AI Layer | Direct function import | Routes import from `lib/ai/`. `streamText` returns a streamable response. |
| Tabs <-> Tabs | Supabase Realtime WebSocket | All tabs subscribe to same channel. DB change in one tab triggers invalidation in others. |

## Build Order (Dependency Chain)

The architecture has clear dependency layers. Build bottom-up:

```
Phase 1: Foundation (no dependencies)
 |- Supabase project setup + database schema
 |- lib/supabase/admin.ts (server client)
 |- lib/db/* (all DB access functions)
 |- types/* (shared TypeScript types)
 |- lib/validators/* (Zod schemas)

Phase 2: API Layer (depends on Phase 1)
 |- lib/utils/auth.ts (session validation helper)
 |- middleware.ts (route protection)
 |- app/api/auth/* (register, login, logout, me)
 |- app/api/chats/* (CRUD routes)
 |- app/api/chats/[chatId]/messages/* (message routes)

Phase 3: Client Foundation (depends on Phase 2)
 |- components/layout/providers.tsx (QueryClient + Theme)
 |- hooks/use-auth.ts
 |- hooks/use-chats.ts
 |- hooks/use-messages.ts
 |- components/auth/* (login/register forms)

Phase 4: Chat Core (depends on Phase 2 + 3)
 |- lib/ai/openai.ts + lib/ai/stream.ts
 |- app/api/chat/route.ts (SSE streaming endpoint)
 |- components/chat/* (chat UI with useChat)
 |- components/sidebar/* (chat list with TanStack Query)
 |- app/(chat)/layout.tsx + pages

Phase 5: Enhancements (depends on Phase 4)
 |- lib/ai/title-generator.ts (auto-title on first message)
 |- lib/supabase/browser.ts + hooks/use-realtime-sync.ts (multi-tab)
 |- File upload (images + documents)
 |- hooks/use-anonymous.ts + anonymous tracking
 |- Markdown rendering + syntax highlighting
 |- Dark/light theme toggle
 |- Responsive mobile sidebar (Sheet)
```

**Build order rationale:**
- DB layer first because everything depends on it. You cannot test API routes without DB functions.
- Auth before chat because chat routes need session validation.
- Client foundation (providers, auth hooks) before chat UI because chat pages need auth context.
- Core chat streaming before enhancements because title generation, multi-tab sync, and file upload all build on top of a working chat.
- Realtime and file upload are independent of each other and can be built in parallel within Phase 5.

## Sources

- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Supabase Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Supabase Realtime with Next.js](https://supabase.com/docs/guides/realtime/realtime-with-nextjs)
- [TanStack Query Advanced SSR Guide](https://tanstack.com/query/v5/docs/react/guides/advanced-ssr)
- [TanStack Query Optimistic Updates](https://tanstack.com/query/v4/docs/react/guides/optimistic-updates)
- [Vercel AI SDK Getting Started: Next.js App Router](https://ai-sdk.dev/docs/getting-started/nextjs-app-router)
- [Vercel AI SDK Stream Protocols](https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol)
- [AI SDK useChat Reference](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat)
- [Supabase SSR Client Creation](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Next.js App Router Project Structure](https://nextjs.org/docs/app/getting-started/project-structure)
- [Comprehensive Next.js Full Stack Architecture Guide](https://arno.surfacew.com/posts/nextjs-architecture)

---
*Architecture research for: ChatGPT-like chatbot web application*
*Researched: 2026-03-27*
