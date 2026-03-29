# Phase 5: Enhancements and Deployment - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-29
**Phase:** 05-enhancements-and-deployment
**Areas discussed:** File attachment UX, Document text extraction, Anonymous access flow, Multi-tab sync scope

---

## File Attachment UX

### Image Input Method

| Option | Description | Selected |
|--------|-------------|----------|
| Paste + button | Clipboard paste (Ctrl+V) AND upload button icon in chat input bar. Covers both power users and discoverable UI. | ✓ |
| Paste + drag-drop + button | All three methods: clipboard, drag files, and button. Maximum flexibility but more work. | |
| Button only | Simple paperclip/attach button only. No paste or drag-drop. Simplest to build. | |

**User's choice:** Paste + button
**Notes:** None

### Image Preview

| Option | Description | Selected |
|--------|-------------|----------|
| Inline thumbnail | Small thumbnail above the input bar with X to remove. ChatGPT-style. | ✓ |
| Badge/chip indicator | Small chip showing '1 image attached' with X to remove. No visual preview. | |
| Modal preview | Full-size preview in a dialog before sending. | |

**User's choice:** Inline thumbnail
**Notes:** None

### Attach Button Design

| Option | Description | Selected |
|--------|-------------|----------|
| Single button | One paperclip/attach button accepting images + PDFs + DOCX. File type determines handling. | ✓ |
| Separate buttons | Distinct image icon and document icon buttons. Clearer intent but more clutter. | |
| Button with dropdown | One button with menu: 'Image' or 'Document'. Explicit but adds a click. | |

**User's choice:** Single button
**Notes:** None

### File Size Limit

| Option | Description | Selected |
|--------|-------------|----------|
| 10 MB per file | Reasonable for images and documents. Matches common limits. | ✓ |
| 5 MB per file | More conservative. May reject high-res photos or large PDFs. | |
| 25 MB per file | Generous but increases storage costs and upload time. | |

**User's choice:** 10 MB per file
**Notes:** None

---

## Document Text Extraction

### Extraction Location

| Option | Description | Selected |
|--------|-------------|----------|
| Server-side in API route | Extract text in upload API route. pdf-parse for PDF, mammoth for DOCX. | ✓ |
| Edge function / background | Upload to Storage first, extract async via edge function. | |

**User's choice:** Server-side in API route
**Notes:** None

### LLM Context Injection

| Option | Description | Selected |
|--------|-------------|----------|
| System prompt injection | Prepend extracted text to system prompt. Truncate to ~4000 chars. Simple. | ✓ |
| Separate user message | Insert extracted text as hidden user message in conversation. | |
| RAG-style chunking | Split into chunks, embed, retrieve relevant chunks. Overkill for demo. | |

**User's choice:** System prompt injection
**Notes:** None

### Document Display in Chat

| Option | Description | Selected |
|--------|-------------|----------|
| File chip with icon | Small chip showing document icon + filename below user message. Clickable to download. | ✓ |
| Expandable card | Card showing filename + first ~200 chars, expandable to see full text. | |
| Just filename text | Plain text '[Attached: report.pdf]' in message. | |

**User's choice:** File chip with icon
**Notes:** None

---

## Anonymous Access Flow

### Fingerprinting Approach

| Option | Description | Selected |
|--------|-------------|----------|
| FingerprintJS free tier | @fingerprintjs/fingerprintjs library. Stable fingerprint from canvas, fonts, etc. ~60% accuracy. | ✓ |
| Custom hash | Simple hash from userAgent + screen + timezone. Less accurate, zero dependencies. | |
| Cookie-based fallback | UUID in cookie, combined with user-agent hash. Simpler but easily cleared. | |

**User's choice:** FingerprintJS free tier
**Notes:** None

### Limit Reached UX

| Option | Description | Selected |
|--------|-------------|----------|
| Modal dialog | Full-screen centered dialog with Sign Up and Log In buttons. Blocks further input. | ✓ |
| Inline banner + disabled input | Banner above chat input, input disabled with placeholder text. | |
| Redirect to signup | Auto-redirect to /signup with flash message. Loses chat context. | |

**User's choice:** Modal dialog
**Notes:** None

### Chat Continuity After Signup

| Option | Description | Selected |
|--------|-------------|----------|
| No continuity | Anonymous chats not linked to new accounts. Clean separation. | ✓ |
| Migrate on signup | Link anonymous chat to new user account. Better UX but more complex. | |

**User's choice:** No continuity
**Notes:** None

---

## Multi-Tab Sync Scope

### Realtime Approach

| Option | Description | Selected |
|--------|-------------|----------|
| postgres_changes | Subscribe to INSERT/DELETE on chats table filtered by user_id. Uses anon key public client. | ✓ |
| Broadcast channel | Manual pub/sub via Supabase Broadcast. More control but manual wiring. | |

**User's choice:** postgres_changes
**Notes:** None

### Sync Entities

| Option | Description | Selected |
|--------|-------------|----------|
| Chat list only | Sync creates and deletes across tabs. Matches SYNC-01 requirement scope. | ✓ |
| Chat list + title updates | Also sync auto-generated titles. Slightly more complete. | |
| Chat list + messages | Full sync including messages. Overkill for single-chat view. | |

**User's choice:** Chat list only
**Notes:** None

### Client Reaction to Events

| Option | Description | Selected |
|--------|-------------|----------|
| Query invalidation | invalidateQueries(['chats']) on Realtime event. Leverages existing hooks. | ✓ |
| Direct cache update | Parse payload, update cache with setQueryData. Faster but more brittle. | |

**User's choice:** Query invalidation
**Notes:** None

---

## Claude's Discretion

- Exact paperclip/attach icon design and positioning
- FingerprintJS configuration options
- Supabase Realtime channel naming
- Document text truncation strategy
- Vercel deployment configuration
- README formatting and architecture diagram style
- Anonymous chat storage strategy

## Deferred Ideas

- Chat rename/title editing — v2
- Message regeneration — v2
- Stop generation button — v2
- Multiple LLM providers — v2
- Rate limiting — v2
- Search across chats — out of scope
