# Phase 8 — Deployment & hardening (implementation brief)

> Derived from the Project Specification §66.9 P8. The specification is the
> **sole behavioral input** (§66.5); this brief is pointers and checklist
> only — never an alternative source of truth.

## Wiring

- Target branch: `phase-8-deployment` (§9.8)
- Owning sections: §65 (deployment contract), §61 (security), §62 (retention soak), §63 (full gates), §2.6 (DoD), §69 (OQ-003)
- Skills: `planning-with-files` (§66.3); `frontend-design` only if a surface changes (§66.4)
- Protocol: the §66.2 six steps in order; **stop at step 5** for user review; step 6 (§9.8) only after explicit approval

## Tasks (from §66.9 P8)

| Task | Sub-tasks | Owning sections |
|---|---|---|
| Deployment | §65 contract executed (production sign-off waits on OQ-003; dev-env deployment otherwise) | §65, §69 |
| Security re-sweep | §61 hardening walk: XSS double-gate, secret hygiene, deny-list logging | §61 |
| Retention soak | Sweeper across development cycles; §62.8 edge cases exercised | §62 |
| Full gates | §63.6 full matrix incl. SC-5 five-format export; DoD items 1–4 | §63, §2.6 |

## Install & amend

- **Install: none** beyond the approved plan (§65/§13).

## Gate & verification

- **Exit gate (§66.9 P8):** DoD §2.6 complete; §63.4 full sweep; step-5 review closes the phase.
- **§9.7 checks:** backend `node --check` on every file; client `npx vite build` (0 errors, then **delete `dist/*`**); `npm run lint`.

## Decision points & blockers

- **OQ-003 (BLOCKING):** deployment target unknowns (host, domain, production MongoDB) block **production sign-off** only. Until closure: §65 stands as the topology contract and P8 runs against the development environment (§69.2). Closure path: owner decision recorded in §69 with §65.9 verification updated in the same change.

## Session close (step 5 format)

1. Show: deployment result (dev-env unless OQ-003 closed), §61/§62/§63 evidence, DoD §2.6 items 1–4 status, and the OQ-003 note.
2. On approval: commit `feat: phase 8 deployment`, push, merge to `main`, delete branch, verify (§9.8).