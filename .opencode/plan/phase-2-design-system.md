# Phase 2 — Design system & theme (implementation brief)

> Derived from the Project Specification §66.9 P2. The specification is the
> **sole behavioral input** (§66.5); this brief is pointers and checklist
> only — never an alternative source of truth.

## Wiring

- Target branch: `phase-2-design-system` (§9.8)
- Owning sections: §43 (tokens), §44 (customizations), §45 (responsive/motion), §46 (reusable component belt), §60 (states), §15.5 (theme tree)
- Skills: `planning-with-files` (§66.3); **`frontend-design` for all UI work** (§66.4 — distinctive, not templated; Ethiopic content typography first)
- Protocol: the §66.2 six steps in order; **stop at step 5** for user review; step 6 (§9.8) only after explicit approval

## Tasks (from §66.9 P2)

| Task | Sub-tasks | Owning sections |
|---|---|---|
| Theme tokens | §43 palette/type/surfaces; Ethiopic content face; §44 overrides | §43, §44 |
| Responsive system | §45 breakpoints and motion | §45 |
| Component belt | The §46.1–§46.17 reusable components (belt first, pages later) | §46 |
| Favicon | Content decision + asset | §43, §15.5 |

**Tree rule:** the theme files exist in the scaffold and are **authored in place** — `client/src/theme/AppTheme.jsx` (single `createTheme`, §43.3), `themePrimitives.js` (§43 tokens), and the eight `customizations/*.js` + index (§44.1). §15.5 tree unchanged; new component files land under `components/reusable/` with a §15.7 same-change note if any section names them.

## Install & amend

- **Install (this phase):** `@fontsource/noto-serif-ethiopic` (client dependency, §13.5).
- **Amend same commit (§66.6):** §13.4 and §15.5 if the tree or manifest lists change.

## Gate & verification

- **Exit gate (§66.9 P2):** build 0 errors; MUI-only styling greps (§63.4); §46 component states enumerate §60.
- **§9.7 checks:** `npx vite build` (0 errors, then **delete `dist/*`**); `npm run lint`.
- **Grep gates (§43.3, §44.10):** no `createTheme` outside `AppTheme.jsx`; no `themePrimitives` import outside `theme/*`; no `brand[`/`gray[`/`hsl(` literals outside `theme/`; no Tailwind (excluded, §13.6).

## Decision points & blockers

- None open; the uninstalled-behavior gate (§66.8) binds later phases, not this one.

## Session close (step 5 format)

1. Show: design plan per `frontend-design` two-pass review, diff summary, build + grep gate results.
2. On approval: commit `feat: phase 2 design system`, push, merge to `main`, delete branch, verify (§9.8).
