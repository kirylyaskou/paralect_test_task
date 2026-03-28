# Feature Research

**Domain:** ChatGPT-like chatbot web application (Paralect Product Academy test assignment)
**Researched:** 2026-03-27
**Confidence:** HIGH

## Feature Landscape

This research maps features across ChatGPT, Claude, Gemini, and Perplexity to determine what a ChatGPT-clone demo must have, what would impress evaluators, and what to avoid. The assignment is evaluated on architecture purity, API design, DB design, UI/UX quality, and code quality -- not feature breadth. A small set of polished features beats a large set of half-baked ones.

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Chat conversation persistence** | Every chatbot saves history; losing messages feels broken | MEDIUM | Messages stored in PostgreSQL per chat, loaded on revisit |
| **Chat sidebar with history** | ChatGPT, Claude, Gemini all have this; the primary navigation pattern | MEDIUM | Sorted by most recent, shows chat titles, scrollable list |
| **Create/delete chats** | Users need to organize conversations; no CRUD = feels like a prototype | LOW | Create via "New Chat" button, delete with confirmation dialog |
| **SSE streaming responses** | Token-by-token display is the defining UX of modern chatbots; batch responses feel laggy and broken | HIGH | Server-Sent Events with real-time token display; requires careful API route design |
| **Markdown rendering in responses** | AI responses use markdown extensively (lists, headers, bold, tables); raw markdown is unreadable | MEDIUM | react-markdown or similar; must handle tables, lists, links, bold/italic |
| **Code block syntax highlighting** | Developers and evaluators will immediately notice missing highlighting; ChatGPT and Claude both do this | LOW | rehype-highlight or Prism.js; language-specific coloring |
| **Copy code button on code blocks** | Universal pattern across all major chatbots; expected micro-interaction | LOW | Button overlaid on code blocks; copies content to clipboard |
| **Auto-resizing textarea input** | ChatGPT, Claude, Gemini all auto-expand the input; fixed-height input feels dated | LOW | Grow with content up to a max height (e.g., 200px), Shift+Enter for newlines |
| **Loading/thinking indicator** | Users need feedback that the AI is processing; blank screen = broken | LOW | Animated dots, "thinking" shimmer, or skeleton; appears between send and first token |
| **User authentication** | Every production chatbot requires auth; per-user data is table stakes | MEDIUM | Email/password via Supabase Auth; server-side session validation |
| **Responsive layout** | Mobile usage is expected; non-responsive = bad UI/UX score | MEDIUM | Sidebar as Sheet/drawer on mobile, full-width chat on mobile |
| **Dark/light theme** | Virtually all modern chat UIs support this; especially expected for developer-focused tools | LOW | CSS variables or Tailwind dark mode; toggle in header or settings |
| **Empty state / welcome screen** | Blank chat with just an input box causes "prompt anxiety"; users don't know what to ask | LOW | "How can I help you today?" greeting with 3-4 suggested prompt cards |
| **Error handling with toasts** | Network errors, API failures, rate limits must surface gracefully; silent failure = confusion | LOW | Toast notifications for errors; inline error messages for failed message sends |
| **Scroll-to-bottom button** | When scrolled up during streaming, users need a way back; auto-hiding pattern from ChatGPT | LOW | Appears when scrolled away from bottom; clicking scrolls to latest message |

### Differentiators (Competitive Advantage)

Features that set the product apart for evaluators. Not required to function, but demonstrate quality.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Auto-generated chat titles** | Shows LLM integration depth; ChatGPT does this and users expect smart titles | LOW | Call LLM with first message to generate 3-5 word title; update chat record |
| **Image attachment with vision** | Demonstrates multimodal capability; evaluators will test paste/upload | MEDIUM | Paste from clipboard or file upload; send to GPT-4o-mini vision endpoint; preview before send |
| **Document upload (PDF/DOCX)** | Shows file processing pipeline; more impressive than text-only | HIGH | Upload to Supabase Storage, extract text server-side, inject as LLM context |
| **Anonymous trial (3 free questions)** | Demonstrates conversion funnel thinking and server-side validation | MEDIUM | Track via browser fingerprint server-side; show registration prompt at limit |
| **Multi-tab sync via Realtime** | Demonstrates Supabase Realtime; shows architecture understanding beyond basic CRUD | MEDIUM | Chat list updates across tabs when creating/deleting/renaming chats |
| **Optimistic updates (TanStack Query)** | Shows advanced data-fetching patterns; UI feels instant | MEDIUM | Immediate UI update on action, rollback on error; especially for chat CRUD |
| **Chat rename (inline editing)** | Small but polished touch; shows attention to CRUD completeness | LOW | Click to edit title in sidebar; PATCH to API; update via TanStack Query |
| **Skeleton loading states** | Shows UI polish; evaluators notice loading state quality | LOW | Skeleton placeholders for sidebar list and chat messages while loading |
| **Suggested prompt cards** | Reduces friction for new users; shows UX thinking | LOW | 3-4 clickable cards on empty chat state that populate the input |
| **Stop generation button** | Users need control over long responses; shows streaming mastery | LOW | Appears during streaming; aborts the SSE connection and keeps partial response |
| **Copy full message button** | Hover action bar on assistant messages; small polish, high perceived quality | LOW | Copy icon on hover/focus; copies full markdown or plain text to clipboard |
| **Keyboard shortcuts** | Enter to send, Shift+Enter for newline, Escape to cancel -- shows developer care | LOW | Standard patterns; document in UI or tooltip |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but add complexity without proportional value for this assignment.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Multi-model selection (GPT-4, Claude, Gemini)** | Perplexity offers this; seems advanced | Requires multiple API integrations, adapter complexity, different token limits, and error handling per provider. Assignment only requires OpenAI. | Build adapter abstraction in code but only implement OpenAI; shows extensibility without the cost |
| **Message editing and regeneration** | ChatGPT has this; feels complete | Creates branching conversation trees, complex DB schema (message versions), and UI for branch navigation. High effort for demo value. | Skip for v1; the assignment spec explicitly lists this as out of scope |
| **Voice input/output** | ChatGPT Advanced Voice is popular | Requires speech-to-text API, audio handling, browser permissions, mobile quirks. Not in spec and doesn't demonstrate architecture skills. | Omit entirely; focus on text-based UX polish |
| **Plugin/tool ecosystem** | ChatGPT's biggest differentiator | Massive scope; tool execution, sandboxing, result rendering. Way beyond a demo assignment. | Omit entirely |
| **Real-time collaborative chat** | Sounds impressive | This is a single-user chatbot; multi-user chat is a different product with different architecture (WebSocket, presence, conflict resolution) | Multi-tab sync via Realtime is sufficient to show real-time capability |
| **OAuth/social login** | Reduces friction vs email/password | Extra OAuth provider setup, callback handling, edge cases. Assignment says email/password is sufficient. | Stick with email/password; clean implementation beats feature breadth |
| **Full-text search across chats** | Power user feature | Requires search indexing (pg_trgm or full-text search), search UI, result highlighting. High effort, low demo impact. | Simple chat title display in sidebar is sufficient; defer search |
| **System prompt customization** | Custom GPTs and Claude Projects do this | Adds settings UI, per-chat config storage, prompt injection concerns. Scope creep for a demo. | Use a sensible default system prompt; hardcoded is fine for v1 |
| **Payment/subscription system** | Natural extension of anonymous trial | Stripe integration, webhook handling, entitlement logic. Completely out of scope per spec. | Hardcoded anonymous limit (3 questions); registration is the "upgrade" |
| **Export/share conversations** | Nice-to-have power feature | PDF generation, share links, permission model. Low evaluator impact relative to effort. | Omit; copy message button covers the basic need |

## Feature Dependencies

```
[User Authentication]
    |
    +--requires--> [Chat CRUD (create, rename, delete)]
    |                   |
    |                   +--requires--> [Message History Persistence]
    |                   |                   |
    |                   |                   +--requires--> [SSE Streaming Responses]
    |                   |                   |                   |
    |                   |                   |                   +--enhances--> [Stop Generation Button]
    |                   |                   |                   +--enhances--> [Markdown + Code Highlighting]
    |                   |                   |                       |
    |                   |                   |                       +--enhances--> [Copy Code Button]
    |                   |                   |                       +--enhances--> [Copy Message Button]
    |                   |                   |
    |                   |                   +--enhances--> [Image Attachment + Vision]
    |                   |                   +--enhances--> [Document Upload]
    |                   |
    |                   +--enhances--> [Auto-generated Chat Titles]
    |                   +--enhances--> [Chat Rename]
    |                   +--enhances--> [Multi-tab Sync via Realtime]
    |
    +--enhances--> [Optimistic Updates (TanStack Query)]

[Anonymous Trial (3 free questions)]
    +--independent of auth (tracks by fingerprint)
    +--converts to--> [User Authentication]

[Responsive Layout] --independent-- (CSS/UI concern, no API dependency)
[Dark/Light Theme] --independent-- (CSS/UI concern, no API dependency)
[Empty State / Welcome Screen] --independent-- (static UI, no data dependency)
[Skeleton Loading States] --enhances--> [Chat CRUD] and [Message History]
[Error Toasts] --enhances--> all API interactions
```

### Dependency Notes

- **Auth before Chat CRUD:** Chats belong to users; ownership validation requires auth context. Anonymous trial is the exception -- it uses fingerprint-based tracking independently of auth.
- **Message History before Streaming:** Must have a place to persist messages before streaming tokens into the UI and saving the completed response.
- **Streaming before Stop Generation:** Cannot stop what isn't streaming; stop button only makes sense with SSE implementation.
- **Markdown rendering before Copy Code:** Copy code button is overlaid on rendered code blocks; raw markdown has no code blocks to copy from.
- **Chat CRUD before Realtime Sync:** Must have chat operations to synchronize; Realtime broadcasts changes to chat list.
- **TanStack Query enhances everything:** Optimistic updates wrap existing API calls; adding TanStack Query last is wrong -- it should be the data-fetching layer from the start.

## MVP Definition

### Launch With (v1) -- The Assignment Deliverable

Minimum set to score well on all evaluation criteria (architecture, API design, DB design, UI/UX, code quality).

- [x] **User authentication (email/password)** -- gates all user-specific features; shows security awareness
- [x] **Chat CRUD (create, rename, delete)** -- demonstrates REST API design with proper HTTP verbs and status codes
- [x] **Chat sidebar with history** -- primary navigation; shows UI/UX competence
- [x] **Message persistence in PostgreSQL** -- demonstrates DB design (schema, indexes, relations)
- [x] **SSE streaming with real-time token display** -- the core chatbot experience; shows technical depth
- [x] **Markdown rendering + syntax highlighting** -- shows UI polish; evaluators will paste code prompts
- [x] **Copy code button** -- tiny effort, high perceived quality
- [x] **Auto-generated chat titles** -- shows LLM integration beyond basic chat
- [x] **Auto-resizing textarea with Enter/Shift+Enter** -- basic input UX
- [x] **Empty state with suggested prompts** -- shows UX thinking; prevents blank-screen syndrome
- [x] **Loading skeletons + error toasts** -- shows state management maturity
- [x] **Dark/light theme** -- evaluators may have theme preferences
- [x] **Responsive layout (mobile sidebar as Sheet)** -- shows responsive design skill
- [x] **Scroll-to-bottom button** -- essential during streaming
- [x] **Stop generation button** -- streaming control
- [x] **Anonymous trial (3 free questions)** -- demonstrates conversion funnel and server-side validation
- [x] **Image attachment with vision API** -- demonstrates multimodal and file handling
- [x] **Document upload (PDF/DOCX) with text extraction** -- demonstrates file processing pipeline
- [x] **Multi-tab sync via Supabase Realtime** -- demonstrates real-time architecture
- [x] **TanStack Query with optimistic updates** -- demonstrates advanced client-side data management

### Add After Validation (v1.x) -- If Time Permits

- [ ] **Keyboard shortcut hints** -- tooltip showing Ctrl+Enter, etc.
- [ ] **Copy full message button** -- hover action on assistant messages
- [ ] **Chat title inline editing** -- click-to-edit in sidebar (if not in v1)
- [ ] **Typing animation on first token** -- subtle polish for streaming start
- [ ] **Message timestamps** -- hover to see when a message was sent

### Future Consideration (v2+) -- Out of Scope for Assignment

- [ ] **Message editing and regeneration** -- explicitly out of scope per spec
- [ ] **Multi-model selection** -- only OpenAI for v1; adapter pattern in code suffices
- [ ] **Full-text search across chats** -- power user feature, not demo-critical
- [ ] **System prompt customization** -- scope creep for this assignment
- [ ] **Export/share conversations** -- low evaluator impact

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Evaluator Impact | Priority |
|---------|------------|---------------------|------------------|----------|
| Strict layered architecture (DB/API/Client) | LOW (invisible to users) | MEDIUM | **CRITICAL** (primary eval criterion) | P0 |
| RESTful API with proper verbs/status codes | LOW (invisible to users) | LOW | **CRITICAL** (API design eval) | P0 |
| Chat CRUD + message persistence | HIGH | MEDIUM | HIGH (DB design eval) | P1 |
| SSE streaming responses | HIGH | HIGH | HIGH (technical depth) | P1 |
| User authentication | HIGH | MEDIUM | MEDIUM | P1 |
| Markdown + code syntax highlighting | HIGH | LOW | HIGH (UI/UX eval) | P1 |
| Chat sidebar with history | HIGH | MEDIUM | HIGH (UI/UX eval) | P1 |
| Responsive layout | MEDIUM | MEDIUM | HIGH (UI/UX eval) | P1 |
| Empty state + suggested prompts | MEDIUM | LOW | HIGH (UX thinking) | P1 |
| Loading skeletons + error toasts | MEDIUM | LOW | HIGH (state management maturity) | P1 |
| Dark/light theme | MEDIUM | LOW | MEDIUM | P1 |
| Auto-generated chat titles | MEDIUM | LOW | MEDIUM (LLM integration) | P1 |
| TanStack Query + optimistic updates | LOW (invisible to users) | MEDIUM | HIGH (code quality eval) | P1 |
| Image attachment + vision | MEDIUM | MEDIUM | MEDIUM (multimodal) | P2 |
| Document upload + text extraction | MEDIUM | HIGH | MEDIUM (file pipeline) | P2 |
| Anonymous trial (3 free questions) | LOW | MEDIUM | MEDIUM (conversion funnel) | P2 |
| Multi-tab sync (Supabase Realtime) | LOW | MEDIUM | MEDIUM (real-time architecture) | P2 |
| Stop generation button | MEDIUM | LOW | LOW | P2 |
| Copy code button | MEDIUM | LOW | LOW (but high polish signal) | P2 |
| Scroll-to-bottom button | MEDIUM | LOW | LOW | P2 |

**Priority key:**
- P0: Architecture and API design -- the assignment's primary evaluation criterion. Build first, build right.
- P1: Must have for launch. Core features that demonstrate competence across all eval criteria.
- P2: Should have. Features that add polish and demonstrate breadth. Implement after P0 and P1 are solid.
- P3: Nice to have, future consideration.

## Competitor Feature Analysis

| Feature | ChatGPT | Claude | Gemini | Our Approach |
|---------|---------|--------|--------|--------------|
| Chat history sidebar | Yes, with folders and search | Yes, with Projects | Yes, with pinned chats | Sidebar with chat list, create/rename/delete. No folders or search (anti-feature for scope). |
| Streaming responses | SSE, token-by-token | SSE, token-by-token | SSE, token-by-token | SSE streaming via Vercel AI SDK. Match the standard pattern. |
| Markdown rendering | Full markdown + LaTeX | Full markdown + Artifacts | Full markdown + canvas | Full markdown with syntax highlighting. No LaTeX (scope). |
| Code blocks | Syntax highlighting + copy | Syntax highlighting + copy + run (Artifacts) | Syntax highlighting + copy | Syntax highlighting + copy button. No execution (anti-feature). |
| File upload | Images, PDFs, code files | Images, PDFs, large docs | Images, PDFs, Drive files | Images (paste/upload) + PDF/DOCX with text extraction. |
| Voice input | Advanced Voice mode | Not available | Voice input | Omit -- not in spec, doesn't show architecture skill. |
| Model selection | GPT-4o, GPT-4o-mini, o1 | Sonnet, Opus, Haiku | Pro, Flash, Ultra | Single model (gpt-4o-mini). Adapter pattern in code for extensibility. |
| Memory across chats | Yes, persistent memory | Yes, via Projects | Yes, via Gems | No cross-chat memory. Per-chat context only (correct for scope). |
| Custom instructions | System prompt customization | Projects with custom knowledge | Gems | Hardcoded system prompt. No UI for customization. |
| Anonymous access | Limited free tier (no auth required) | Requires sign-up | Requires Google account | 3 free questions by fingerprint, then registration wall. |
| Theme | Dark only (recently added light) | Light/dark | Light/dark | Dark/light toggle. |
| Empty state | Suggested prompts grid | "How can I help?" + suggestions | Suggested prompts cards | Welcome message + 3-4 suggested prompt cards. |
| Real-time sync | Not prominent | Not prominent | Cross-device via Google account | Multi-tab sync via Supabase Realtime. Subtle but demonstrates capability. |

## Sources

- [Best AI Chatbots 2026 - AITrove](https://www.aitrove.ai/blog/best-ai-chatbots-2026.html) -- Feature comparison across ChatGPT, Claude, Gemini, Perplexity
- [ChatGPT vs Gemini vs Claude 2026 - DataStudios](https://www.datastudios.org/post/chatgpt-vs-gemini-vs-claude-full-2026-comparison-complete-analysis-features-pricing-workflow-imp)
- [Claude vs ChatGPT vs Gemini - Improvado](https://improvado.io/blog/claude-vs-chatgpt-vs-gemini-vs-deepseek)
- [AI Chatbot UX Best Practices 2026 - LetsGroTo](https://www.letsgroto.com/blog/ux-best-practices-for-ai-chatbots)
- [UX Best Practices for AI Chatbots - MindTheProduct](https://www.mindtheproduct.com/deep-dive-ux-best-practices-for-ai-chatbots/)
- [ChatGPT Clone UI - assistant-ui](https://www.assistant-ui.com/examples/chatgpt)
- [ChatGPT-Clone (doomsday4) - GitHub](https://github.com/doomsday4/ChatGPT-Clone) -- Feature reference for clone implementations
- [gptClone (sachinandan-05) - GitHub](https://github.com/sachinandan-05/gptClone) -- Pixel-perfect ChatGPT clone reference
- [Empty State UX - Mobbin](https://mobbin.com/glossary/empty-state)
- [Chatbot Design Challenges 2026 - Jotform](https://www.jotform.com/ai/agents/chatbot-design/)
- [Features ChatGPT Needs 2026 - SlashGear](https://www.slashgear.com/2087490/features-chatgpt-needs-in-2026/)
- [DuckDuckGo AI Chat](https://www.spreadprivacy.com/ai-chat/) -- Anonymous access pattern reference

---
*Feature research for: ChatGPT-like chatbot web application*
*Researched: 2026-03-27*
