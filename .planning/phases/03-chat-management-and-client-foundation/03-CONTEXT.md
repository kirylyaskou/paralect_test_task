# Phase 3: Chat Management and Client Foundation - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning
**Mode:** Smart Discuss (autonomous — all recommended defaults accepted)

<domain>
## Phase Boundary

Users can create, browse, and manage chats through a responsive sidebar interface with real-time optimistic feedback. Includes: Chat CRUD API routes, TanStack Query hooks with optimistic updates, sidebar component with chat list, responsive layout (sidebar on desktop, Sheet on mobile), dark/light theme toggle, ownership validation. Does NOT include: message sending, AI streaming, file attachments, anonymous access.

</domain>

<decisions>
## Implementation Decisions

### Sidebar & Layout
- Use shadcn Sidebar component (SidebarProvider, Sidebar, SidebarContent, etc.) — it handles responsive collapsing, keyboard shortcuts, and cookie-persisted state out of the box
- Sidebar width: 256px desktop (shadcn default `--sidebar-width: 16rem`), 288px mobile sheet (shadcn default `--sidebar-width-mobile: 18rem`)
- Mobile sidebar trigger: PanelLeft icon button in main content header area — standard shadcn SidebarTrigger
- Active chat: highlight with `--sidebar-accent` background on the active SidebarMenuItem
- Main layout: SidebarProvider wrapping Sidebar + main content area in `(main)/layout.tsx`

### Chat CRUD Interactions
- New chat: click "New chat" button in sidebar header → POST /api/chats → navigate to /chat/[id] — chat created with null title (auto-generated later in Phase 4)
- Delete: dropdown menu (MoreHorizontal icon) per chat item → "Delete chat" option → confirmation Dialog ("This will permanently delete this chat and all its messages") with "Keep chat" / "Delete chat" buttons
- Optimistic updates: use TanStack Query `onMutate` to update cache immediately, `onError` to rollback, `onSettled` to invalidate — standard optimistic mutation pattern
- Untitled chats display "New Chat" as placeholder text in sidebar

### Data Fetching & State
- Query keys: `['chats']` for user's chat list, `['chat', chatId]` for single chat
- Hooks: `useChats()` for list, `useCreateChat()` mutation, `useDeleteChat()` mutation — all in `hooks/use-chats.ts`
- API routes: GET /api/chats (list user's chats), POST /api/chats (create), DELETE /api/chats/[id] (delete with ownership check)
- Ownership validation: API routes extract userId from session JWT, compare with chat.user_id — return 403 if mismatch
- Error handling: toast notifications for failed mutations (shadcn Sonner/toast)

### Theme & Visual Polish
- Theme toggle: Sun/Moon icon button in sidebar footer — uses next-themes `useTheme()` hook
- Theme persistence: handled by next-themes (localStorage + class attribute on html element) — already configured in providers.tsx
- Empty sidebar state: "No chats yet" heading + "Create your first chat to get started." body text
- Loading states: skeleton components matching chat list item dimensions during initial fetch
- All visual contracts follow 03-UI-SPEC.md (spacing, typography, color, copywriting)

### Claude's Discretion
- Exact toast component choice (Sonner vs shadcn Toast) — pick what integrates best
- Skeleton component implementation details
- Exact dropdown menu positioning and animation
- API response shapes beyond what Zod schemas define
- Any micro-interactions not specified in UI-SPEC

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/db/chats.ts` — Full CRUD: getChatsByUserId, getChatById, createChat, updateChatTitle, deleteChat — all using server-only supabase client
- `lib/db/client.ts` — Supabase service_role client (server-only)
- `lib/auth/session.ts` — Session validation utilities (JWT verification)
- `lib/errors.ts` — DatabaseError class for consistent error handling
- `lib/schemas/` — Zod validation schemas (auth schemas exist, chat schemas TBD)
- `app/providers.tsx` — TanStack Query + ThemeProvider already configured (attribute="class", defaultTheme="system", enableSystem)
- `components/ui/` — shadcn button, alert, card, input, label already installed

### Established Patterns
- `server-only` import at top of every `lib/db/` file
- Throw errors in DB layer, catch in API routes and return HTTP status codes
- Direct per-module imports (no barrel files)
- Zod 4 conventions — z.email() top-level function
- Route groups: `(auth)` for login/signup, `(main)` for protected routes
- Client-side fetch to API routes (not Server Actions) — maintains 3-layer architecture
- Responsive card pattern: border-0 shadow-none on mobile, sm:border sm:shadow-sm on tablet+

### Integration Points
- `app/(main)/layout.tsx` — currently empty wrapper, needs SidebarProvider + Sidebar
- `components/chat/` — empty directory, ready for chat components
- `components/sidebar/` — empty directory, ready for sidebar components
- `hooks/` — empty directory, ready for TanStack Query hooks
- `app/api/chats/` — needs route.ts for GET/POST
- `app/api/chats/[id]/` — needs route.ts for DELETE
- `app/(main)/chat/[id]/` — needs page.tsx for individual chat view

</code_context>

<specifics>
## Specific Ideas

- UI-SPEC exists at `03-UI-SPEC.md` — all visual contracts (spacing, typography, color, copywriting, accessibility) are locked there
- Phase 2 established proxy.ts pattern for auth — API routes should use same session validation approach
- "New Chat" button is the primary accent-colored CTA in the sidebar (only element using `--primary`)

</specifics>

<deferred>
## Deferred Ideas

- Chat rename/title editing — will be handled via auto-generation in Phase 4
- Message display within chat — Phase 4
- Supabase Realtime multi-tab sync — Phase 5
- Anonymous access — Phase 5

</deferred>

---

*Phase: 03-chat-management-and-client-foundation*
*Context gathered: 2026-03-29 via Smart Discuss (autonomous)*
