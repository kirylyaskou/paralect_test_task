---
phase: 3
slug: chat-management-and-client-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-29
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (if installed) or manual curl/fetch verification |
| **Config file** | none — Wave 0 installs if needed |
| **Quick run command** | `pnpm build` |
| **Full suite command** | `pnpm build && curl -s http://localhost:3000/api/chats -H "Cookie: session=..." | head -c 200` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm build`
- **After every plan wave:** Run `pnpm build` + manual API smoke test
- **Before `/gsd:verify-work`:** Full build must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | CHAT-01 | build | `pnpm build` | N/A | pending |
| 03-01-02 | 01 | 1 | CHAT-02 | build | `pnpm build` | N/A | pending |
| 03-01-03 | 01 | 1 | CHAT-04 | build | `pnpm build` | N/A | pending |
| 03-02-01 | 02 | 1 | UX-01, UX-04 | build | `pnpm build` | N/A | pending |
| 03-02-02 | 02 | 1 | UX-05 | build | `pnpm build` | N/A | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. Build verification (`pnpm build`) catches TypeScript errors, import violations, and missing modules.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Optimistic sidebar update | CHAT-01, CHAT-03 | Requires visual confirmation of instant UI update | Create/delete chat, observe sidebar updates before API response |
| Responsive sidebar collapse | UX-04 | Requires viewport resize | Resize browser below 768px, verify sidebar becomes Sheet |
| Dark/light theme toggle | UX-05 | Visual verification | Click theme toggle, verify colors change, refresh page to verify persistence |
| Ownership 403 | CHAT-05 | Requires two user sessions | Open chat URL from different user session, verify 403 response |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
