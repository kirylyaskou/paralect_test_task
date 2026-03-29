---
phase: 4
slug: streaming-and-core-chat-experience
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-29
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual verification + build check |
| **Config file** | none — no test framework installed |
| **Quick run command** | `pnpm build 2>&1 | tail -5` |
| **Full suite command** | `pnpm build && echo "BUILD OK"` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm build 2>&1 | tail -5`
- **After every plan wave:** Run `pnpm build && echo "BUILD OK"`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | MSG-01 | build | `pnpm build` | N/A | pending |
| 04-01-02 | 01 | 1 | MSG-02 | build | `pnpm build` | N/A | pending |
| 04-01-03 | 01 | 1 | MSG-03 | build | `pnpm build` | N/A | pending |
| 04-02-01 | 02 | 1 | MSG-04, UX-02 | manual | browser test | N/A | pending |
| 04-02-02 | 02 | 1 | UX-03 | manual | browser test | N/A | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test framework installation needed — this phase is validated through build checks and manual browser testing of streaming behavior.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| SSE token streaming | MSG-01 | Requires browser to observe real-time token display | Send message, verify tokens appear incrementally |
| Markdown rendering during stream | MSG-02 | Visual verification of markdown + code highlighting | Send message with code block, verify syntax highlighting |
| Chat history loads on page open | MSG-03 | Requires browser navigation | Open existing chat, verify all previous messages display |
| Auto-generated title | MSG-04 | Requires LLM call + sidebar update | Send first message in new chat, verify title updates in sidebar |
| Welcome screen prompts | UX-02 | Visual verification of prompt grid | Open new chat, verify 4 prompts in 2x2 grid, click one |
| Error toast on API failure | UX-03 | Requires simulating API failure | Disconnect network, send message, verify error toast + retry |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
