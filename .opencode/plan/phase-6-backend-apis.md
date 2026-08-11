# Phase 6 — Backend foundation & domain APIs (implementation brief)

> Derived from the Project Specification §66.9 P6. The specification is the
> **sole behavioral input** (§66.5); this brief is pointers and checklist
> only — never an alternative source of truth.

## Wiring

- Target branch: `phase-6-backend-apis` (§9.8)
- Owning sections: §26 (boot/logger), §27 (chain/tiers/sessions), §18 (model conventions), §19–§24 (models), §28 (auth), §29 (validators), §30–§36 (domain APIs), §37–§39 (aggregations), §40 (seeding)
- Skills: `planning-with-files` (§66.3); no UI work (frontend-design not loaded unless a surface is touched)
- Protocol: the §66.2 six steps in order; **stop at step 5** for user review; step 6 (§9.8) only after explicit approval

## Tasks (from §66.9 P6)

| Task | Sub-tasks | Owning sections |
|---|---|---|
| Foundation | §26 boot/logger/health/shutdown; §27 chain, tiers, envelope, sessions | §26, §27 |
| Models | §19–§24 with §18 conventions, indexes, TTL declarations | §19–§24, §18 |
| Identity | §28 auth, sessions, OAuth stub; §29 validators | §28, §29 |
| Domain APIs | §30 branches; §31 reports & status machine; §32 uploads; §33 STT; §34 generation; §35 correction; §36 chat | §30–§36 |
| Aggregations | §37 exports (content surface + docs stub), §38 analytics, §39 search | §37–§39 |
| Seeding | §40 mock seed/wipe endpoints | §40 |

## Install & amend

- **Install: none planned** (backend manifest is final per §13.3; the NVIDIA helper is P7-conditional, §16.4).
- **Amend same commit (§66.6):** §15.4 tree amendments when files land in the tree.

## Gate & verification

- **Exit gate (§66.9 P6):** `node --check` passes; seed/wipe deterministic (§40.6); one transition-guard table (§31.4); session template on every write (§27.7).
- **§9.7 checks:** backend `node --check` on every file; backend dev server on port 4000 (nodemon, P1 script per §26).
- **Grep gates:** no `console.log` in the backend — Winston logger only (§9.5); `_id` primary key, no `.id` access (§9.3); no raw `process.env` outside `config/env.js` (§10.3).

## Decision points & blockers

- Generation/correction contract details (§34/§35) include the branch digest lifecycle — re-read §6.11 + §31.5/§31.6 before building; unassigned-accept gate and digest retry endpoint are in scope here.

## Session close (step 5 format)

1. Show: diff summary + exit-gate evidence (node --check pass, deterministic seed run, transition-guard table, session-template proof).
2. On approval: commit `feat: phase 6 backend apis`, push, merge to `main`, delete branch, verify (§9.8).