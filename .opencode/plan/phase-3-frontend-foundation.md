# Phase 3 — Frontend foundation & network (implementation brief)

> Derived from the Project Specification §66.9 P3. The specification is the
> **sole behavioral input** (§66.5); this brief is pointers and checklist
> only — never an alternative source of truth.

## Wiring

- Target branch: `phase-3-frontend-foundation` (§9.8)
- Owning sections: §41 (entry/routing/guards), §42 (network layer), §48 (auth pages), §28 (auth contract), §66.10 (mock adapter), §40 (fixtures)
- Skills: `planning-with-files` (§66.3); **`frontend-design`** for the auth/landing surfaces (§66.4)
- Protocol: the §66.2 six steps in order; **stop at step 5** for user review; step 6 (§9.8) only after explicit approval

## Tasks (from §66.9 P3)

| Task | Sub-tasks | Owning sections |
|---|---|---|
| Entry & routing | App shell, routes and lazy loading (ADR-025); guards §41.5 | §41, §47 |
| Network layer | `apiSlice` descriptor, reauth chain, envelope unwrap (§42) | §42 |
| Auth pages | Landing/Login/Register against the §28 contract | §48 |
| Mock adapter | The §66.10 adapter wired at the §42 boundary | §66.10, §40 |

**Adapter rules (§66.10):** plain client module (no new package); mirrors §40 fixture data and the DTO transforms of §17/§27 exactly; dev-only condition, never in a production build; it is a phase artifact — deleted at P7.

## Install & amend

- **Install (R8):** `prop-types` (declared `dependencies` — direct dep of the §46 belt's 21 files; §13.4 mirrored same commit). The adapter itself is a plain module (§66.10).

## Gate & verification

- **Exit gate (§66.9 P3):** auth flows, guards and §42.3/§42.4 rules verified against the adapter with §40 fixtures.
- **§9.7 checks:** `npx vite build` (0 errors, then **delete `dist/*`**); `npm run lint`; dev server on port 3000 (§9.7).
- **Grep gates:** no `fetch`/`axios` outside `features/apiSlice.js` (§42.7); no provider keys in client code or Vite env (§10).

## Decision points & blockers

- None open for P3 exit (OQ-007 lands at P4). **OQ-008 (§69)** registered per owner decision: Landing needs further work — polish/concept revision deferred until after all eight phases; non-blocking.

## Session close (step 5 format)

1. Show: diff summary + exit-gate evidence (auth flows and guards walked against adapter fixtures, §42.3/§42.4 rules).
2. On approval: commit `feat: phase 3 frontend foundation`, push, merge to `main`, delete branch, verify (§9.8).

## Round log (findings & progress — §66.3)

- **R1 — Entry & routing:** `App.jsx` root node (theme → baseline → toast → error boundary → Outlet, ADR-025); `main.jsx` router: four branches (§41.3), lazy page modules via `lazy: { Component }`, statically shipped guards + NotFound + AppErrorPage; boot preload dispatches the §42.7 `getCurrentUser` probe (`subscribe: false`).
- **R2 — Network layer:** `redux/features/apiSlice.js` — single descriptor, `baseQueryWithReauth` (401 → one refresh → one retry; `skipReauth` marker; `expireSession` = silent `/login` assign, §42.3), envelope unwrap + error normalization (toast-ready `{status, message, fieldErrors}`, §42.4); `authEndpoints.js` injected once (ADR-026) incl. the OQ-004 `googleAuth` stub route.
- **R3 — Store & session lifecycle:** `redux/app/store.js` + `authSlice` (status machine); listener drives boot `GET /auth/me` into `authenticated`/`setGuest`.
- **R4 — Shells:** `PublicLayout` (auth-aware bar: Logout for authed, Log in/Sign up for guests, icons under sm), `AppShell` (sidebar + 64px protected appbar + search + theme toggle + avatar), `LoadingSpinner` route-transition swap in both.
- **R5 — Mock adapter:** `mock/fixtures.js` (MOCK_USERS per §25.3 persona, dev-only fixture data) + `mock/transport.js` (full P3 auth surface: register/login/refresh/logout/me/google, §17/§27 DTO+envelope transforms, access TTL 30s exercising the reauth chain); wired dev-only in apiSlice under `import.meta.env.DEV` — absent from production builds.
- **R6 — 404 surface:** `notFound_404.svg` (in-house line-art French curve + day-pin motif), `MuiEmptyState.jsx` (belt §46.17), `pages/NotFound.jsx` (§59.4: auth-selected chrome, Home/Back actions); scaffold `vite.svg`/`react.svg` extras dropped (tree exactness, §15.5).
- **R7 — Hygiene + mirrors:** lint 0, build 0 errors, `dist/` removed; §11.5 constant-consumer mirror rows; `bash.exe.stackdump` garbage deleted.
- **Checkpoint (step 6, approved):** `chore: phase 3 checkpoint` — verified R1–R7 tree committed on `phase-3-frontend-foundation`.
- **R8 — Auth pages & fixes:**
  - **Defect 1 (found):** `ProtectedRoute` compared `"unauthenticated"` while the §41.5 enum resolved to `"guest"` — guests sailed into the protected shell. Fixed to `guest`; §41.5 amended with the enum lock (`initializing | authenticated | guest`) same commit.
  - **Defect 2 (found):** the store listener only mirrored `getCurrentUser`; the login success path (same §28 `{user}` shape) never landed `authenticated` — post-login navigation would have re-redirected. Added the `login.matchFulfilled` listener.
  - **Manifest lock:** `prop-types` promoted to declared `dependencies` (21 belt files import it directly); §13.4 mirrored.
  - **§48 pages:** `components/landing/` — `RuledPaper` (cardless ruled dictation desk, §43.2; waveform trace persisting after first display, static under `prefers-reduced-motion`), `Hero` (eyebrow + headline + Sign up/Log in CTAs, two-column md+), `BranchStrip` (many storefront icons + the branch-management promise, between hairlines), `HowItWorks` (01/02/03 Record → Verify → Deliver strip + branches band), `CtaBand`; `components/auth/` — `validators.js` (manual rules, §48.3/§48.4 copy), `GoogleOAuthButton` (inline Google-G glyph, §28.6 OQ-004 stub → toast), `LoginForm` (RHF `onBlur`, empty-submit → focus email, `state.from` return, §41.2 decision 10), `RegisterForm` (3 fields exactly, §19.2 auto-extraction helper, decision 11 → `/login`), `BrandPanel` (static ruled desk, lg+); pages rewritten with named `Component` exports preserved for `lazy`.
  - **Verification:** lint 0; build 0 errors + `dist/` deleted; §63.4 greps clear (fetch/axios only in apiSlice, toast only via `showToast`, `setError` in docs only, no "Remember me" feature, no provider keys, `import.meta.env` only for `VITE_*`); dev-server smoke 200 + title on port 3000.
  - **Stale docs:** MuiToast §60 preamble and AppShell padding comment corrected to match code.
- **R9 — Landing composition (owner revision, rounds 9a + 9b):**
  - **9a:** landing copy moves from the customer's persona to his own product — generic Hero copy; HowItWorks cards carry no times; the eight §6.3 lines and the §6.8 report body appear as name-free generic samples (the መድኃኒዓለም/ኤርፖርት/ቡልቡላ fixture names removed); login/register cards keep their radius on xs and center vertically; the toast trigger passes `icon: false` (§60.3 — the variant meta icon is the only icon surface) and the message wraps long server strings; `components/login` renamed `components/auth`, mirrored into §15.5/§48.1/§48.3–§48.5.
  - **9b:** the hero wave loses its card — `RuledPaper` becomes a cardless ruled desk and the trace persists after its first display (`forwards`; fully drawn, static under `prefers-reduced-motion`); `BranchStrip` (many storefront icons, small text, between hairlines) replaces `HeaderShowcase` — fields, placeholder captions and the eight-line card removed; the report section (`ReportShowcase`) removed per owner decision; `Landing.jsx` = Hero → BranchStrip → HowItWorks → CtaBand → footer; §43.2 signature + §48.2 composition mirrored same commit.
  - **Verification:** lint 0; build 0 errors + `dist/` deleted; greps clear (`HeaderShowcase`/`ReportShowcase`/`ReportHeaderPanel`/`components/login` → zero hits); dev-server smoke on port 3000.
- **R10 — Close-out audit (exhaustive P3 validation):** every §66.9 P3 deliverable, §41/§42/§47/§48/§59/§66.10 rule, §15.5/§13.4/§14.3/§11.5 mirror, and §42.7/§48.6/§60.9 grep gate checked against code — 41 checks. Passed outright: routing/guards/boot, network layer (reauth, silent expiry, normalization), auth slices + forms + matrices, adapter (dev-only, DTO-true, 30s TTL), manifests, ADR rows. Fixes landed this round:
  - **G1** — §15.5 tree and §41.7 example still said `components/login/`; renamed to `auth/` (tree line + prose).
  - **G2** — §11.5 lacked `TOAST_AUTO_DISMISS_MS`/`TOAST_CATALOGUE` rows (constants.js consumers exist since R2/R8); two rows added with §60.5/§60.6 mirrors.
  - **G3** — 404 card missed the §59.4 surface (`bgcolor background.default` + divider border + radius); props added; R6's MuiEmptyState mention corrected (the §59.4 Box is the surface, no belt component).
  - **G4** — RegisterForm helper text had generalized the §19.2 example ("abc.xyz@gmail.com"); restored verbatim "beza.ayalew@gmail.com becomes Beza Ayalew" (§48.4).
  - **G5** — §42.3 step 5 amended with the authenticated-session clause: expiry redirect (authenticated → 401 → one retry → session cleared → silent `/login`) never bounces anonymous/initializing probes — the code's guard (apiSlice) is the implementation of the amended text.
  - **OQ-008** — registered (§69) per owner decision: Landing needs further work; polish/concept revision deferred until after all eight phases; non-blocking; §48.2 pointer added.
  - **Verification:** lint 0; build 0 errors; `dist` pre-delete grep confirms no mock chunk in the production bundle; `dist/` deleted; greps clear (`components/login` zero, `auth/` consistent across spec and tree); dev-server smoke on port 3000.