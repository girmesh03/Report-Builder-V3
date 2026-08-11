# Phase 5 — Frontend integration readiness & hardening (implementation brief)

> Derived from the Project Specification §66.9 P5. The specification is the
> **sole behavioral input** (§66.5); this brief is pointers and checklist
> only — never an alternative source of truth.

## Wiring

- Target branch: `phase-5-integration-readiness` (§9.8)
- Owning sections: §63 (gate system), §60 (UX states), §61 (hardening), §64 (performance)
- Skills: `planning-with-files` (§66.3); `frontend-design` where any surface is reshaped (§66.4)
- Protocol: the §66.2 six steps in order; **stop at step 5** for user review; step 6 (§9.8) only after explicit approval

## Tasks (from §66.9 P5)

| Task | Sub-tasks | Owning sections |
|---|---|---|
| Readiness sweep | Full §63.3/§63.4 gate run; every page walked through loading/empty/error/success with fixtures | §63, §60 |
| Manual walks | §63.6 SC-1…SC-5 fixture-driven pre-backend walks (SC-1 final only at P7) | §63.6 |
| Hardening | §61 client-side rules (sanitize-on-render where stored HTML exists), §64 no-client-± greps | §61, §64 |

## Install & amend

- **Install: none.**

## Gate & verification

- **Exit gate (§66.9 P5):** step-5 review — the frontend is declared **integration-ready**: every §42 contract has a working consumer against the adapter, and no backend code exists yet.
- **§9.7 checks:** `npx vite build` (0 errors, then **delete `dist/*`**); `npm run lint`; full §63.3/§63.4 run report.
- **Grep gates:** §63.4 set; §64 no-client-± rules; adapter boundary intact (§66.10).

## Decision points & blockers

- None open; SC-1 accuracy claims explicitly deferred to P7 (§66.10).

## Session close (step 5 format)

1. Show: gate-run report (§63.3/§63.4), per-page §60 walk evidence, integration-ready declaration.
2. On approval: commit `feat: phase 5 integration readiness`, push, merge to `main`, delete branch, verify (§9.8).