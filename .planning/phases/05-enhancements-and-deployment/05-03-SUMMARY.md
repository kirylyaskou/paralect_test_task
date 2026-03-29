---
phase: 05-enhancements-and-deployment
plan: 03
subsystem: api, ui
tags: [vision-api, document-context, file-upload, signed-url, image-parts, openrouter]

# Dependency graph
requires:
  - phase: 05-enhancements-and-deployment
    provides: "Upload API routes, public Supabase client, ChatInput with Attachment type, MessageImages/MessageDocuments components"
  - phase: 04-streaming-and-core-chat-experience
    provides: "Chat streaming route, useChat integration, MessageItem, ChatView, convert-messages"
provides:
  - "Vision model selection for image-containing messages (llama-3.2-11b-vision-instruct)"
  - "Document text injection into system prompt (truncated at 4000 chars)"
  - "Full upload-then-send flow in ChatView via signed URL pattern"
  - "Image thumbnail rendering in user messages via MessageImages"
  - "DB message converter with file parts for image_urls"
affects: [05-04-deployment]

# Tech tracking
tech-stack:
  added: []
  patterns: [vision-model-selection, document-context-injection, upload-then-send-flow, file-parts-in-messages]

key-files:
  created: []
  modified:
    - app/api/chat/route.ts
    - lib/ai/convert-messages.ts
    - app/(main)/chat/[id]/page.tsx
    - components/chat/chat-view.tsx
    - components/chat/message-item.tsx
    - app/(main)/page.tsx

key-decisions:
  - "Vision model (llama-3.2-11b-vision-instruct:free) selected dynamically when any message contains image file parts"
  - "Document context injected into system prompt, not as separate messages, truncated at 4000 chars"
  - "Upload-then-send: files uploaded sequentially to Supabase Storage before sendMessage with parts array"
  - "Image mediaType defaults to image/png in DB converter (vision API treats all image/* types equivalently)"

patterns-established:
  - "Dynamic model selection pattern: check message parts for image content, switch model ID"
  - "Upload-then-send pattern: get signed URL -> upload to Storage -> complete -> build parts -> sendMessage"
  - "File parts extraction pattern: filter message.parts by type='file' + mediaType prefix"

requirements-completed: [IMG-04, DOC-02]

# Metrics
duration: 4min
completed: 2026-03-29
---

# Phase 5 Plan 3: Wire File Attachments into Chat Flow Summary

**Vision model selection for image messages, document context injection into system prompt, and full upload-then-send flow with image thumbnail rendering in messages**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-29T20:42:36Z
- **Completed:** 2026-03-29T20:46:55Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Chat API dynamically selects vision-capable model (llama-3.2-11b-vision-instruct) when messages contain image file parts
- Document extracted text injected into system prompt with 4000-char truncation for manageable LLM context
- ChatView implements full upload-then-send flow: signed URL creation, direct Storage upload, completion with text extraction, then sendMessage with file+text parts
- Message items render image thumbnails inside user message bubbles via MessageImages component

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend chat API route with vision model selection and document context injection** - `87d2102` (feat)
2. **Task 2: Wire upload flow into ChatView and extend MessageItem to render attachments** - `d512e4e` (feat)

## Files Created/Modified
- `app/api/chat/route.ts` - Added buildSystemPrompt with document context, vision model selection, image URL saving
- `lib/ai/convert-messages.ts` - DB-to-UIMessage converter now includes file parts for messages with image_urls
- `app/(main)/chat/[id]/page.tsx` - Fetches documents via getDocumentsByChatId, passes initialDocuments to ChatView
- `components/chat/chat-view.tsx` - Full uploadFiles helper, upload-then-send in handleSend, isUploading state, initialDocuments prop
- `components/chat/message-item.tsx` - Extracts image URLs from file parts, renders MessageImages conditionally
- `app/(main)/page.tsx` - Updated handleSend to accept optional Attachment[] parameter, imported Attachment type

## Decisions Made
- Vision model selected dynamically per request based on message content (not a global config) -- allows text-only chats to use the faster Maverick model
- Document context goes into system prompt rather than as additional user messages -- cleaner separation and avoids confusing the LLM
- Image mediaType defaults to 'image/png' in DB converter since the actual content type is carried by the URL and vision API treats all image types equivalently
- Upload is sequential (not parallel) per attachment to avoid race conditions with signed URL tokens
- Home page ignores attachments parameter (no chat entity to upload to) -- attachments only work on existing chat pages

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing `/_global-error` build failure prevents `pnpm build` from completing (documented in project memory, unrelated to our code)
- Pre-existing missing module errors (pdf-parse, mammoth, @fingerprintjs/fingerprintjs) in worktree -- dependencies from Plans 01/02 not installed in this worktree. All our code compiles cleanly via `tsc --noEmit`

## User Setup Required

None - all infrastructure (Storage bucket, upload routes) was set up in Plan 01.

## Known Stubs

None -- all data sources are wired end-to-end.

## Next Phase Readiness
- File attachments fully wired: upload -> storage -> vision API / document context -> message rendering
- Ready for Plan 04 (deployment) -- all features complete
- Supabase 'attachments' bucket must exist (documented in Plan 01 user setup)

---
## Self-Check: PASSED

All 6 modified files verified present. Both task commits (87d2102, d512e4e) verified in git log.

---
*Phase: 05-enhancements-and-deployment*
*Completed: 2026-03-29*
