---
phase: 1
slug: foundation-and-architecture-skeleton
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-28
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None (greenfield) — build-time checks are primary validation |
| **Config file** | none — no test framework in Phase 1 |
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
| 01-01-01 | 01 | 1 | ARCH-01 | build/compile | `pnpm build` | N/A — build system | ⬜ pending |
| 01-01-02 | 01 | 1 | ARCH-02 | build/compile | `pnpm build` | N/A — build system | ⬜ pending |
| 01-01-03 | 01 | 1 | ARCH-03 | build/compile | `pnpm build` | N/A — build system | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- No additional test framework needed for Phase 1
- `pnpm build` (TypeScript compilation + Next.js build) catches `server-only` violations at compile time
- `pnpm lint` validates ESLint rules

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| All 5 tables exist in Supabase | ARCH-01 | Remote DB verification | Check Supabase dashboard Table Editor for users, chats, messages, documents, anonymous_usage |
| service_role key only in client.ts | ARCH-03 | Structural review | `grep -r SUPABASE_SERVICE_ROLE_KEY lib/` should only match `lib/db/client.ts` |
| server-only in every lib/db/ file | ARCH-01, ARCH-02 | Structural review | `grep -l "import 'server-only'" lib/db/*.ts` should list all files |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
