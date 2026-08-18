# AGENTS.md

## Repository status

Report Builder V3 — Amharic daily-supervision report builder. Two components: `backend/` (Express 5 + Mongoose 9, ESM) and `client/` (Vite + React 19 + MUI v9 + RTK).

The implementation runs on the §66 phases: **phases 1 (foundations) and 2 (design system) are complete and merged to `main`; phase 3 (frontend foundation & network) is complete and merged** (one close-out commit `chore: phase 3 close-out audit`, §9.8). **Phase 4 (frontend feature pages) is in progress on `phase-4-frontend-pages`**: the network endpoint layer (§42.6), the §49 dashboard, the §50 reports list (with the provisional OQ-009 filter dialog, the md+ List/Cards toggle, cards-only below md, per-`isArchived` actions, and the removed page-header eyebrow), and the owner R3-fix review (14 points) **plus its 5-point follow-up round** (eyebrow removal, one-line page header, the session `userId`/redirect-bounce fix — `startSessionForUser` now writes the merged session back to `activeSession` — the `expireSession` SPA redirect, mock TTLs mirroring §28, chart-value finite guards, and the MUI v9 `slots.transition` dialog fix) **plus its 7-point UX pass with the 3 re-opens closed** (search clear button hidden when empty via the unwrapped-adornment sibling rule, one-line header with the action group in the `actions` slot, the ReportCard two-row footer — caption line + right-aligned action row below, the explicit LineChart y-domain killing the `<path>` NaN, fullscreen dialogs radius 0, xs pagination compact, and the removed `slotProps` on `MuiPagination` — MUI v9.3 Pagination has no slots support and leaked it to the DOM root) are complete; the remaining rounds are the §52 wizard + editor install, §51 details, §54 correction, §55 chat, §56 branches, §57 profile, §58 exports, and the close-out audit. The backend holds the P1 foundation only (`config/env.js` frozen env, `utils/constants.js`, `utils/httpStatus.js` — no Express source yet; the `dev`/`start` scripts already point at `server.js`, a §15.4-listed P6 file, so backend `npm run dev` fails until P6). The client holds the P3 deliverables: entry & routing (ADR-025 lazy pages, static guards), the RTK Query network layer with reauth (`redux/features/apiSlice.js`, §42), the §48 auth pages and the round-9 landing composition (cardless ruled-desk hero with the persisting §43.2 waveform, branches strip, how-it-works, CTA band — provisional under OQ-008, §69), the §60 toast surface, and the dev-only mock adapter (`mock/`, §66.10 — deleted at P7). `App.jsx` is the composed root node (theme → baseline → toast → error boundary → Outlet, §41.4). The canonical target trees are §15.4 (backend) and §15.5 (client); follow them when creating files.

## Single source of truth

`.opencode/plan/project-specification.md` (≈12k lines) is the authoritative statement of behavior and design (PRD+PDS+SAD+HLD+LLD+SDD in one document). Package manifests are the version source of truth (§13). Nothing else decides behavior (§66.5: standing instructions → spec → logical reasoning → implementation; spec wins over habits).

- **No invented details rule:** unknown behavior is registered in §69 (Open Questions) and marked `TODO(open)` — never silently invented.
- Cross-references cite this document's section numbers only.

## Working protocol

- Execution follows §66 phases. Each phase runs the §66.2 six steps in order; step 6 (commit/push/merge) never runs without explicit user approval.
- §66.3 working files (`task_plan.md`, `findings.md`, `progress.md`) are mandated by the spec — use the repo's `planning-with-files` skill (`.opencode/skills/planning-with-files/`) for these. The `frontend-design` skill (`.opencode/skills/frontend-design/`) is the standing UI practice for every frontend task (§66.4).
- **Same-change discipline (§66.6):** a change to a shared source of truth updates its mirrors in the same commit — §15.4/§15.5 tree with sections naming files, §13 manifests with installs/removals, §14.3 ADR index, §11 constants with consumers.
- The `mock/` adapter (§66.10) is a dev-only phase artifact wired under `import.meta.env.DEV` in `apiSlice.js`; it never exists in a production build and is deleted at P7 (grep gate §66.10/§66.11) — not a runtime feature.
- `.opencode/` tracks only `plan/` and `skills/`; its `node_modules`/`package.json`/`bun.lock` are gitignored.

## Correct-the-Spec-Then-Rebuild protocol (standing effort, started 2026-08-18)

The owner's standing instructions for this effort live in `prompt.md` (tracked, controlled document) and override habits and prior session behavior; they never override this file or the skills. The owner's live instructions in conversation override everything.

- **Role model (owner's strict requirement, 2026-08-18):** the agent is the Supervisor AND the Software Architect/Engineer/UI-UX Designer, and makes the decisions. The owner is the interaction partner only — they review, add/remove what is presented, ask iterative questions, dig, and point out blind spots; they are not the Supervisor, not the Architect, and do not make decisions. Nothing waits on an owner decision; preferences/unknowns become §69 OQ rows.
- **Supervisor user-story gate:** every user story the Supervisor identity enumerates is presented to the owner one by one for add/remove before the Architect answers it.
- **Architect WH-battery transparency:** every WH question of the Architect's battery is presented to the owner before answers are derived.
- **Coverage register (task_plan.md):** the 51 DERIVED sections are tracked with a per-section status — not-started / in progress / closed (re-derived | audited-no-change | escalated) — plus an explicit NEXT pointer. A pass closes only when its closed section list is closed, never when the stories run out. Stage 3 requires 51/51 dispositions, zero partials, zero `TODO(open)` without an §69 row.
- **Freeze rule:** no `backend/*` and no `client/*` edits while `.opencode/plan/project-specification.md` is not fully corrected (prompt.md Stage 3 hard gate). After the spec is fully corrected, re-implementation starts backend-first.
- **Branch lifecycle:** all spec-correction work happens on `spec-correction`; when the spec is fully corrected, a new branch is created for re-implementation and `spec-correction` is deleted. No commit/push/merge/delete without explicit owner approval (§9.8 step 6).
- **Correction scope (5-file rule):** spec corrections are applied to `.opencode/plan/project-specification.md`; this file, `prompt.md`, and the §66.3 working files are corrected in the same change set **iff** something in them needs correcting (same-change discipline, §66.6).
- Current state (2026-08-18): Stage 1 (kernel classification, 18 KERNEL / 51 DERIVED) closed; Stage 2 pass 1a (data model §17–§24A) closed; pass 1b (architecture: §11, §12, §14, §15, §16) is NEXT.

## Git protocol (§9.8)

- Feature branches named `phase-N-description`; no direct commits to `main`.
- Commit format: `feat: phase N description` or `chore: phase N description`. No amending after push.

## Verify commands (§9.7)

- Backend syntax: `node --check` on every backend file.
- Client build: `npx vite build` — 0 errors, then **always delete `dist/*`**.
- Client lint: `npm run lint` (runs `eslint .`).
- Dev servers: client Vite on **port 3000** (`npm run dev`), backend nodemon `server.js` on **port 4000** (script added in P1 per §26).
- **No automated tests** — test frameworks are permanently excluded (§4.3, §13.6); verification is the manual gate system of §63.

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