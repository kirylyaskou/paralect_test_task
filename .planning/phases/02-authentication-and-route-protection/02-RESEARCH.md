# Phase 2: Authentication and Route Protection - Research

**Researched:** 2026-03-29
**Domain:** Supabase Auth + Next.js 16 App Router + JWT Session Management
**Confidence:** HIGH

## Summary

This phase implements email/password authentication using Supabase Auth, with JWT-based session management via secure httpOnly cookies, and route protection via Next.js 16's new `proxy.ts` file convention (replacing the deprecated `middleware.ts`). The architecture must maintain the strict 3-layer separation: auth operations happen in API route handlers (not components), the existing service_role client handles DB operations, and a separate server-only auth client handles Supabase Auth API calls.

The critical architectural finding is that Next.js 16.2.1 has **renamed `middleware.ts` to `proxy.ts`** and the exported function is now `proxy()` instead of `middleware()`. All documentation and the CONTEXT.md reference to "middleware" must be implemented as `proxy.ts` at the project root. Additionally, the service_role Supabase client should NOT be used for `signInWithPassword`/`signUp` because these methods swap the Authorization header from the service_role JWT to the user JWT, corrupting the shared client. A dedicated auth client is required.

**Primary recommendation:** Create a dedicated server-only Supabase auth client (separate from the DB client) for auth operations, sign JWTs with jose for session cookies, and protect routes with `proxy.ts` using cookie-based optimistic checks.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Separate `/login` and `/signup` pages (not a combined tabbed page)
- **D-02:** Signup form collects email + password only (display name is optional, can be set later -- matches existing `signUpSchema` where `displayName` is optional)

### Claude's Discretion
- Visual style of auth pages (centered card, split layout, etc.) -- pick what works best with Shadcn/ui defaults
- Email verification flow -- whether to require email confirmation before access or allow immediate login after signup
- Error feedback approach -- inline form errors, toasts, or combination
- Session duration and behavior -- timeout, refresh strategy, expired session handling
- "Remember me" option -- include or omit
- API auth helper pattern -- how route handlers extract and validate the authenticated user from requests
- Middleware matcher configuration -- which routes are public vs protected
- Password requirements beyond the existing 6-char minimum

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | User can create account with email and password | Supabase `auth.signUp()` via dedicated auth client in API route handler; existing `signUpSchema` validates input |
| AUTH-02 | User can log in and session persists across browser refresh | Supabase `auth.signInWithPassword()` returns JWT; stored in httpOnly cookie; proxy.ts reads cookie to maintain session |
| AUTH-03 | User can log out from any page | API route handler deletes session cookie; client redirects to /login |
| AUTH-04 | Unauthenticated users are redirected to login page via middleware | `proxy.ts` (Next.js 16 renamed from middleware.ts) reads session cookie and redirects unauthenticated users |
| ARCH-04 | All API routes validate authentication and return proper HTTP status codes | `requireAuth()` helper function extracts and verifies JWT from cookie; returns 401/403 |
| ARCH-05 | Input validation with Zod schemas on all API endpoints | Existing Zod 4 schemas + `safeParse()` with `error.flatten()` for structured validation errors; return 400 |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **AGENTS.md directive:** "This is NOT the Next.js you know. This version has breaking changes -- APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices."
- **Architecture:** Strict 3-layer separation (DB -> API -> Client). Zero database calls from components (including Server Components).
- **Supabase:** service_role key server-only. No public client except for Realtime.
- **Package manager:** pnpm
- **Existing patterns:** `server-only` import guard, throw in DB layer / catch in API, direct per-module imports, Zod 4 conventions

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | 2.100.1 | Auth operations (signUp, signInWithPassword, getUser) | Already installed; Supabase Auth is the prescribed auth provider |
| `jose` | 6.2.2 | JWT signing/verification for session cookies | Recommended by Next.js official auth docs; lightweight, works in all runtimes |
| `zod` | 4.3.6 | Input validation on API endpoints | Already installed; Zod 4 with existing schemas |
| `next` | 16.2.1 | Framework with proxy.ts (formerly middleware.ts) | Already installed; proxy.ts is the v16 convention |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `server-only` | 0.0.1 | Guard server-only modules from client import | Already installed; use on all auth utility files |
| `next-themes` | 0.4.6 | Theme support in auth pages | Already installed in providers |

### shadcn Components to Install
| Component | Purpose |
|-----------|---------|
| `card` | Auth form wrapper (card, card-header, card-content, card-footer) |
| `input` | Email and password fields |
| `label` | Form field labels |
| `alert` | Server-side error display |

`button` is already installed.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| jose (manual JWT) | @supabase/ssr | @supabase/ssr manages cookies automatically BUT uses the anon key and creates a "public" client, violating the project's "no public client except Realtime" constraint |
| Custom session cookie | iron-session | Adds dependency; jose is already recommended by Next.js docs and gives full control |
| Server Actions for auth | API Route Handlers | Route handlers align with 3-layer architecture (API layer); Server Actions blur the line between client and API layers |

**Installation:**
```bash
pnpm add jose
pnpm exec shadcn add card input label alert
```

## Architecture Patterns

### CRITICAL: Next.js 16 Breaking Change -- proxy.ts

**Source:** `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`

Next.js 16 has **deprecated and renamed** `middleware.ts` to `proxy.ts`. The exported function name changes from `middleware` to `proxy`:

```diff
- // middleware.ts
- export function middleware(request: NextRequest) {
+ // proxy.ts
+ export function proxy(request: NextRequest) {
```

The CONTEXT.md and UI-SPEC reference "middleware" because the user used that term. The implementation MUST use `proxy.ts` at the project root with a `proxy()` exported function. All other behavior (matchers, NextResponse.redirect, NextResponse.next) remains the same.

### Recommended Project Structure
```
proxy.ts                           # Route protection (Next.js 16 -- NOT middleware.ts)
lib/
  auth/
    client.ts                      # Dedicated Supabase auth client (server-only, anon key)
    session.ts                     # JWT encrypt/decrypt, cookie management (server-only)
    helpers.ts                     # requireAuth() helper for route handlers (server-only)
  db/
    client.ts                      # Existing service_role client (DB operations only)
    users.ts                       # Existing getUserById, getUserByEmail
  schemas/
    auth.ts                        # Existing signUpSchema, signInSchema
  errors.ts                        # Existing DatabaseError
app/
  (auth)/
    login/page.tsx                 # Login page
    signup/page.tsx                # Signup page
    layout.tsx                     # Auth layout (centered card, no sidebar)
  (main)/
    layout.tsx                     # Main app layout (will have sidebar in Phase 3)
    page.tsx                       # Main page (redirect target after login)
  api/
    auth/
      signup/route.ts              # POST: create account
      login/route.ts               # POST: sign in
      logout/route.ts              # POST: sign out
      me/route.ts                  # GET: current user info
```

### Pattern 1: Dual Supabase Clients (Auth vs DB)

**What:** Separate Supabase clients for auth operations vs database operations
**When to use:** Always in this project -- the service_role client MUST NOT be used for auth.signInWithPassword/signUp because those methods swap the Authorization header

**Auth client (`lib/auth/client.ts`):**
```typescript
// Source: Supabase SSR docs + project architecture constraint
import 'server-only'
import { createClient } from '@supabase/supabase-js'

// Creates a fresh client for each auth operation
// Uses the service_role key but ONLY for auth.admin operations
// This is separate from the DB client to avoid session header contamination
export function createAuthClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  )
}
```

**CRITICAL:** Create a NEW client instance per request for auth operations. Do NOT reuse the module-level singleton from `lib/db/client.ts`. The `signInWithPassword` method replaces the Authorization header on the client instance, which would corrupt the shared DB client.

### Pattern 2: JWT Session Cookie Management

**What:** Sign/verify JWTs with jose, store in httpOnly cookie
**When to use:** All session management (create, verify, delete, refresh)

```typescript
// Source: Next.js 16 auth guide (node_modules/next/dist/docs/01-app/02-guides/authentication.md)
import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const secretKey = process.env.SESSION_SECRET!
const encodedKey = new TextEncoder().encode(secretKey)

export async function encrypt(payload: { userId: string; expiresAt: Date }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey)
}

export async function decrypt(session: string | undefined = '') {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    })
    return payload
  } catch {
    return null
  }
}

export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const session = await encrypt({ userId, expiresAt })
  const cookieStore = await cookies()

  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}
```

### Pattern 3: Route Protection via proxy.ts

**What:** Optimistic auth check in proxy.ts using session cookie
**When to use:** Every page request (proxy runs before rendering)

```typescript
// Source: Next.js 16 proxy.md + authentication guide
// File: proxy.ts (project root)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicRoutes = ['/login', '/signup']

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isPublicRoute = publicRoutes.some(route => path.startsWith(route))

  const sessionCookie = request.cookies.get('session')?.value

  // Redirect unauthenticated users to login
  if (!isPublicRoute && !sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect authenticated users away from auth pages
  if (isPublicRoute && sessionCookie) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all routes except static files and API routes
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
```

**Important note:** The proxy does an OPTIMISTIC check (cookie existence only). It does NOT verify the JWT signature or call `getUser()`. This is intentional -- proxy runs on every request including prefetches, and DB calls would be too expensive. The actual JWT verification happens in the API route handlers via `requireAuth()`.

### Pattern 4: API Route Auth Helper

**What:** `requireAuth()` function that extracts and verifies the JWT from the session cookie
**When to use:** Every protected API route handler

```typescript
// Source: Project architecture (3-layer separation)
import 'server-only'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/auth/session'

export async function requireAuth(): Promise<{ userId: string }> {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  const payload = await decrypt(session)

  if (!payload?.userId) {
    throw new AuthenticationError('Not authenticated')
  }

  return { userId: payload.userId as string }
}
```

### Pattern 5: API Route Handler with Validation

**What:** Standard pattern for protected API routes with Zod validation
**When to use:** Every API endpoint that requires auth + input validation

```typescript
// Source: Next.js 16 route handler docs + project patterns
import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth/helpers'
import { someSchema } from '@/lib/schemas/some'

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const { userId } = await requireAuth()

    // 2. Parse and validate input
    const body = await request.json()
    const result = someSchema.safeParse(body)
    if (!result.success) {
      return Response.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    // 3. Call DB layer
    const data = await someDbFunction(userId, result.data)

    // 4. Return response
    return Response.json(data, { status: 200 })
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // ... handle other errors
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### Pattern 6: Auth Forms (Client Components)

**What:** Client-side form with fetch to API routes, inline error display
**When to use:** Login and signup pages

```typescript
// Source: UI-SPEC contract + Next.js 16 auth guide
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function LoginForm() {
  const router = useRouter()
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [serverError, setServerError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setServerError('')

    const formData = new FormData(e.currentTarget)
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.get('email'),
        password: formData.get('password'),
      }),
    })

    if (response.ok) {
      router.push('/')
    } else {
      const data = await response.json()
      if (response.status === 400 && data.details) {
        setErrors(data.details.fieldErrors || {})
      } else {
        setServerError(data.error || 'Something went wrong')
      }
    }
    setIsLoading(false)
  }

  return (/* form JSX */)
}
```

### Anti-Patterns to Avoid

- **Using `middleware.ts`:** Next.js 16 renamed it to `proxy.ts`. The old name is deprecated and may not work correctly.
- **Reusing the DB client for auth:** The service_role singleton (`lib/db/client.ts`) will have its Authorization header corrupted by signInWithPassword.
- **Calling `getUser()` in proxy.ts:** Proxy runs on every request including prefetches. DB calls here cause severe performance issues. Use optimistic cookie checks only.
- **Using Server Actions for auth:** Violates the 3-layer architecture. Auth operations must go through API route handlers.
- **Storing session in localStorage:** Not accessible server-side. Must use httpOnly cookies for SSR and proxy access.
- **Using `getSession()` for security checks:** `getSession()` reads from local storage and can be spoofed. Use `getUser()` or JWT verification for server-side checks.
- **Using `@supabase/ssr`:** Creates a public client which violates the "no public client except Realtime" constraint.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT signing/verification | Custom crypto | jose library | Handles edge cases (timing attacks, key encoding, algorithm validation) |
| Session cookie options | Ad-hoc cookie settings | Next.js `cookies()` API with httpOnly/secure/sameSite | Framework-native, handles async properly in Next.js 16 |
| Route matching in proxy | Custom URL parsing | proxy.ts `config.matcher` with regex | Built into Next.js, supports static analysis at build time |
| Form UI components | Custom input/label/card | shadcn/ui components | Accessible by default, consistent theming, already configured |
| Password hashing | Custom bcrypt | Supabase Auth service | Supabase handles password hashing internally; we just call signUp/signInWithPassword |

**Key insight:** Supabase Auth handles ALL the complexity of password hashing, email verification, and user management. We only need to manage the session (JWT in cookie) on our side.

## Common Pitfalls

### Pitfall 1: Service Role Client Session Contamination
**What goes wrong:** Calling `auth.signInWithPassword()` on the service_role client replaces the Authorization header from the service_role JWT to the user's JWT. Subsequent DB queries using that client instance will fail or return wrong data.
**Why it happens:** Supabase client is stateful -- auth methods modify the client's headers.
**How to avoid:** Create a FRESH Supabase client instance for each auth operation. Never use the shared `lib/db/client.ts` for auth.
**Warning signs:** DB queries returning empty results or permission errors after a login operation.

### Pitfall 2: Next.js 16 proxy.ts vs middleware.ts
**What goes wrong:** Creating `middleware.ts` with a `middleware()` export instead of `proxy.ts` with a `proxy()` export.
**Why it happens:** Training data and most online tutorials still reference the old convention.
**How to avoid:** Always check `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`. Use `proxy.ts` at project root with `export function proxy()`.
**Warning signs:** Route protection not working at all; no redirect for unauthenticated users.

### Pitfall 3: cookies() is Async in Next.js 16
**What goes wrong:** Calling `cookies()` synchronously without `await`.
**Why it happens:** In Next.js 14 and earlier, `cookies()` was synchronous. In 15+ it's async.
**How to avoid:** Always `const cookieStore = await cookies()` -- note the `await`.
**Warning signs:** TypeScript errors about Promise, or runtime errors about ".get is not a function".

### Pitfall 4: Session Cookie Not Available in proxy.ts
**What goes wrong:** Trying to use `cookies()` from `next/headers` in proxy.ts.
**Why it happens:** Proxy runs in a different context. Use `request.cookies` instead.
**How to avoid:** In proxy.ts, use `request.cookies.get('session')` -- the cookies are on the request object, not from `next/headers`.
**Warning signs:** Runtime errors or cookies always appearing undefined in proxy.

### Pitfall 5: Zod 4 Error Formatting
**What goes wrong:** Using Zod v3 pattern `error.flatten().fieldErrors` expecting v3 types.
**Why it happens:** Zod 4 changed error formatting internals. The `.flatten()` instance method still exists on the classic ZodError class, but the standalone `z.flattenError()` is also available.
**How to avoid:** Both `result.error.flatten()` and `z.flattenError(result.error)` work in Zod 4 classic. The result has `.formErrors` (string[]) and `.fieldErrors` (Record<string, string[]>). Use whichever is more readable.
**Warning signs:** Type mismatches when passing flattened errors to components.

### Pitfall 6: Redirect After Cookie Set in Route Handler
**What goes wrong:** Using `redirect()` from `next/navigation` inside a Route Handler after setting a cookie. The `redirect()` function throws an error internally which can interfere with the response.
**Why it happens:** `redirect()` throws to halt execution; in route handlers, you should return a Response instead.
**How to avoid:** In API route handlers, return a JSON response with status 200. Let the CLIENT handle the redirect with `router.push()`. This also matches the UI-SPEC pattern: "Client-side redirect to `/` via `router.push('/')` after API response".
**Warning signs:** Redirect happening before cookie is set; cookie missing after redirect.

### Pitfall 7: Missing SESSION_SECRET Environment Variable
**What goes wrong:** jose operations fail at runtime because the secret key is undefined.
**Why it happens:** New env var not added to `.env.local`.
**How to avoid:** Add `SESSION_SECRET` to `.env.local` early. Generate with `openssl rand -base64 32`.
**Warning signs:** "Cannot read properties of undefined" errors from jose.

## Code Examples

### Auth Signup API Route (Complete Example)
```typescript
// Source: Project architecture patterns + Supabase Auth API
// File: app/api/auth/signup/route.ts
import { NextRequest } from 'next/server'
import { signUpSchema } from '@/lib/schemas/auth'
import { createAuthClient } from '@/lib/auth/client'
import { createSession } from '@/lib/auth/session'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 1. Validate input
    const result = signUpSchema.safeParse(body)
    if (!result.success) {
      return Response.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    // 2. Create user via Supabase Auth
    const supabase = createAuthClient()
    const { data, error } = await supabase.auth.signUp({
      email: result.data.email,
      password: result.data.password,
      options: {
        data: {
          display_name: result.data.displayName,
        },
      },
    })

    if (error) {
      // Handle specific Supabase auth errors
      if (error.message.includes('already registered')) {
        return Response.json(
          { error: 'An account with this email already exists.' },
          { status: 409 }
        )
      }
      return Response.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (!data.user) {
      return Response.json(
        { error: 'Failed to create account' },
        { status: 500 }
      )
    }

    // 3. Create session cookie
    await createSession(data.user.id)

    // 4. Return success (client handles redirect)
    return Response.json(
      { user: { id: data.user.id, email: data.user.email } },
      { status: 201 }
    )
  } catch {
    return Response.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
```

### Auth Login API Route (Complete Example)
```typescript
// File: app/api/auth/login/route.ts
import { NextRequest } from 'next/server'
import { signInSchema } from '@/lib/schemas/auth'
import { createAuthClient } from '@/lib/auth/client'
import { createSession } from '@/lib/auth/session'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 1. Validate input
    const result = signInSchema.safeParse(body)
    if (!result.success) {
      return Response.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    // 2. Authenticate via Supabase Auth
    const supabase = createAuthClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: result.data.email,
      password: result.data.password,
    })

    if (error) {
      return Response.json(
        { error: 'Invalid email or password. Please try again.' },
        { status: 401 }
      )
    }

    // 3. Create session cookie
    await createSession(data.user.id)

    // 4. Return success
    return Response.json(
      { user: { id: data.user.id, email: data.user.email } },
      { status: 200 }
    )
  } catch {
    return Response.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
```

### Auth Logout API Route
```typescript
// File: app/api/auth/logout/route.ts
import { deleteSession } from '@/lib/auth/session'

export async function POST() {
  await deleteSession()
  return Response.json({ success: true }, { status: 200 })
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` with `middleware()` | `proxy.ts` with `proxy()` | Next.js 16.0.0 | **BREAKING** -- file must be renamed |
| `cookies()` synchronous | `cookies()` async (returns Promise) | Next.js 15.0.0-RC | Must `await cookies()` everywhere |
| `params` as plain object | `params` as Promise | Next.js 15.0.0-RC | Must `await params` in route handlers |
| Zod 3 `z.string().email()` | Zod 4 `z.email()` | Zod 4.0.0 | Already handled in existing schemas |
| Zod 3 `.flatten()` only | Zod 4 both `.flatten()` and `z.flattenError()` | Zod 4.0.0 | Either works; `.flatten()` is more familiar |
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | 2024 | We use neither -- manual JWT approach per architecture constraints |

**Deprecated/outdated:**
- `middleware.ts` -- renamed to `proxy.ts` in Next.js 16. The old name still works with a deprecation warning but should NOT be used.
- `@supabase/auth-helpers-nextjs` -- deprecated in favor of `@supabase/ssr`
- Synchronous `cookies()` -- deprecated since Next.js 15

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None installed |
| Config file | none -- see Wave 0 |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Signup creates user and sets session cookie | manual | Manual: POST /api/auth/signup and verify cookie | N/A |
| AUTH-02 | Login sets persistent session cookie | manual | Manual: POST /api/auth/login, refresh browser | N/A |
| AUTH-03 | Logout deletes session cookie | manual | Manual: POST /api/auth/logout and verify cookie cleared | N/A |
| AUTH-04 | Unauthenticated redirect to /login | manual | Manual: visit protected route without cookie | N/A |
| ARCH-04 | API returns 401 for unauthenticated | manual | Manual: call API without session cookie | N/A |
| ARCH-05 | API returns 400 with Zod errors | manual | Manual: POST invalid data to API | N/A |

### Sampling Rate
- **Per task commit:** Manual browser verification (no automated tests)
- **Per wave merge:** Manual full flow test
- **Phase gate:** All 5 success criteria verified manually

### Wave 0 Gaps
No test framework is installed. This phase relies on manual verification as the project is a demo/test assignment. If automated testing is desired later, vitest would be the standard choice for Next.js projects.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Framework runtime | Yes | (bundled with Next.js) | -- |
| pnpm | Package installation | Yes | (used in Phase 1) | -- |
| jose | JWT session management | Not installed | 6.2.2 (latest) | Must install: `pnpm add jose` |
| Supabase Auth | User management | Yes (remote) | Hosted service | -- |
| SESSION_SECRET env var | JWT signing | Not configured | -- | Must generate and add to .env.local |
| shadcn components (card, input, label, alert) | Auth UI | Not installed | v4 | Must install: `pnpm exec shadcn add card input label alert` |

**Missing dependencies with no fallback:**
- `jose` package -- must be installed before session management can work
- `SESSION_SECRET` environment variable -- must be generated and added to `.env.local`

**Missing dependencies with fallback:**
- None -- all missing items must be installed

## Open Questions

1. **Email confirmation: skip or require?**
   - What we know: Supabase Auth supports email confirmation. The UI-SPEC says "allow immediate access (no email verification required -- simplifies demo flow)."
   - Recommendation: Skip email verification for the demo. Disable "Confirm email" in Supabase Auth settings (or use `auth.admin.createUser` with `email_confirm: true` to auto-confirm). This aligns with the UI-SPEC decision.

2. **Session duration**
   - What we know: Next.js auth guide uses 7 days. Supabase default JWT expiry is 1 hour.
   - Recommendation: Use 7-day session cookies (aligned with Next.js docs pattern). Our JWT is separate from Supabase's JWT -- we only store `userId` in our session cookie. The Supabase session tokens are NOT stored client-side in this architecture.

3. **Should authenticated users be redirected away from /login and /signup?**
   - What we know: UI-SPEC says "Authenticated user visits /login or /signup: Middleware redirects to / (HTTP 307)."
   - Recommendation: Yes, implement this in proxy.ts. This prevents confusion when a logged-in user navigates to auth pages.

4. **Auth client approach: signUp vs admin.createUser**
   - What we know: `signUp` may return sessions (which we don't need from Supabase -- we manage our own). `admin.createUser` gives more control and avoids session contamination entirely.
   - Recommendation: Use `auth.signUp()` on a fresh per-request client. This is simpler and handles password hashing automatically. The returned Supabase session is simply ignored -- we create our own JWT session cookie. Using `admin.createUser` is an alternative but requires manually setting `email_confirm: true` and doesn't trigger the user-sync trigger automatically via the standard auth flow.
   - **Update after deeper analysis:** `auth.signUp()` DOES trigger the `on_auth_user_created` trigger that auto-creates the `users` table row. `admin.createUser()` also triggers it. Both work. Prefer `auth.signUp()` for simplicity.

## Sources

### Primary (HIGH confidence)
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` -- proxy.ts convention, matcher config, migration from middleware.ts
- `node_modules/next/dist/docs/01-app/02-guides/authentication.md` -- JWT session management with jose, cookie patterns, auth flow
- `node_modules/next/dist/docs/01-app/02-guides/forms.md` -- form validation with Zod, useActionState patterns
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cookies.md` -- async cookies() API
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md` -- Route Handler API, params as Promise

### Secondary (MEDIUM confidence)
- [Supabase Auth signInWithPassword Reference](https://supabase.com/docs/reference/javascript/auth-signinwithpassword) -- API parameters and return types
- [Supabase Auth Admin API](https://supabase.com/docs/reference/javascript/admin-api) -- service_role client behavior
- [Supabase User Sessions Guide](https://supabase.com/docs/guides/auth/sessions) -- JWT/refresh token lifecycle
- [Supabase SSR Advanced Guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide) -- cookie-based session storage rationale
- [Supabase Password-Based Auth](https://supabase.com/docs/guides/auth/passwords) -- signUp/signInWithPassword patterns
- [Supabase Service Role Troubleshooting](https://supabase.com/docs/guides/troubleshooting/performing-administration-tasks-on-the-server-side-with-the-servicerole-secret-BYM4Fa) -- why auth methods corrupt service_role clients
- [Zod 4 Error Formatting](https://zod.dev/error-formatting) -- flatten() and flattenError() in Zod 4

### Tertiary (LOW confidence)
- None -- all critical claims verified against primary or secondary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries verified against installed versions and official docs
- Architecture: HIGH -- proxy.ts convention verified in bundled Next.js 16 docs; dual-client approach verified against Supabase troubleshooting docs
- Pitfalls: HIGH -- all pitfalls verified against official documentation (proxy.ts rename, cookies() async, service_role contamination)

**Research date:** 2026-03-29
**Valid until:** 2026-04-28 (30 days -- stable stack, no anticipated breaking changes)
