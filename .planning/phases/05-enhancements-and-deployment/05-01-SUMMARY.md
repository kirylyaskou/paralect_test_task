---
phase: 05-enhancements-and-deployment
plan: 01
subsystem: api, ui
tags: [supabase-storage, file-upload, pdf-parse, mammoth, attachments, clipboard-paste]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: DB schema (documents table), Supabase client, error types
  - phase: 02-auth
    provides: requireAuth helper for protected upload routes
  - phase: 04-streaming-and-core-chat-experience
    provides: ChatInput component, ChatView, message display components
provides:
  - Upload API routes (signed URL creation, document text extraction)
  - Public Supabase client for client-side Storage uploads
  - Attachment UI components (ImageThumbnail, FileChip, AttachmentPreview)
  - Message display components for images and documents (MessageImages, MessageDocuments)
  - Extended ChatInput with paperclip attach, clipboard paste, file validation
  - Exported Attachment type for downstream use
affects: [05-03-PLAN (wiring attachments into chat streaming flow)]

# Tech tracking
tech-stack:
  added: [pdf-parse@2.4.5, mammoth@1.12.0]
  patterns: [signed-url-upload, server-side-text-extraction, client-side-file-validation]

key-files:
  created:
    - lib/supabase/public-client.ts
    - app/api/upload/route.ts
    - app/api/upload/complete/route.ts
    - components/chat/image-thumbnail.tsx
    - components/chat/file-chip.tsx
    - components/chat/attachment-preview.tsx
    - components/chat/message-images.tsx
    - components/chat/message-documents.tsx
  modified:
    - next.config.ts
    - package.json
    - components/chat/chat-input.tsx
    - components/chat/chat-view.tsx

key-decisions:
  - "pdf-parse v2 PDFParse class API with getText() for PDF text extraction"
  - "Signed URL upload pattern avoids Vercel 4.5MB body limit"
  - "Text extraction truncated to 4000 chars to keep LLM context manageable"
  - "Graceful extraction failure: document saved without text, warning returned"

patterns-established:
  - "Signed URL upload: client gets URL from /api/upload, uploads directly to Storage, then calls /api/upload/complete"
  - "Attachment type exported from chat-input for reuse across components"
  - "File validation at client side with toast error feedback"

requirements-completed: [IMG-01, IMG-02, IMG-03, DOC-01, DOC-03]

# Metrics
duration: 5min
completed: 2026-03-29
---

# Phase 5 Plan 1: File Attachments Summary

**Upload API with signed URLs and PDF/DOCX text extraction, plus full attachment UI with paperclip button, clipboard paste, and inline preview bar**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-29T20:32:13Z
- **Completed:** 2026-03-29T20:37:13Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Upload API routes with signed URL creation (bypasses Vercel body limits) and server-side document text extraction (PDF via pdf-parse, DOCX via mammoth)
- Five new UI components: ImageThumbnail, FileChip, AttachmentPreview, MessageImages, MessageDocuments
- ChatInput extended with paperclip attach button, clipboard paste handler, 10MB client-side validation, and inline attachment preview bar

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies, create public Supabase client, and build upload API routes** - `bba961a` (feat)
2. **Task 2: Build attachment UI components and extend chat input** - `9b19aed` (feat)

## Files Created/Modified
- `lib/supabase/public-client.ts` - Client-side Supabase client with anon key for Storage uploads
- `app/api/upload/route.ts` - POST endpoint returning signed upload URL from Supabase Storage
- `app/api/upload/complete/route.ts` - POST endpoint for post-upload: PDF/DOCX text extraction, DB record creation
- `components/chat/image-thumbnail.tsx` - 64px square image preview with X remove overlay
- `components/chat/file-chip.tsx` - Pill-shaped document chip with icon, filename, size, optional remove/download
- `components/chat/attachment-preview.tsx` - Horizontal bar above input showing staged attachments
- `components/chat/message-images.tsx` - Image grid rendered inside sent messages
- `components/chat/message-documents.tsx` - Document chips rendered inside sent messages
- `components/chat/chat-input.tsx` - Extended with Paperclip button, paste handler, file validation, preview bar
- `components/chat/chat-view.tsx` - Updated handleSend signature to accept attachments
- `next.config.ts` - Added pdf-parse to serverExternalPackages
- `package.json` - Added pdf-parse and mammoth dependencies

## Decisions Made
- Used pdf-parse v2 PDFParse class API (not legacy default export) for proper ESM support and cleanup
- Signed URL upload pattern: server creates URL with service_role, client uploads directly to Storage
- Text extraction truncated to 4000 chars to keep LLM context manageable in downstream usage
- Extraction failures handled gracefully: document still saved, warning returned to client
- Did not install @fingerprintjs/fingerprintjs (only needed for plan 05-02 anonymous access)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Updated ChatView handleSend signature**
- **Found during:** Task 2 (chat-input extension)
- **Issue:** ChatInput.onSend changed from `(text: string) => void` to `(text: string, attachments: Attachment[]) => void`, which would break ChatView
- **Fix:** Updated ChatView.handleSend to accept optional attachments parameter, imported Attachment type
- **Files modified:** components/chat/chat-view.tsx
- **Verification:** TypeScript compilation passes
- **Committed in:** 9b19aed (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Essential for type compatibility. No scope creep.

## Issues Encountered
- Build fails on pre-existing `/_global-error` page (unrelated to our code, documented in project memory). TypeScript compilation and Turbopack compilation both succeed. All our routes and components compile without issues.

## User Setup Required

**External services require manual configuration:**
- Create 'attachments' storage bucket in Supabase Dashboard (Storage -> New Bucket -> name: attachments, public: true)
- Or run SQL: `INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', true);`

## Next Phase Readiness
- All attachment UI building blocks ready for plan 05-03 to wire into chat streaming flow
- Upload API routes ready to be called from client-side upload logic
- MessageImages and MessageDocuments ready to be integrated into MessageItem

---
## Self-Check: PASSED

All 8 created files verified present. Both task commits (bba961a, 9b19aed) verified in git log.

---
*Phase: 05-enhancements-and-deployment*
*Completed: 2026-03-29*
