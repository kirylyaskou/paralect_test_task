# Phase 5: Enhancements and Deployment - Research

**Researched:** 2026-03-29
**Domain:** File attachments (images + documents), anonymous access, multi-tab sync, Vercel deployment
**Confidence:** HIGH

## Summary

Phase 5 adds four feature clusters to the existing Next.js 16 + Supabase chatbot: (1) file attachments -- images via clipboard paste/upload with vision API analysis, and PDF/DOCX document upload with server-side text extraction; (2) anonymous trial access with browser fingerprinting and a 3-question limit; (3) multi-tab chat list synchronization via Supabase Realtime postgres_changes; and (4) Vercel deployment with documentation.

The existing codebase already has DB layer functions (`lib/db/documents.ts`, `lib/db/anonymous.ts`, `lib/db/messages.ts` with `image_urls` support), Supabase types for all tables, and the `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` env vars pre-configured. AI SDK v6's `useChat` supports multimodal messages via `parts` arrays with `file` type entries. The main technical risks are: (a) Vercel's 4.5MB serverless function body size limit vs the 10MB file upload requirement, which requires a two-step signed-URL upload pattern; (b) `pdf-parse` v2's API is class-based and differs significantly from v1 training data; and (c) Supabase Realtime's inability to filter DELETE events by column value, requiring client-side filtering.

**Primary recommendation:** Use a two-step upload flow: client sends file metadata to a server API route that creates a signed upload URL via Supabase Storage, then the client uploads directly to Storage using that URL, bypassing the Vercel body size limit entirely. For vision, send image URLs (not base64) as `file` parts in AI SDK v6 messages.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Image input via clipboard paste (Ctrl+V) AND upload button in chat input bar
- **D-02:** Inline thumbnail preview above the input bar with X to remove
- **D-03:** Single attach button (paperclip icon) that opens file picker accepting images + PDFs + DOCX
- **D-04:** 10 MB per file size limit -- validated both client-side and server-side
- **D-05:** Server-side extraction in the upload API route -- pdf-parse for PDF, mammoth for DOCX
- **D-06:** Extracted text injected as system prompt context -- prepend "Document context: ..." truncate to ~4000 chars
- **D-07:** Attached documents displayed as file chip with icon below user message -- clickable to download from Supabase Storage
- **D-08:** Browser fingerprinting via FingerprintJS free tier (@fingerprintjs/fingerprintjs)
- **D-09:** When 3-question limit reached, show modal dialog with Sign Up and Log In buttons, blocks further input
- **D-10:** No chat continuity after signup -- anonymous chats not linked to new accounts
- **D-11:** Anonymous users use same streaming chat API but with fingerprint-based tracking instead of userId
- **D-12:** Supabase Realtime postgres_changes -- subscribe to INSERT/DELETE on chats table filtered by user_id
- **D-13:** Sync chat list only -- creates and deletes across tabs
- **D-14:** On Realtime event, trigger TanStack Query invalidation -- queryClient.invalidateQueries(['chats'])
- **D-15:** Deploy to Vercel
- **D-16:** README with setup instructions, architecture diagram, and deploy link
- **D-17:** Loom demo video (2-5 minutes) -- user records separately, link added to README

### Claude's Discretion
- Exact paperclip/attach icon design and positioning in input bar
- FingerprintJS configuration options (which signals to include)
- Supabase Realtime channel naming and subscription setup details
- Document text truncation strategy (first N chars vs smart truncation)
- Vercel configuration details (build settings, rewrites)
- README formatting and architecture diagram style
- Anonymous chat storage strategy (ephemeral vs persisted without user_id)

### Deferred Ideas (OUT OF SCOPE)
- Chat rename/title editing (CHAT-06)
- Message regeneration (MSG-07)
- Stop generation button (MSG-05)
- Multiple LLM providers (PROV-01, PROV-02)
- Rate limiting (SEC-01)
- Search across chats
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| IMG-01 | User can paste image from clipboard into chat input | AI SDK v6 `sendMessage` with `file` parts, clipboard paste event API, FileReader for data URL conversion |
| IMG-02 | User can upload image file via button | Hidden file input with accept="image/*,.pdf,.docx", Supabase Storage signed upload URL pattern |
| IMG-03 | Image preview shown before sending | Client-side File/Blob URL.createObjectURL() for instant preview, AttachmentPreview component |
| IMG-04 | Images sent to OpenAI vision API for analysis | AI SDK v6 `file` parts with `url` property, OpenRouter free vision model (meta-llama/llama-3.2-11b-vision-instruct:free), `convertToModelMessages` handles image parts automatically |
| DOC-01 | User can upload PDF/DOCX documents to a chat | Same attach button + file picker, pdf-parse v2 (PDFParse class) for PDF, mammoth.extractRawText for DOCX, server-side extraction |
| DOC-02 | Extracted text is injected as context in LLM system prompt | Prepend document context to system prompt in chat route, truncate to ~4000 chars |
| DOC-03 | Attached documents are listed/indicated in the chat | FileChip component in message-item, documents table already has file_url for download link |
| ANON-01 | Unauthenticated user can ask up to 3 questions | FingerprintJS v5 client-side, anonymous_usage table already exists, new anonymous chat API route |
| ANON-02 | Question count tracked server-side via fingerprint | getAnonymousUsage/incrementAnonymousUsage already built in lib/db/anonymous.ts |
| ANON-03 | Registration prompt shown when limit reached | AnonymousLimitDialog component (shadcn Dialog, non-dismissible), 403 response triggers it |
| SYNC-01 | Chat list updates in real-time across browser tabs via Supabase Realtime | Supabase Realtime postgres_changes on chats table, public anon client, TanStack Query invalidation |
| DEPL-01 | Application deployed to Vercel | Vercel CLI or git-based deployment, env vars in dashboard |
| DEPL-02 | README with setup instructions, architecture diagram, and deploy link | Mermaid or text-based architecture diagram |
| DEPL-03 | Loom demo video (2-5 minutes) | User records separately, placeholder link in README |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **AGENTS.md directive:** "This is NOT the Next.js you know" -- read `node_modules/next/dist/docs/` before writing code. Heed deprecation notices.
- **Context management:** Commit WIP and /clear on high context. State is in the filesystem.
- **Architecture:** Strict 3-layer separation (DB -> API -> Client). Zero DB calls from components. service_role key server-only.
- **Public client exception:** Supabase public client (anon key) allowed ONLY for Realtime.
- **Package manager:** pnpm
- **LLM provider:** OpenRouter with `@openrouter/ai-sdk-provider`, not raw OpenAI SDK
- **Next.js version:** 16.2.1 -- params are Promises, use proxy.ts not middleware.ts
- **AI SDK:** v6 -- useChat uses sendMessage({text}), parts[] arrays, toUIMessageStreamResponse
- **shadcn:** v4 -- render props (not asChild)

## Standard Stack

### Core (already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.2.1 | App framework | Already in project |
| @supabase/supabase-js | 2.100.1 | Supabase client (storage, realtime) | Already in project |
| ai | 6.0.141 | AI SDK core (streamText, convertToModelMessages) | Already in project |
| @ai-sdk/react | 3.0.143 | useChat hook with sendMessage | Already in project |
| @openrouter/ai-sdk-provider | 2.3.3 | OpenRouter LLM provider | Already in project |

### New Dependencies (to install)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @fingerprintjs/fingerprintjs | 5.1.0 | Browser fingerprint generation (free, open-source, MIT) | Anonymous access tracking (ANON-01, ANON-02) |
| pdf-parse | 2.4.5 | Server-side PDF text extraction (TypeScript, serverless-compatible) | Document upload (DOC-01, DOC-02) |
| mammoth | 1.12.0 | DOCX to text extraction (Node.js buffer input) | Document upload (DOC-01, DOC-02) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| pdf-parse v2 | pdf.js-extract | pdf-parse v2 is purpose-built for serverless (Vercel), has TypeScript types built in |
| mammoth | docx-parser | mammoth is battle-tested (26k+ GitHub stars), has dedicated extractRawText() method |
| FingerprintJS free | Random UUID per session | FingerprintJS survives incognito/data clear (40-60% accuracy), UUID resets every session |
| Supabase Realtime postgres_changes | BroadcastChannel API | BroadcastChannel is same-origin same-browser only, Realtime works across devices |

**Installation:**
```bash
pnpm add @fingerprintjs/fingerprintjs pdf-parse mammoth
```

**Version verification:** All versions confirmed via `npm view` on 2026-03-29.

## Architecture Patterns

### Recommended Project Structure (new/modified files only)
```
app/
  api/
    chat/
      route.ts                    # MODIFY: add image parts + document context to streamText
    anonymous/
      chat/
        route.ts                  # NEW: anonymous streaming chat endpoint (fingerprint-based)
    upload/
      route.ts                    # NEW: file upload -> signed URL + server-side extraction
  (main)/
    layout.tsx                    # MODIFY: add RealtimeProvider wrapper
    page.tsx                      # MODIFY: support anonymous access (no auth redirect)
  (anonymous)/                    # NEW: route group for anonymous access
    layout.tsx                    # NEW: anonymous layout (no sidebar, minimal chrome)
    page.tsx                      # NEW: anonymous home page with chat input
components/
  chat/
    chat-input.tsx                # MODIFY: add attach button, paste handler, preview state
    attachment-preview.tsx        # NEW: horizontal bar showing staged files
    image-thumbnail.tsx           # NEW: 64px preview with X remove
    file-chip.tsx                 # NEW: document indicator (icon + name + size)
    message-item.tsx              # MODIFY: render images and document chips
    message-images.tsx            # NEW: image grid in sent messages
    message-documents.tsx         # NEW: document chips in sent messages
  auth/
    anonymous-limit-dialog.tsx    # NEW: non-dismissible modal for limit reached
hooks/
  use-anonymous-usage.ts          # NEW: fingerprint + question count + limit check
  use-realtime-chats.ts           # NEW: Supabase Realtime subscription + TanStack invalidation
lib/
  supabase/
    public-client.ts              # NEW: public Supabase client (anon key) for Realtime + Storage
```

### Pattern 1: Two-Step Signed URL Upload (Critical)

**What:** Client requests a signed upload URL from server, then uploads directly to Supabase Storage, bypassing the Vercel 4.5MB body limit.

**When to use:** All file uploads (images, PDFs, DOCX) -- required because Vercel serverless functions have a hard 4.5MB request body limit, but the project requires 10MB file uploads.

**Flow:**
```
Client                         Server API                    Supabase Storage
  |                               |                               |
  |-- POST /api/upload           |                               |
  |   {filename, contentType,    |                               |
  |    size, chatId}             |                               |
  |                               |-- createSignedUploadUrl()  -->|
  |                               |<-- {signedUrl, token, path}  |
  |<-- {signedUrl, token, path}  |                               |
  |                               |                               |
  |-- PUT signedUrl (file body) -------------------------------->|
  |<-- 200 OK ---------------------------------------------------|
  |                               |                               |
  |-- POST /api/upload/complete  |                               |
  |   {path, chatId, type}       |                               |
  |                               |-- extract text (if doc)      |
  |                               |-- save to documents table    |
  |<-- {fileUrl, extractedText?} |                               |
```

**Example:**
```typescript
// Server: app/api/upload/route.ts
import { requireAuth } from '@/lib/auth/helpers'
import { supabase } from '@/lib/db/client'

export async function POST(req: Request) {
  const { userId } = await requireAuth()  // or fingerprint for anonymous
  const { filename, contentType, size, chatId } = await req.json()

  // Validate size server-side
  if (size > 10 * 1024 * 1024) {
    return Response.json({ error: 'File too large' }, { status: 400 })
  }

  const path = `${userId}/${chatId}/${Date.now()}-${filename}`
  const { data, error } = await supabase.storage
    .from('attachments')
    .createSignedUploadUrl(path)

  if (error) {
    return Response.json({ error: 'Failed to create upload URL' }, { status: 500 })
  }

  return Response.json({
    signedUrl: data.signedUrl,
    token: data.token,
    path,
  })
}
```

```typescript
// Client: upload directly to Supabase Storage
import { createClient } from '@supabase/supabase-js'

const publicSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function uploadFile(file: File, signedUrl: string, token: string, path: string) {
  const { error } = await publicSupabase.storage
    .from('attachments')
    .uploadToSignedUrl(path, token, file, {
      contentType: file.type,
    })
  if (error) throw error
}
```

### Pattern 2: AI SDK v6 Multimodal Messages

**What:** Send images as `file` type parts in UIMessage, which `convertToModelMessages` automatically converts to vision-compatible model messages.

**When to use:** When sending images to the LLM for vision analysis (IMG-04).

**Example:**
```typescript
// Client: sending a message with image
sendMessage({
  parts: [
    {
      type: 'file' as const,
      mediaType: 'image/png',
      url: imagePublicUrl,  // Supabase Storage public URL
    },
    { type: 'text' as const, text: userText },
  ],
})
```

```typescript
// Server: chat route already handles this via convertToModelMessages
const modelMessages = await convertToModelMessages(messages)
// convertToModelMessages automatically converts file parts to image_url parts
```

### Pattern 3: Supabase Realtime with TanStack Query Invalidation

**What:** Subscribe to postgres_changes on the `chats` table and invalidate TanStack Query cache on events.

**When to use:** Multi-tab sync (SYNC-01).

**Example:**
```typescript
// hooks/use-realtime-chats.ts
'use client'
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export function useRealtimeChats(userId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('chat-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chats',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['chats'] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chats',
          // NOTE: Cannot filter DELETE events by column -- must filter client-side
        },
        (payload) => {
          // Only invalidate if the deleted chat belonged to this user
          // DELETE payload includes old record
          if (payload.old && (payload.old as { user_id?: string }).user_id === userId) {
            queryClient.invalidateQueries({ queryKey: ['chats'] })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, queryClient])
}
```

### Pattern 4: Anonymous Access Architecture

**What:** Separate anonymous flow with fingerprint-based tracking, reusing the existing chat streaming infrastructure.

**When to use:** ANON-01 through ANON-03.

**Architecture decision -- ephemeral anonymous chats:**
- Anonymous users do NOT get persisted chats in the `chats` table (no user_id to link to).
- Anonymous messages are ephemeral -- they exist only in the client-side useChat state.
- The anonymous chat API route checks fingerprint count, streams response, increments count, but does NOT persist messages to DB.
- This simplifies the architecture: no orphaned chat records, no cleanup needed, no user_id nullable columns.

**Flow:**
```
Anonymous User                   /api/anonymous/chat              DB
  |                                    |                           |
  |-- POST {messages, fingerprint}     |                           |
  |                                    |-- getAnonymousUsage()  -->|
  |                                    |<-- {question_count: 2}    |
  |                                    |   (count < 3, allow)      |
  |                                    |-- streamText()            |
  |                                    |-- incrementAnonymousUsage() ->|
  |<-- SSE stream response             |                           |
```

**Proxy.ts modification:** The `/` home page and `/api/anonymous/*` routes must be accessible without a session cookie. Add these to the `publicRoutes` array.

### Anti-Patterns to Avoid

- **Passing file bodies through API routes on Vercel:** Vercel serverless functions have a hard 4.5MB body limit. Always use signed URLs for file uploads.
- **Base64 encoding images in messages:** Base64 adds 33% overhead. Use Supabase Storage public URLs instead.
- **Using service_role key on the client:** The public client with anon key is used for Realtime subscriptions and uploadToSignedUrl. The server uses service_role for createSignedUploadUrl and all DB operations.
- **Filtering DELETE events in Supabase Realtime:** postgres_changes cannot filter DELETE events by column value. Subscribe to all DELETEs and filter client-side using the `payload.old` record.
- **Using pdf-parse v1 API:** v2 (current: 2.4.5) uses a class-based API (`new PDFParse({data: buffer})`), not the function-based v1 API (`pdf(buffer)`).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Browser fingerprinting | Custom canvas/font hashing | @fingerprintjs/fingerprintjs | Dozens of entropy sources, cross-browser normalization, MIT license |
| PDF text extraction | Custom pdf.js wrapper | pdf-parse v2 (PDFParse class) | TypeScript, serverless-compatible, handles page joining |
| DOCX text extraction | Custom XML parser for docx | mammoth.extractRawText() | Handles complex DOCX structures, paragraphs, tables |
| Real-time subscriptions | WebSocket server or polling | Supabase Realtime postgres_changes | Already have Supabase, zero infrastructure, auto-reconnect |
| Image vision API format | Manual image_url part construction | AI SDK v6 convertToModelMessages | Automatically converts file parts to model-compatible format |
| File upload signed URLs | Custom S3-like signing | Supabase Storage createSignedUploadUrl | Integrated with existing auth, 2-hour expiry, no extra infra |

**Key insight:** Every feature in this phase builds on existing infrastructure -- Supabase (Storage, Realtime, existing tables), AI SDK v6 (multimodal parts), and TanStack Query (invalidation). The new npm packages (fingerprintjs, pdf-parse, mammoth) are single-purpose extraction tools, not frameworks.

## Common Pitfalls

### Pitfall 1: Vercel 4.5MB Body Size Limit
**What goes wrong:** File upload API route receives 413 Payload Too Large error on Vercel for files > 4.5MB.
**Why it happens:** Vercel serverless functions have a hard 4.5MB request body limit that cannot be overridden.
**How to avoid:** Use the two-step signed URL pattern. Client sends only metadata to the API route (tiny JSON body), receives a signed URL, then uploads directly to Supabase Storage.
**Warning signs:** Works locally but fails on Vercel with 413 errors.

### Pitfall 2: pdf-parse v2 API Change
**What goes wrong:** Using `pdf(buffer)` function call (v1 API) with pdf-parse 2.4.5 fails.
**Why it happens:** v2 changed to class-based API: `new PDFParse({data: buffer})` then `parser.getText()`.
**How to avoid:** Use the v2 pattern. Import `{ PDFParse }` from `pdf-parse`, create instance, call `getText()`, call `destroy()`.
**Warning signs:** "pdf is not a function" or similar errors.

### Pitfall 3: Supabase Realtime DELETE Filter Limitation
**What goes wrong:** Subscribing to DELETE events with a `filter: 'user_id=eq.X'` silently ignores the filter.
**Why it happens:** Supabase Realtime does not support filtering DELETE events by column value (documented limitation).
**How to avoid:** Subscribe to all DELETE events on the table, then filter client-side using `payload.old.user_id`.
**Warning signs:** DELETE events from other users triggering unnecessary refetches.

### Pitfall 4: Supabase Realtime Requires Publication Setup
**What goes wrong:** Subscription connects but never receives events.
**Why it happens:** The `chats` table is not added to the `supabase_realtime` publication.
**How to avoid:** Run `ALTER PUBLICATION supabase_realtime ADD TABLE chats;` in Supabase SQL editor before testing.
**Warning signs:** Channel status shows "subscribed" but no events fire on INSERT/DELETE.

### Pitfall 5: FingerprintJS Must Run Client-Side Only
**What goes wrong:** `document is not defined` error during SSR.
**Why it happens:** FingerprintJS accesses browser APIs (canvas, fonts, screen) that don't exist on the server.
**How to avoid:** Only call `FingerprintJS.load()` inside `useEffect` or event handlers in `'use client'` components.
**Warning signs:** Hydration errors or SSR crashes.

### Pitfall 6: Vision Model Selection
**What goes wrong:** Sending image parts to `meta-llama/llama-4-maverick:free` (text-only model) returns no image analysis.
**Why it happens:** Not all free models on OpenRouter support vision/multimodal input.
**How to avoid:** Use `meta-llama/llama-3.2-11b-vision-instruct:free` for messages with images, or `qwen/qwen2.5-vl-32b-instruct:free`. Fall back to the regular model for text-only messages.
**Warning signs:** Model ignores images or returns generic responses unrelated to image content.

### Pitfall 7: Anonymous Access Route Protection
**What goes wrong:** Anonymous users get redirected to /login by proxy.ts before reaching the chat.
**Why it happens:** proxy.ts checks for session cookie on all non-public routes.
**How to avoid:** Add anonymous routes (`/`, `/api/anonymous/*`) to the `publicRoutes` array in proxy.ts. Design anonymous UX as a separate route group or conditional within the existing pages.
**Warning signs:** Anonymous user always sees login page.

### Pitfall 8: Supabase Storage Bucket Not Created
**What goes wrong:** Upload fails with "Bucket not found" error.
**Why it happens:** Storage bucket must be explicitly created before uploads work.
**How to avoid:** Create the `attachments` bucket via Supabase Dashboard or SQL: `INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', true);`
**Warning signs:** 404 errors on storage operations.

## Code Examples

### pdf-parse v2 Text Extraction (Verified from npm docs + serverless guide)
```typescript
// Server-side only (in API route)
import { PDFParse } from 'pdf-parse'

async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) })
  const result = await parser.getText({ pageJoiner: '\n\n' })
  parser.destroy()
  return result?.text || ''
}
```

### mammoth DOCX Text Extraction (Verified from npm docs)
```typescript
// Server-side only (in API route)
import mammoth from 'mammoth'

async function extractDocxText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer })
  return result.value // raw text, paragraphs separated by \n\n
}
```

### FingerprintJS in React Client Component (Verified from GitHub + npm docs)
```typescript
'use client'
import { useEffect, useState } from 'react'
import FingerprintJS from '@fingerprintjs/fingerprintjs'

export function useFingerprint() {
  const [fingerprint, setFingerprint] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const fp = await FingerprintJS.load()
        const result = await fp.get()
        setFingerprint(result.visitorId)
      } catch {
        // Fallback: random UUID per session
        setFingerprint(crypto.randomUUID())
      }
    })()
  }, [])

  return fingerprint
}
```

### Supabase Public Client for Realtime (per architecture rules)
```typescript
// lib/supabase/public-client.ts
'use client'
import { createClient } from '@supabase/supabase-js'

export const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### AI SDK v6 sendMessage with Image Parts
```typescript
// In ChatView component
const handleSend = async (text: string, attachments: Attachment[]) => {
  const parts: Array<{ type: 'text'; text: string } | { type: 'file'; mediaType: string; url: string }> = []

  // Add image parts
  for (const att of attachments.filter(a => a.type === 'image')) {
    parts.push({
      type: 'file' as const,
      mediaType: att.mimeType,
      url: att.publicUrl,  // Supabase Storage public URL
    })
  }

  // Add text part
  parts.push({ type: 'text' as const, text })

  sendMessage({ parts })
}
```

### Document Context Injection in System Prompt
```typescript
// In chat API route
function buildSystemPrompt(documentTexts: string[]): string {
  const base = 'You are a helpful assistant.'
  if (documentTexts.length === 0) return base

  const combined = documentTexts.join('\n\n---\n\n')
  const truncated = combined.length > 4000
    ? combined.slice(0, 4000) + '... [truncated]'
    : combined

  return `${base}\n\nDocument context:\n${truncated}`
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| pdf-parse v1 `pdf(buffer)` | pdf-parse v2 `new PDFParse({data})` | 2024-2025 | v2 is TypeScript-native, serverless-compatible |
| AI SDK attachments prop | AI SDK v6 sendMessage with parts[] | AI SDK 6.0 | File parts are first-class in message structure |
| Supabase Realtime broadcast_changes | Still available alongside postgres_changes | 2024 | Supabase recommends broadcast for scale but postgres_changes fine for demo |
| Base64 image embedding | URL-based image references | 2024-2025 | Production apps should use Storage URLs, not inline base64 |

**Deprecated/outdated:**
- `pdf-parse` v1 function-based API -- replaced by v2 class-based API
- AI SDK `useChat` `handleSubmit` with `experimental_attachments` -- replaced by `sendMessage` with `parts`/`files`

## Open Questions

1. **Vision model selection for OpenRouter**
   - What we know: `meta-llama/llama-3.2-11b-vision-instruct:free` supports vision. `meta-llama/llama-4-maverick:free` (current chat model) may or may not support image input.
   - What's unclear: Whether Maverick supports multimodal input via OpenRouter's API (Meta documentation says Llama 4 Maverick is multimodal, but free tier availability for vision is uncertain).
   - Recommendation: Test Maverick with an image first. If it fails, conditionally route image-containing messages to `meta-llama/llama-3.2-11b-vision-instruct:free` while keeping text-only messages on Maverick.

2. **pdf-parse v2 worker configuration for Next.js**
   - What we know: pdf-parse v2 may need `import 'pdf-parse/worker'` and `next.config.ts` `serverExternalPackages` configuration for Vercel deployment.
   - What's unclear: Exact configuration needed for Next.js 16.2.1.
   - Recommendation: Add `pdf-parse` to `serverExternalPackages` in next.config.ts. Test locally first, then on Vercel.

3. **Anonymous chat storage strategy**
   - What we know: D-10 says no chat continuity after signup. Anonymous chats are temporary.
   - What's unclear: Whether to persist anonymous messages at all (for the 3-question session) or keep them purely client-side.
   - Recommendation: Keep anonymous messages purely client-side via useChat state. No DB persistence. This avoids orphaned records and simplifies cleanup. The anonymous_usage table only tracks the count.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build/runtime | Yes | 22.13.1 | -- |
| pnpm | Package management | Yes | (installed) | -- |
| Supabase remote | Storage, Realtime, DB | Yes | Remote (lycygtaidrjdojmnetoz) | -- |
| Vercel CLI | Deployment | No | -- | Deploy via git push (Vercel GitHub integration) |
| NEXT_PUBLIC_SUPABASE_URL | Realtime + Storage client | Yes | Set in .env.local | -- |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Realtime + Storage client | Yes | Set in .env.local | -- |
| OPENROUTER_API_KEY | LLM provider | Yes | Set in .env.local | -- |

**Missing dependencies with no fallback:**
- None -- all required services are available.

**Missing dependencies with fallback:**
- Vercel CLI not installed locally. Deploy via GitHub integration (push to main, Vercel auto-deploys). This is actually the recommended approach.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None installed -- no test directory or config found |
| Config file | none -- see Wave 0 |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| IMG-01 | Clipboard paste adds image to preview | manual-only | N/A (browser clipboard API) | N/A |
| IMG-02 | File picker upload works | manual-only | N/A (file input interaction) | N/A |
| IMG-03 | Preview shown before sending | manual-only | N/A (visual verification) | N/A |
| IMG-04 | Vision API analyzes image | manual-only | N/A (requires LLM response) | N/A |
| DOC-01 | PDF/DOCX upload succeeds | manual-only | N/A (file upload + extraction) | N/A |
| DOC-02 | Extracted text appears in LLM context | manual-only | N/A (requires LLM response) | N/A |
| DOC-03 | Document chips shown in chat | manual-only | N/A (visual verification) | N/A |
| ANON-01 | 3 questions without auth | manual-only | N/A (requires browser session) | N/A |
| ANON-02 | Count tracked server-side | manual-only | N/A (requires fingerprint + DB) | N/A |
| ANON-03 | Registration prompt on limit | manual-only | N/A (requires 3+ questions) | N/A |
| SYNC-01 | Chat list syncs across tabs | manual-only | N/A (requires 2 browser tabs) | N/A |
| DEPL-01 | Deployed to Vercel | manual-only | `curl -s <public-url>` returns 200 | N/A |
| DEPL-02 | README exists with required content | smoke | `test -f README.md && grep -q "architecture" README.md` | N/A |
| DEPL-03 | Loom link in README | manual-only | N/A (user records separately) | N/A |

### Sampling Rate
- **Per task commit:** `pnpm build` (ensures no TypeScript/build errors)
- **Per wave merge:** `pnpm build && pnpm lint`
- **Phase gate:** Full build + manual testing of all requirements

### Wave 0 Gaps
- No test framework installed -- all validation is manual or build-based for this phase
- Phase 5 requirements are predominantly integration/E2E behaviors that require browser interaction
- Automated unit tests would add minimal value given the integration-heavy nature of these features

## Sources

### Primary (HIGH confidence)
- npm registry -- verified package versions: @fingerprintjs/fingerprintjs@5.1.0, pdf-parse@2.4.5, mammoth@1.12.0
- [AI SDK v6 Stream Text with Image Prompt cookbook](https://ai-sdk.dev/cookbook/next/stream-text-with-image-prompt) -- multimodal message pattern
- [AI SDK v6 useChat reference](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat) -- sendMessage with parts/files
- [Supabase Realtime postgres_changes docs](https://supabase.com/docs/guides/realtime/postgres-changes) -- subscription API, filter limitations
- [Supabase Storage createSignedUploadUrl](https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl) -- signed URL pattern
- [Vercel Functions Limits](https://vercel.com/docs/functions/limitations) -- 4.5MB body size limit
- Existing codebase: lib/db/anonymous.ts, lib/db/documents.ts, lib/db/messages.ts, app/api/chat/route.ts

### Secondary (MEDIUM confidence)
- [FingerprintJS GitHub](https://github.com/fingerprintjs/fingerprintjs) -- v5 usage pattern, React integration
- [mammoth npm docs](https://www.npmjs.com/package/mammoth) -- extractRawText with buffer input
- [pdf-parse npm docs](https://www.npmjs.com/package/pdf-parse) -- v2 class-based API, serverless support
- [OpenRouter free vision models](https://openrouter.ai/collections/free-models) -- available free vision models
- [Vercel deploy guide](https://vercel.com/docs/frameworks/full-stack/nextjs) -- Next.js on Vercel configuration

### Tertiary (LOW confidence)
- [Process PDFs on Vercel guide (2026)](https://www.buildwithmatija.com/blog/process-pdfs-on-vercel-serverless-guide) -- pdf-parse v2 worker configuration for Next.js (needs validation)
- Supabase Realtime broadcast_changes as alternative to postgres_changes -- not needed for this scale but noted

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all packages verified via npm registry, existing codebase well understood
- Architecture: HIGH -- two-step upload pattern well-documented, AI SDK v6 multimodal officially documented, Supabase Realtime established pattern
- Pitfalls: HIGH -- Vercel body limit verified from official docs, pdf-parse v2 API change confirmed, Realtime DELETE filter limitation confirmed from official docs

**Research date:** 2026-03-29
**Valid until:** 2026-04-28 (30 days -- stable ecosystem, no fast-moving changes expected)
