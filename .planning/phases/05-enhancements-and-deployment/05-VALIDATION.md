---
phase: 5
slug: enhancements-and-deployment
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-29
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — no test framework installed; validation is build-based and manual |
| **Config file** | none |
| **Quick run command** | `pnpm build` |
| **Full suite command** | `pnpm build && pnpm lint` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm build`
- **After every plan wave:** Run `pnpm build && pnpm lint`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-XX | 01 | 1 | IMG-01 | manual-only | N/A (browser clipboard API) | N/A | ⬜ pending |
| 05-01-XX | 01 | 1 | IMG-02 | manual-only | N/A (file input interaction) | N/A | ⬜ pending |
| 05-01-XX | 01 | 1 | IMG-03 | manual-only | N/A (visual verification) | N/A | ⬜ pending |
| 05-01-XX | 01 | 1 | IMG-04 | manual-only | N/A (requires LLM response) | N/A | ⬜ pending |
| 05-01-XX | 01 | 1 | DOC-01 | manual-only | N/A (file upload + extraction) | N/A | ⬜ pending |
| 05-01-XX | 01 | 1 | DOC-02 | manual-only | N/A (requires LLM response) | N/A | ⬜ pending |
| 05-01-XX | 01 | 1 | DOC-03 | manual-only | N/A (visual verification) | N/A | ⬜ pending |
| 05-02-XX | 02 | 1 | ANON-01 | manual-only | N/A (requires browser session) | N/A | ⬜ pending |
| 05-02-XX | 02 | 1 | ANON-02 | manual-only | N/A (requires fingerprint + DB) | N/A | ⬜ pending |
| 05-02-XX | 02 | 1 | ANON-03 | manual-only | N/A (requires 3+ questions) | N/A | ⬜ pending |
| 05-02-XX | 02 | 1 | SYNC-01 | manual-only | N/A (requires 2 browser tabs) | N/A | ⬜ pending |
| 05-03-XX | 03 | 2 | DEPL-01 | manual-only | `curl -s <public-url>` returns 200 | N/A | ⬜ pending |
| 05-03-XX | 03 | 2 | DEPL-02 | smoke | `test -f README.md && grep -q "architecture" README.md` | N/A | ⬜ pending |
| 05-03-XX | 03 | 2 | DEPL-03 | manual-only | N/A (user records separately) | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test framework needed — Phase 5 requirements are predominantly integration/E2E behaviors requiring browser interaction. Automated unit tests would add minimal value.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Clipboard paste adds image to preview | IMG-01 | Browser clipboard API requires user gesture | Paste image from clipboard, verify preview appears above input |
| File picker upload works | IMG-02 | File input interaction requires browser | Click attach button, select image, verify preview |
| Preview shown before sending | IMG-03 | Visual verification | Attach file, verify thumbnail/chip visible before sending |
| Vision API analyzes image | IMG-04 | Requires LLM response to image | Send image, verify AI response references image content |
| PDF/DOCX upload succeeds | DOC-01 | File upload + server extraction | Upload PDF and DOCX, verify no errors |
| Extracted text in LLM context | DOC-02 | Requires LLM response | Upload document, ask about its contents, verify AI uses text |
| Document chips in chat | DOC-03 | Visual verification | Send message with doc, verify file chip in message |
| 3 questions without auth | ANON-01 | Requires unauthenticated browser session | Open incognito, ask 3 questions, verify all get responses |
| Count tracked server-side | ANON-02 | Requires fingerprint + DB | Ask 3 questions, check DB for fingerprint record |
| Registration prompt on limit | ANON-03 | Requires 3+ questions | Ask 4th question in incognito, verify dialog appears |
| Chat list syncs across tabs | SYNC-01 | Requires 2 browser tabs | Open 2 tabs, create chat in tab 1, verify appears in tab 2 |
| Deployed to Vercel | DEPL-01 | Requires deployment | Visit public URL, verify page loads |
| Loom link in README | DEPL-03 | User records separately | Check README for Loom link after user adds it |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
