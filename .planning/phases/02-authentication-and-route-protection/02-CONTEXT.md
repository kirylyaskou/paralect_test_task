# Phase 2: Authentication and Route Protection - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can securely create accounts with email/password, log in, log out, and access protected routes. Next.js middleware redirects unauthenticated users to login. All API endpoints validate authentication (401/403) and input (400 with Zod errors). This phase does NOT include chat UI, messaging, or anonymous access.

</domain>

<decisions>
## Implementation Decisions

### Auth page layout
- **D-01:** Separate `/login` and `/signup` pages (not a combined tabbed page)
- **D-02:** Signup form collects email + password only (display name is optional, can be set later — matches existing `signUpSchema` where `displayName` is optional)

### Claude's Discretion
- Visual style of auth pages (centered card, split layout, etc.) — pick what works best with Shadcn/ui defaults
- Email verification flow — whether to require email confirmation before access or allow immediate login after signup
- Error feedback approach — inline form errors, toasts, or combination
- Session duration and behavior — timeout, refresh strategy, expired session handling
- "Remember me" option — include or omit
- API auth helper pattern — how route handlers extract and validate the authenticated user from requests
- Middleware matcher configuration — which routes are public vs protected
- Password requirements beyond the existing 6-char minimum

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture
- `.planning/PROJECT.md` — Architecture rules: 3-layer separation, service_role server-only, no public client except Realtime
- `.planning/REQUIREMENTS.md` — AUTH-01 through AUTH-04, ARCH-04, ARCH-05 requirements for this phase

### Phase 1 Foundation
- `.planning/phases/01-foundation-and-architecture-skeleton/01-CONTEXT.md` — DB layer patterns (throw in DB, catch in API), Zod schema conventions, folder structure decisions
- `lib/db/client.ts` — Supabase service_role client (server-only, persistSession: false)
- `lib/db/users.ts` — Existing getUserById, getUserByEmail functions
- `lib/schemas/auth.ts` — Existing signUpSchema and signInSchema (Zod 4)
- `lib/errors.ts` — DatabaseError class pattern

### Roadmap
- `.planning/ROADMAP.md` — Phase 2 success criteria (5 conditions that must be TRUE)

No external specs or ADRs — requirements fully captured in PROJECT.md and decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/schemas/auth.ts` — signUpSchema (email + password + optional displayName) and signInSchema (email + password) already defined with Zod 4
- `lib/db/users.ts` — getUserById and getUserByEmail ready for auth verification
- `lib/db/client.ts` — Supabase service_role client configured with auth disabled (persistSession: false)
- `lib/errors.ts` — DatabaseError class for consistent error handling in DB layer
- `app/providers.tsx` — TanStack Query provider already set up in root layout

### Established Patterns
- `server-only` import at top of every `lib/db/` file — must continue this pattern for any new server-side auth utilities
- Throw errors in DB layer, catch in API routes — auth helpers should follow same pattern
- Direct per-module imports (no barrel files) — `import { getUserById } from '@/lib/db/users'`
- Zod 4 conventions — `z.email()` top-level function (not `z.string().email()`)

### Integration Points
- `app/(auth)/` route group needed for login/signup pages (planned in Phase 1 context but not yet created)
- `app/(main)/` route group needed for protected pages
- `middleware.ts` at project root for Next.js middleware route protection
- Supabase Auth API — signup/signin/signout via service_role client or a separate auth-specific client
- Users table trigger — auto-creates `users` row when `auth.users` row is inserted (already in DB migration)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The assignment spec prescribes Supabase Auth with email/password; this phase focuses on implementing it with correct layer separation and session management.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-authentication-and-route-protection*
*Context gathered: 2026-03-29*
