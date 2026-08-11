# Phase 7 — Backend integration & transport (implementation brief)

> Derived from the Project Specification §66.9 P7. The specification is the
> **sole behavioral input** (§66.5); this brief is pointers and checklist
> only — never an alternative source of truth.

## Wiring

- Target branch: `phase-7-backend-integration` (§9.8)
- Owning sections: §42 (real transport), §16.4 (conditional NVIDIA helper), §13.5 (planned deps), §62 (retention), §63.6 (SC-1/SC-3/SC-4), §66.10 (adapter deletion)
- Skills: `planning-with-files` (§66.3); `frontend-design` only if a surface changes (§66.4)
- Protocol: the §66.2 six steps in order; **stop at step 5** for user review; step 6 (§9.8) only after explicit approval

## Tasks (from §66.9 P7)

| Task | Sub-tasks | Owning sections |
|---|---|---|
| Real transport | Client switches to the real API through §42; the §66.10 adapter is **deleted** | §42 |
| Transport helper | Evaluate the §16.4 condition; install the NVIDIA multipart helper **only if** it holds — never proactively | §16.4, §13.5 |
| Retention live | §62 sweeper validated: archive → window → sweep; TTL safety net; orphan pass | §62 |
| Manual acceptance | §63.6 SC-1 real-Amharic walk; SC-3 surgical check; SC-4 full loop both types | §63.6 |

## Install & amend

- **Install: conditional** — NVIDIA helper only if the §16.4 condition holds (never proactive).
- **Amend same commit (§66.6):** §13.3 if the helper is installed.

## Gate & verification

- **Exit gate (§66.9 P7):** SC-1/SC-3/SC-4 pass; mock-adapter grep gate clean (§66.10 — the adapter module is absent from the client tree).
- **§9.7 checks:** backend `node --check`; client `npx vite build` (0 errors, then **delete `dist/*`**); `npm run lint`.

## Decision points & blockers

- **§16.4 condition** evaluated and evidenced at step 5 — code shows the verdict, not just the outcome.
- **SC-1** is final here (real-Amharic walk); accuracy claims were explicitly deferred from P5 (§66.10).

## Session close (step 5 format)

1. Show: §16.4 verdict, diff summary, SC-1/SC-3/SC-4 evidence, adapter-absent grep proof.
2. On approval: commit `feat: phase 7 backend integration`, push, merge to `main`, delete branch, verify (§9.8).