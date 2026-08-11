# Phase 1 — Foundations & configuration (implementation brief)

> Derived from the Project Specification §66.9 P1. The specification is the
> **sole behavioral input** (§66.5); this brief is pointers and checklist
> only — never an alternative source of truth.

## Wiring

- Target branch: `phase-1-foundations` (§9.8)
- Owning sections: §10 (env contract), §11 (constants), §15 (trees), §13 (manifests), §26.2 (fail-fast boot prototype), §66.3 (phase records)
- Skills: `planning-with-files` always (§66.3); no UI work in this phase
- Protocol: the §66.2 six steps in order; **stop at step 5** for user review; step 6 (§9.8) only after explicit approval

## Tasks (from §66.9 P1)

| Task | Sub-tasks | Owning sections |
|---|---|---|
| Repo standing | Verify the §15 trees match tracked files; clean untracked build artifacts; confirm manifests match §13.3/§13.4 | §15, §13 |
| Environment | `.env` contract per §10; fail-fast boot prototype (§26.2) | §10, §26 |
| Constants | `constants.js` + `httpStatus.js` skeletons per §11 with all §11 tables transcribed (backend §11.3/§11.4; client mirrors §11.5/§11.6) | §11 |
| Phase records | Initialize the §66.3 working files (task plan, findings log, progress record) | §66.3 |

## Install & amend

- Install & amend entries: **none** (both manifests already hold the §13.3/§13.4 base).

## Gate & verification

- **Exit gate (§66.9 P1):** §9.7 hygiene pass; §15 tree ↔ `git diff` matches; env read only via the frozen `env` object.
- **§9.7 checks:** backend `node --check` on every created file; no client build yet.
- **Grep gates:** no `process.env` read outside `config/env.js` (§10.3).

## Decision points & blockers

- None open for P1.

## Session close (step 5 format)

1. Show: diff summary + exit-gate results (tree-match check, hygiene pass, env-frozen proof).
2. On approval: commit `feat: phase 1 foundations`, push, merge to `main`, delete branch, verify (§9.8).
