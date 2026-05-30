# Frontend Gaps

**Stack:** Next.js 16 App Router, React 18, TypeScript, Tailwind  
**Root:** `frontend/`

---

## Auth & route protection

### F-001 — Token storage is client-only

- [ ] **P2** — Document security model

**Problem:** Access/refresh tokens in `localStorage` or `sessionStorage` (`lib/auth-storage.ts`).

**Fix:** Document XSS implications; ensure CSP is strict in production. Consider httpOnly cookie session if backend supports it (larger change).

---

### F-002 — Auth context handles network vs auth errors

- [ ] **Done (verify)** — Already distinguishes 401 from transient network failure

**File:** `context/AuthContext.tsx` — keep this behavior when adding server-side checks.

---

### F-003 — Protected routes are client-side only

- [ ] **P1** — Add server-side admin gate

**Problem:** Admin (`AdminShell.tsx`), checkout, orders, and account pages gate in React — not in `proxy.ts` or server layouts. URLs are reachable; unauthorized users see sign-in UI instead of redirects.

**Fix options:**

1. **Proxy/layout redirect:** In `proxy.ts` or `app/admin/layout.tsx`, check session cookie/JWT and redirect to `/account` or `/system` login.
2. **Middleware cookie:** Set httpOnly session cookie on login for server-readable auth (requires backend change).
3. **Minimum:** Redirect `/admin/*` to `/system` already exists; add auth check before rewrite.

**Files:** `frontend/proxy.ts`, `frontend/app/admin/layout.tsx`, `frontend/components/admin/AdminShell.tsx`

---

### F-004 — Admin RBAC is client-side nav only

- [ ] **P2** — Test permission matrix

**Problem:** `lib/admin-permissions.ts` controls nav and `AdminShell` — API still enforces server-side, but UI can flash wrong nav.

**Fix:** Add Vitest tests for permission matrix; align with backend `permission_catalog.py`.

---

## Testing

### F-005 — Placeholder smoke test only

- [ ] **P0** — Replace CI smoke test with real tests

**Problem:** `frontend/__tests__/ci-smoke.test.ts` only asserts `1 + 1 === 2`. Testing Library is installed but unused.

**Priority test targets:**

- [ ] `lib/api/client.ts` — 401 refresh retry, maintenance 503 event
- [ ] `lib/api/error-message.ts` — friendly HTTP messages
- [ ] `lib/admin-permissions.ts` — role/permission matrix
- [ ] `lib/auth-storage.ts` — remember-me vs session bucket
- [ ] Auth form Zod validation (`AccountAuthForm`)
- [ ] Checkout shipping validation

**Files:** `frontend/__tests__/`, `frontend/vitest.config.ts`, `frontend/package.json`

---

### F-006 — Tests excluded from TypeScript check

- [ ] **P3** — Include tests in `tsc` or rely on Vitest types

**Problem:** `tsconfig.json` excludes `__tests__` and `*.test.ts(x)`.

**Fix:** Optional — add separate `tsconfig.test.json` if needed.

---

## UX, loading, accessibility

### F-007 — No route-level `loading.tsx`

- [ ] **P2** — Add Suspense boundaries at route level

**Problem:** No `loading.tsx` files under `app/`; skeletons are component-level only.

**Fix:** Add `loading.tsx` for heavy routes: `/shop`, `/admin/*`, `/checkout`, `/orders`.

---

### F-008 — Accessibility gaps

- [ ] **P2** — Baseline a11y improvements

**Gaps:**

- [ ] No skip-to-content link
- [ ] Limited `focus-visible` styling
- [ ] Skeleton screens use `aria-hidden` without complementary live region
- [ ] Toast lacks error vs success `role` distinction

**Files:** `frontend/app/layout.tsx`, `frontend/context/ToastContext.tsx`, `frontend/components/StorefrontSkeletons.tsx`

**Note:** Lighthouse CI runs on PRs but is non-blocking (`continue-on-error: true`).

---

## Dependencies & build

### F-009 — Unused Radix UI packages

- [ ] **P2** — Remove or adopt

**Problem:** `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-slot` in `package.json` — zero imports. Custom dialogs used instead.

**Fix:** Remove deps, or migrate `DialogContext` to Radix for focus trapping.

---

### F-010 — ESLint / Next version skew

- [ ] **P2** — Align versions

**Problem:** `next@16.2.3` with `eslint-config-next@15.5.13`.

**Fix:** Upgrade `eslint-config-next` to match Next 16 when stable.

---

### F-011 — Mock type layer retained

- [ ] **P3** — Rename or refactor types

**Problem:** `CatalogContext` maps API rows to `MockProduct` from `lib/mock-data.ts` despite live API.

**Fix:** Introduce `Product` / `CatalogProduct` types; deprecate mock naming.

---

### F-012 — Supabase env vars in Vercel doc only

- [x] **P2** — Resolved

Vercel doc no longer lists unused `NEXT_PUBLIC_SUPABASE_*`; environment hub explains API-served Storage URLs only.

---

## PWA

### F-013 — Service worker update strategy undocumented

- [ ] **P3** — Document SW lifecycle

**Files:** `frontend/public/sw.js`, `frontend/components/PWARegister.tsx`

**Fix:** Add note in `frontend/README.md` on cache busting and update prompts.

---

## Production build guards

### F-014 — Vercel requires API and site URL

- [ ] **Done (verify)** — `next.config.mjs` throws if missing on Vercel build

Ensure CI and local docs match required vars: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`.
