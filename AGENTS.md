# AGENTS.md

## Repository status

Report Builder V3 — Amharic daily-supervision report builder. Two components: `backend/` (Express 5 + Mongoose 9, ESM) and `client/` (Vite + React 19 + MUI v9 + RTK).

The implementation runs on the §66 phases: **phases 1 (foundations) and 2 (design system) are complete and merged to `main`; phase 3 (frontend foundation & network) is complete and merged** (one close-out commit `chore: phase 3 close-out audit`, §9.8). **Phase 4 (frontend feature pages) is in progress on `phase-4-frontend-pages`**: the network endpoint layer (§42.6), the §49 dashboard, the §50 reports list (with the provisional OQ-009 filter dialog, the md+ List/Cards toggle, cards-only below md, per-`isArchived` actions, and the removed page-header eyebrow), and the owner R3-fix review (14 points) **plus its 5-point follow-up round** (eyebrow removal, one-line page header, the session `userId`/redirect-bounce fix — `startSessionForUser` now writes the merged session back to `activeSession` — the `expireSession` SPA redirect, mock TTLs mirroring §28, chart-value finite guards, and the MUI v9 `slots.transition` dialog fix) **plus its 7-point UX pass with the 3 re-opens closed** (search clear button hidden when empty via the unwrapped-adornment sibling rule, one-line header with the action group in the `actions` slot, the ReportCard two-row footer — caption line + right-aligned action row below, the explicit LineChart y-domain killing the `<path>` NaN, fullscreen dialogs radius 0, xs pagination compact, and the removed `slotProps` on `MuiPagination` — MUI v9.3 Pagination has no slots support and leaked it to the DOM root) are complete; the remaining rounds are the §52 wizard + editor install, §51 details, §54 correction, §55 chat, §56 branches, §57 profile, §58 exports, and the close-out audit. The backend holds the Stage-4 implementation through sub-phase 5 (P1 foundation + sub-phase 1 foundation & middleware §26/§27 + sub-phase 2 models §19–§24A + sub-phase 3 identity §28/§29 + sub-phase 4 domain APIs §30–§36 + addisai install — implemented and fully suite-green, merged to `main` at `93dd8ad` — + **sub-phase 5 aggregations §37–§39 — implemented and fully suite-green on `phase-6-backend-aggregations` (test-05 46/46 incl. the live text-index count = 1 gate; step 5 = the owner live run pending, step 6 gated commit pending)**); remaining: sub-phase 6 (seeding & sweepers §40/§61/§62). The client holds the P3 deliverables: entry & routing (ADR-025 lazy pages, static guards), the RTK Query network layer with reauth (`redux/features/apiSlice.js`, §42), the §48 auth pages and the round-9 landing composition (cardless ruled-desk hero with the persisting §43.2 waveform, branches strip, how-it-works, CTA band — provisional under OQ-008, §69), the §60 toast surface, and the dev-only mock adapter (`mock/`, §66.10 — deleted at P7). `App.jsx` is the composed root node (theme → baseline → toast → error boundary → Outlet, §41.4). The canonical target trees are §15.4 (backend) and §15.5 (client); follow them when creating files.

**Spec-correction effort — CLOSED 2026-08-19.** The correct-the-spec-then-rebuild correction phase is complete: 51/51 DERIVED sections dispositioned, §63.9 audit C1–C6 green at a single run, sign-off record §69.3.3, close-out commit `7fb1580` on `spec-correction`. The effort now operates as **implementation & re-implementation**: Stage 4 (backend implementation per §15.4) is NEXT; Stage 5 (frontend re-implementation) is strictly gated on backend completion (owner directive, 2026-08-19).

## Single source of truth

`.opencode/plan/project-specification.md` (≈12k lines) is the authoritative statement of behavior and design (PRD+PDS+SAD+HLD+LLD+SDD in one document). Package manifests are the version source of truth (§13). Nothing else decides behavior (§66.5: standing instructions → spec → logical reasoning → implementation; spec wins over habits).

- **No invented details rule:** unknown behavior is registered in §69 (Open Questions) and marked `TODO(open)` — never silently invented.
- Cross-references cite this document's section numbers only.

## Working protocol

- Execution follows §66 phases. Each phase runs the §66.2 six steps in order; step 6 (commit/push/merge) never runs without explicit user approval.
- §66.3 working files (`task_plan.md`, `findings.md`, `progress.md`) are mandated by the spec — use the repo's `planning-with-files` skill (`.opencode/skills/planning-with-files/`) for these. The `frontend-design` skill (`.opencode/skills/frontend-design/`) is the standing UI practice for every frontend task (§66.4).
- **Same-change discipline (§66.6):** a change to a shared source of truth updates its mirrors in the same commit — §15.4/§15.5 tree with sections naming files, §13 manifests with installs/removals, §14.3 ADR index, §11 constants with consumers.
- **Tool-command responsiveness rule (owner directive 2026-08-19, §63.10):** commands must return promptly — never burn a timeout. Prohibited: backgrounding that holds the capture pipe (`nohup … & disown`), PowerShell `Start-Process` with `-RedirectStandardOutput`/`-RedirectStandardError` (blocks until the child exits), recursive `grep -r` over `node_modules`, chains with `sleep` > 3 s. Detached dev servers start via a single redirect-free `Start-Process -WindowStyle Hidden`; readiness is verified in a separate quick command. A command that hits its timeout is a failed command.
- The `mock/` adapter (§66.10) is a dev-only phase artifact wired under `import.meta.env.DEV` in `apiSlice.js`; it never exists in a production build and is deleted at P7 (grep gate §66.10/§66.11) — not a runtime feature.
- `.opencode/` tracks only `plan/` and `skills/`; its `node_modules`/`package.json`/`bun.lock` are gitignored.

## Implementation & Re-implementation protocol (standing effort, started 2026-08-18; reoriented 2026-08-19)

The owner's standing instructions for this effort live in `prompt.md` (tracked, controlled document) and override habits and prior session behavior; they never override this file or the skills. The owner's live instructions in conversation override everything.

The strict protocol chain of this effort (owner directive, 2026-08-19):

```
Phase protocol (§66) + specs (.opencode/plan/*) + skills (.opencode/skills/*) + AGENTS.md + findings.md + progress.md + task_plan.md
  -> role agent = Supervisor + Software Architect/Engineer/UI-UX + Design Lead
  => implementation
  -> Postman-like tests until all green (backend only)
  -> phase-protocol step 5 (backend only: request to run the script to test and verify)
  -> document
  -> phase-protocol step 6
  -> ready for the next
```

- **Role model (owner's strict requirement, 2026-08-18):** the agent is the Supervisor AND the Software Architect/Engineer/UI-UX Designer AND the Design Lead, and makes the decisions. The owner is the interaction partner only — they review, add/remove what is presented, ask iterative questions, dig, and point out blind spots; they are not the Supervisor, not the Architect, and do not make decisions. Nothing waits on an owner decision; preferences/unknowns become §69 OQ rows.
- **Hard gate (owner directive, 2026-08-19):** unless the backend is completed, the frontend is never re-implemented. No `client/*` edits while the backend implementation (Stage 4, §15.4) is incomplete; the frontend is re-implemented and linked only after backend completion.
- **Per-phase flow (owner directive, 2026-08-19):** implement → Postman-like tests until all green (backend only) → phase-protocol step 5 (backend only: request to run the script to test and verify) → document → phase-protocol step 6 → ready for the next. **Step 5 = the owner runs the sub-phase verification script under `backend/scripts/` and watches every request/response JSON + PASS/FAIL line on the terminal (terminal-visible contract, §63.10); a sub-phase advances only on a fully green live run.**
- **Correction effort — closed record:** the correct-the-spec-then-rebuild correction phase is complete (51/51 DERIVED sections dispositioned, §63.9 audit C1–C6 green, sign-off §69.3.3, commit `7fb1580`); the coverage register in `task_plan.md` is the closed inventory. The Supervisor story gate and WH-battery transparency remain the practice whenever an implementation question needs derivation (§66.5).
- **Branch lifecycle:** all branches were merged to `main` on 2026-08-19 (owner directive — `merge: phase 4 frontend pages (close-out)`, `merge: spec-correction corrections + reorientation (close-out)`, `merge: stage 4 backend prep (implementation ready)`) and deleted from local and remote; **only `main` remains**. Subsequent implementation work branches from `main` per §9.8 (feature branches named `phase-N-description`); branch operations and every commit/push/merge/delete require explicit owner approval (§9.8 step 6).
- **No invented details:** unknown behavior is registered in §69 with `TODO(open)` — never silently invented, never argued in local prose. §66.5: standing instructions → corrected spec → logical reasoning → implementation; spec wins over habits.

## Git protocol (§9.8)

- Feature branches named `phase-N-description`; no direct commits to `main`.
- Commit format: `feat: phase N description` or `chore: phase N description`. No amending after push.

## Verify commands (§9.7)

- Backend syntax: `node --check` on every backend file.
- Client build: `npx vite build` — 0 errors, then **always delete `dist/*`**.
- Client lint: `npm run lint` (runs `eslint .`).
- Dev servers: client Vite on **port 3000** (`npm run dev`), backend nodemon `server.js` on **port 4000** (script added in P1 per §26).
- **No automated tests** — test frameworks are permanently excluded (§4.3, §13.6); verification is the manual gate system of §63.
- **Verification scripts (§63.10):** per-sub-phase Postman-style suites live in `backend/scripts/` (`test-<NN>-<name>.mjs`, Node 24 + built-in `fetch`, zero dependencies). Run: from `backend/`, `node scripts/test-<NN>-<name>.mjs` with the dev server on :4000. Every check prints to the terminal: the request (method + path) and, for HTTP checks, the response status + full JSON body, then a `PASS`/`FAIL` verdict per check; non-HTTP checks (model/schema, pure-function, sweeper, constants parity) print a labeled `MODEL CHECK` / `UNIT` / `SWEEPER` line with the same framing. Each suite ends with `PASS=N FAIL=M` and exits non-zero on any failure. Scripts write to stdout via `process.stdout.write` — no `console.log` literal (keeps the §9.5/§63.4 grep gate clean). Suites support `--only=<endpoint>` to run one endpoint's checks. **Restart the backend before each suite run** (the in-memory rate store resets on restart; 15-min global window).

## Non-negotiable exclusions (§13.6, §4.3)

No TypeScript, no Next.js/Remix, no Tailwind (MUI `sx`/`styled()` only), no zod (manual validators, §29), no automated test frameworks, no client-side AI SDKs or browser provider keys, no WebSocket/streaming deps, no S3/GridFS (audio stays in local `uploads/`). No dependency outside the §13.5 planned set unless its owning phase installs it (§66.8 uninstalled-behavior gate).

## Conventions that differ from defaults

- **Key doctrine:** primary key is `_id` everywhere; no `id` fields and no `.id` property access (§9.3).
- One module per file, no barrel files; kebab-case JS modules, PascalCase `.jsx` files named by their single exported component (§15.2).
- No `console.log` in the backend — Winston logger only (§9.5).
- No magic literals: all values come from `utils/constants.js` and `utils/httpStatus.js` (§11); `config/env.js` is the only reader of `process.env` (§10.3).
- No raw `fetch`/`axios` in the client outside `features/apiSlice.js` (§42.7).
- Naming: entities PascalCase, statuses lowercase enums, routes kebab-case, reusable components `Mui*`, constants UPPER_SNAKE_CASE, domain dates `DD-MM-YY`, times `HH:mm`.
- Uses `dayjs` throughout (no native `Date` formatting).

## Environment quirks (§10)

- `.env` files are gitignored and never committed; `.env.example` files are never created. Both `backend/.env` and `client/.env` exist locally.
- Provider API keys live **only** in `backend/.env` — never in client code, Vite env vars, `localStorage`, Redux state, or logs. Client env vars must be prefixed `VITE_` and read via `import.meta.env.*` only.