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

- **Install: none** (the adapter is a plain module, §66.10).

## Gate & verification

- **Exit gate (§66.9 P3):** auth flows, guards and §42.3/§42.4 rules verified against the adapter with §40 fixtures.
- **§9.7 checks:** `npx vite build` (0 errors, then **delete `dist/*`**); `npm run lint`; dev server on port 3000 (§9.7).
- **Grep gates:** no `fetch`/`axios` outside `features/apiSlice.js` (§42.7); no provider keys in client code or Vite env (§10).

## Decision points & blockers

- None open for P3 (OQ-007 lands at P4).

## Session close (step 5 format)

1. Show: diff summary + exit-gate evidence (auth flows and guards walked against adapter fixtures, §42.3/§42.4 rules).
2. On approval: commit `feat: phase 3 frontend foundation`, push, merge to `main`, delete branch, verify (§9.8).