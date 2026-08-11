# Phase 4 — Frontend feature pages (implementation brief)

> Derived from the Project Specification §66.9 P4. The specification is the
> **sole behavioral input** (§66.5); this brief is pointers and checklist
> only — never an alternative source of truth.

## Wiring

- Target branch: `phase-4-frontend-pages` (§9.8)
- Owning sections: §49–§59 (pages), §53 (wizard/editor), §46.16 (`MuiEditor`), §54 (correction), §61 (sanitizer), §38 (contracts), §66.10 (adapter)
- Skills: `planning-with-files` (§66.3); **`frontend-design`** for every page (§66.4 — every surface deliberate and distinctive, §60 states enumerated)
- Protocol: the §66.2 six steps in order; **stop at step 5** for user review; step 6 (§9.8) only after explicit approval

## Tasks (from §66.9 P4)

| Task | Sub-tasks | Owning sections |
|---|---|---|
| Dashboard | KPIs/charts/latest per §49 | §49, §38 contract |
| Reports list & details | §50 grid, §51 details incl. editor read-only surface | §50, §51 |
| Wizard | §52 steps 1–5 incl. recorder and review | §52, §53 |
| Correction & chat | §54 Modes 1–3, §55 conversation UI | §54, §55 |
| Branches, profile, exports, search | §56, §57, §58 (print/TXT/XLSX/CSV), §59 | §56–§59 |
| Editor install | `MuiEditor` (TipTap + dompurify) + toolbar per ADR-038 | §46.16, §53, §14.4 |

## Decision point: OQ-007 (lands here, §69)

- The `raw`/`latest` storage format (plain text vs rich-text HTML) is decided at the editor phase; §21.2 slots, §61.3 policy and §46.16 contract are finalized in the **same change**. Both slots stay plain `String` until then (§21.2).

## Install & amend

- **Install (this phase):** `@tiptap/react` + `dompurify` (§13.5 editor phase).
- **Amend same commit (§66.6):** §13.4, §15.5, and the OQ-007 row in §69.
- **§66.8 gate expires here:** the editor install lands with this phase in the same commit; the sanitizer (§61) becomes live policy (§61.3).

## Gate & verification

- **Exit gate (§66.9 P4):** every page enumerates the four §60 states; §63.4 grep gates; SC-5 partial (client formats vs fixtures; Google Docs stays stub, §37.3 — OQ-004).
- **§9.7 checks:** `npx vite build` (0 errors, then **delete `dist/*`**); `npm run lint`; dev server port 3000.
- **Grep gates (§43.3/§44.10):** theme-folder rules hold across all new pages.

## Decision points & blockers

- **OQ-007** — decide at this phase (see above).
- **OQ-004** — Google OAuth stays stub; Google Docs menu shows the "coming soon" state (§37.3); `EXPORT_DOCS_ENABLED` stays `false` (§11.3).

## Session close (step 5 format)

1. Show: OQ-007 decision record, diff summary, per-page §60 state walkthrough, gate results.
2. On approval: commit `feat: phase 4 frontend pages`, push, merge to `main`, delete branch, verify (§9.8).