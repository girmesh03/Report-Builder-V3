# Plan to Create the Project Specification (Meta-Plan)

## 1. Purpose

This document governs the authoring of `.opencode/plan/project-specification.md`
(the "Specification"). It defines the deliverable, its sources of truth, the
authoring model, content rules, validation gates, and the final-assembly steps.
Every authoring decision must be justifiable against this plan; every section
of the Specification must pass the applicable checklist below before it is
considered complete.

## 2. Deliverable

- **File:** `.opencode/plan/project-specification.md`
- **Format:** Single Markdown document (UTF-8).
- **Content:** Complete PRD + PDS + SAD + HLD + LLD + SDD (no separate docs).
- **Length rule:** Exhaustive, not verbose. Every entity, endpoint, component,
  state, and value the implementation needs must appear. No placeholder sections.
- **Header:** Title, purpose, source-of-truth statement, cross-reference rule,
  "no invented details" rule.

## 3. Sources of Truth (priority order)

| # | Source | Usage |
| - | ------ | ----- |
| 1 | User's Basic App Information & requirements (this session) | Authoritative product behavior |
| 2 | `backend/package.json`, `client/package.json` | Package/version truth (manifest wins over notes) |
| 3 | User decisions during this session (e.g., Report schema, wizard steps, server-assigned `user`) | Locked decisions, non-negotiable |
| 4 | Addis AI public docs (addisassistant.com docs links) | Provider capabilities/limits |
| 5 | MUI docs conventions (MUI X Chat, community edition) | Frontend library usage |
| 6 | Notes in this session | Background only; conflicts resolved against 1–3 |

Conflict rule: when sources conflict, record the conflict in §12 and use the
higher-priority source; never silently merge.

## 4. Authoring Model

1. Work strictly in the section order of §6 (dependency-ordered).
2. Sections are authored one at a time; each completed section is appended to
   the Specification file.
3. Before writing each section: re-read all prior authored sections that it
   references (endpoints, models, components, states).
4. After each section: run the Section Checklist (meta §9) and state a one-line
   validation summary (e.g., "Cross-checked vs spec §15/§25: consistent").
5. Genuine unknowns are never invented: register in the Open Questions section
   (spec §69 / meta §12) and leave a visible `TODO(open)` marker in the section.
6. No renumbering of the outline after authoring begins. Renumbering is a
   full-document change requiring explicit user approval and a full
   cross-reference sweep.

## 5. Terms & Naming Standards (applied everywhere in the Specification)

- Entity names: singular PascalCase models (`Report`, `Transcription`).
- Statuses: lowercase enum values (`draft`, `audio_attached`).
- Providers: `addis`, `gemini`, `nvidia` (lowercase identifiers).
- Dates: Ethiopian `DD-MM-YY` numeric in the domain; ISO strings in transport
  where needed; UI always DD-MM-YY with English labels.
- Times: 24h `HH:mm`.
- Routes: kebab-case (`/reports/:id/transcribe`).
- Components: `Mui*` prefix for reusable; page components plain PascalCase.
- Constants: UPPER_SNAKE_CASE; every magic value must resolve to a constant.
- HTTP statuses: semantic names from `httpStatus.js` only.
- API shape: `{ success, message, data }`; paginated
  `{ success, message, data: { docs, page, limit, totalDocs, totalPages, ... } }`.

## 6. Section Outline (authoring order — the Specification's full tree)

> Renumbered after user approval (2026-08-08): the three sections
> **Standards & Conventions, Environment & Configuration, Constants & httpStatus**
> were inserted after §8, shifting every subsequent section by +2. This canonical
> version (69 sections) governs all authoring and references.

### Part I — Product (PRD)
1. Introduction, Background & Problem Statement
2. Goals, Objectives & Success Criteria
3. Scope, Users & Personas
4. Deferred Features & Non-Goals
5. Core Business Rules
6. Report Format Specification (Amharic structure, samples, single/multi-branch)
7. Language & Tone Requirements (transliteration, UI vs content language)
8. AI Behavior Rules (16 generation rules; correction rules; no-invent rule)

### Part II — Standards & Configuration (SDD)
9.  Standards, Conventions & Code Style (ESM-only, import order, JSDoc, naming, magic-value ban, no-console rule, MUI conventions, code hygiene checks, git protocol summary)
10. Environment & Configuration (env vars both sides, `config/env.js`, `.env` policy, no `process.env` outside env.js, VITE_ prefix)
11. Constants & httpStatus (backend `utils/constants.js`, client `src/utils/constants.js`, `utils/httpStatus.js`, freeze rule, no-magic rule)

### Part A — Architecture (SAD/HLD)
12. System Architecture Overview (diagrams + sequence: record → upload → STT → review → generate → correct → export)
13. Technology Stack & Versions (manifests as truth; JS-only; community MUI; incl. planned deps from meta 9.5.2: @tiptap/react, dompurify)
14. ADR Index (ADR-001 … 038: rich-text editor = TipTap + DOMPurify)
15. Project Structure (backend/ and client/ file trees)
16. AI Provider Integration Architecture (Addis/Gemini/Nvidia; proxy rule; fallback chain)
17. Data System Overview (ERD + relationships + cascade map)

### Part B — Data & Persistence (PDS)
18. Data Model Conventions (timestamps, transforms, indexes, TTL, sessions)
19. User Model
20. Branch Model
21. Report Model (**locked schema** from user decision)
22. Audio Model
23. Transcription Model
24. ChatConversation Model
25. Validation Rules & Mock Data

### Part C — Backend (PDS/LLD)
26. Backend Foundation (config, logger, server boot, graceful shutdown, middleware stack, routes wiring, health)
27. Global Backend Concerns (CustomError, global handler, envelope/DTO, pagination, rate limits, sanitize, transactions)
28. Authentication & User Domain (JWT 2-token, cookies, rotation, Google OAuth stub, profile)
29. Validators (all domains; 422 shape)
30. Branch API
31. Report & Status API (status machine; guards; cascade delete; transactions; correction endpoints: PATCH content, POST correct, POST voice-correction)
32. Audio Upload & Storage (multer, 'clips', validation, temp cleanup)
33. STT Pipeline (ffmpeg → wavSplitter → Addis AI; retries; re-transcription; aiCorrectedText)
34. AI Report Generation Service (prompts, config, providers, parsing)
35. AI Correction Service (Mode 2 typed + Mode 3 voice-transcribed instructions; temperature, partial-edit approach; accept→save flow)
36. AI Chat & Conversation API
37. Export API (Google Docs; drive.file scope; server-side token)
38. Analytics API
39. Global Search API
40. Mock Data & Seeding

### Part D — Frontend (HLD/LLD)
41. Frontend Foundation (main.jsx, App.jsx, guards, route map, RTK/injectEndPoints)
42. Frontend Network Layer (baseQueryWithReauth; error normalization)
43. Design & Theme System (AppTheme, typography incl. Ethiopic, color schemes)
44. Theme & Component Customizations (inputs…charts; CSS variables)
45. Responsive System (breakpoints; icon-only rule; ellipsis/overflow)
46. MUI Reusable Component Library (full LLD: Button, TextField, Select, Dialog, ConfirmDialog, DataGrid, DatePicker + ethiopianDate, Pagination, StatusBadge, PageHeader, LoadingSpinner, GlobalSearchDialog, Appbar-sidebar, MuiEditor (TipTap; Bold/Italic/FontSize/TextColor; DOMPurify))
47. Layout System (PublicLayout, AppShell, MuiAppbar, AppSidebar, GlobalSearchDialog behaviors)
48. Pages — Auth (Landing, Login, Register)
49. Page — Dashboard & Analytics UI (KPI cards, charts)
50. Page — Reports List
51. Page — Report Details
52. Page — Report Creation Wizard (Steps 1–5 subsections)
53. Audio Recording UX (useAudioRecorder hook, clip list, MIME priority, limits; recording reused for Mode 3 voice-correction clips)
54. Transcription Review UX (Mode 1 editor + Save; Mode 2 instruction+provider+Accept/Revert; Mode 3 record→fill→correct)
55. AI Correction Chat UI (MUI X Chat integration)
56. Page — Branches
57. Page — Profile
58. Export UI (PDF/TXT/CSV/XLSX client-side flows)
59. 404 Page

### Part E — Cross-Cutting
60. Frontend Universal UX Spec (states protocol, toasts, error boundary)
61. Security & Reliability Requirements (incl. XSS: rich-text HTML sanitization policy)
62. Sweeper, TTL & Data Retention
63. Testing & Verification Strategy
64. Performance & Scale (large uploads, concurrency)

### Part F — Delivery
65. Deployment & Operations
66. Implementation Phases (8 phases)
67. Risks & Mitigation
68. Glossary
69. Open Questions & Assumptions (registry)

## 7. Content Rules (per section)

- **Exhaustiveness:** all fields, types, validation, defaults, error codes,
  UI states (loading/empty/error/success), responsive behavior, edge cases.
- **No invention:** unknown behavior → §69 Open Questions register, not prose.
- **No magic values:** every literal maps to a named constant (spec §11)
  or `config/env.js` (spec §10).
- **Consistency:** names must match the meta §5 vocabulary exactly.
- **Verifiability:** every API endpoint must state: method, path, auth,
  request body/query/params schema, success response shape, error responses
  (with codes), rate-limit tier, transaction usage (write = session).
- **Component rule:** Every UI element must state: file path, props table,
  states, API calls, validation, responsive behavior.
- **State rule:** Every page/component must enumerate loading, empty, error,
  success, and edge states (ADR-033).

## 8. Cross-Reference & Consistency Validation Rules

1. **Endpoint–backend consistency:** every endpoint referenced in frontend
   sections must exist in an API section with identical method/path/body.
2. **Model–API consistency:** API payload fields must match model fields or be
   DTO-mapped via the response transform layer.
3. **Status–guard consistency:** status transitions defined in spec §31 must be
   the only transitions used in wizard steps (§52) and details actions (§51).
4. **Provider–constants consistency:** provider ids in prompts/configs must
   match `AI_PROVIDERS` in spec §11 constants.
5. **Component–layout consistency:** components referenced in pages must exist
   in spec §46; layouts referenced in pages must exist in spec §47.
6. **Constants–usage consistency:** every magic value used in any section must
   have a home in spec §11 (or §10 env table).
7. **Archive lifecycle consistency:** archive/restore/delete guard rules (API
   sections) must match TTL/sweeper rules (30 days, 2592000 s).
8. **Numbering integrity:** internal references always cite the section number;
   after any renumbering, a full sweep is mandated.
9. **Checklist pass:** authoring is complete only when the corresponding
   meta §9 checklist passes.
10. **Correction-mode consistency:** all three modes authorized in exactly this
    shape (meta 9.5.1); rich text HTML must be DOMPurify-sanitized on both save
    and render (meta 9.5.2); PATCH/POST routes must match the spec §31 endpoint table.

## 9. Section Type Checklists

### Checklist A — Model sections (spec §19–§24)
- [ ] Mongoose schema code block with exact fields/types/defaults/enums
- [ ] `@typedef` field table with types and descriptions
- [ ] Indexes via `schema.index` (no duplicate unique+index)
- [ ] TTL note where relevant
- [ ] toJSON/toObject transform rules
- [ ] Session-aware instance/static methods listed
- [ ] Validation rules table (per field)
- [ ] Consistency: matches locked schemas (esp. Report §21)

### Checklist B — API sections (spec §30–§39)
- [ ] Endpoint table: method, path, auth, rate tier, transaction flag
- [ ] Request schema (JSON code block with example values)
- [ ] Response envelope per meta §5 shape
- [ ] Error responses mapped (codes + user-facing messages)
- [ ] Status guards and lifecycle guards where applicable
- [ ] Cross-check: every endpoint referenced later

### Checklist C — Page/Component sections (spec §46–§59)
- [ ] File path (`client/src/...`)
- [ ] Purpose & route (for pages)
- [ ] Element-by-element spec (component name, props, state)
- [ ] API calls list (each endpoint exists in Part C of the spec)
- [ ] Validation rules and error display
- [ ] Loading/empty/error/success states
- [ ] Responsive behavior per breakpoint (xs/sm/md/lg/xl + landscape)
- [ ] Edge cases table
- [ ] Cross-check: component/layout/endpoint references

### Checklist D — Cross-cutting sections (spec §60–§64)
- [ ] Derived from and consistent with the prior authored sections
- [ ] Quantified (seconds, bytes, limits) — no prose-only values

## 9.5 Canonical Feature Definitions (author any referenced section against these)

### 9.5.1 Correction & Edit Modes (Report text & Transcription)
Applies to spec §31, §35, §46 (MuiEditor), §53, §54. Three modes, one accept model.

**Mode 1 — User Direct Edit**
- User edits the rich text area (MuiEditor, see 9.5.2) → clicks "Save".
- `PATCH` only; no AI involvement. Persists current text.

**Mode 2 — AI Correction (typed instruction)**
- User types an instruction (e.g. "Fix the branch names") → selects provider → clicks "Correct".
- Request: `{ text, instruction, providerId }` → backend forwards raw text + instruction to
  the chosen AI provider → returns corrected text (not yet saved).
- Frontend shows the corrected result in the MuiEditor preview → user clicks "Accept" or "Revert".

**Mode 3 — Voice Correction**
- User clicks "Record correction" → records a short audio clip → stops.
- Request: `multipart/form-data` with `audio` blob (uploaded via multer, spec §32).
- Backend: STT via Addis AI (spec §33) → returns transcribed instruction text.
- Frontend fills the instruction field → user selects provider → continues exactly as Mode 2.

**Accept model (locked decision 2026-08-08):**
- "Accept": `text = aiCorrectedText` (AI output kept stored) + one-click "Revert to original"
  button shown while `aiCorrectedText` exists.
- Next correction overwrites the slot = single-undo, no revision-history model.
- Does NOT pre-empt OQ-001 (future version history remains open).
- Correction is a preview round-trip; only Accept persists (write = session, rule §7).

### 9.5.2 Rich Text Editor (component: `MuiEditor`)
- Library: **TipTap** + **DOMPurify** (React 19.2-compatible, headless = MUI-themed toolbar,
  schema-based XSS safety). Recorded as ADR-038.
- Toolbar (initial scope, fixed): **Bold, Italic, Font size, Text color**. Extendable later.
- Storage: **HTML string** (sanitized with DOMPurify on write AND render;
  `dangerouslySetInnerHTML` only post-sanitize). Feeds spec §37 Google Docs / §58 exports directly.
- No JSON-doc storage; Ethiopic text inherits the theme (spec §43); plain CSS styles apply.
- Shared editing surface: Modes 1–3 (spec §54) and Report content edit (spec §51).
- Deps: `@tiptap/react` + `dompurify` (planned additions; §13 manifests then include them).

## 10. Final Assembly Steps

1. Generate Table of Contents (all sections + subsections).
2. Full cross-reference sweep per §8 rules; fix broken references; resolve remaining conflicts.
3. Sweep for `TODO(open)` markers; fold resolved items into the sections.
4. Run completeness check against the outline (§6) — no missing sections.
5. Present final document for user review.

## 11. Validation Checklist (final document)

- [ ] All outline sections present, ordered per §6
- [ ] All internal references point to existing sections
- [ ] Locked decisions honored (Report schema, server-assigned user, wizard steps)
- [ ] No magic values without a constants home
- [ ] No numeric status codes in prose/controllers (semantic names only)
- [ ] All endpoints in Part C; all page API calls match them
- [ ] Status machine used identically everywhere
- [ ] Provider ids identical across spec §16/§34/§35/§36
- [ ] Archive lifecycle identical in lifecycle rules and API sections
- [ ] DTO/transformers consistent with response envelope
- [ ] Every UI surface has loading/empty/error/success
- [ ] Rich-text HTML sanitized on write AND render (DOMPurify; no raw innerHTML)
- [ ] Modes 1–3 flows consistent across spec §31/§35/§46/§53/§54
- [ ] Voice-correction upload reuses spec §32 multer validation; instruction field auto-filled
- [ ] Open Questions register complete (run documents, empty or resolved)

## 12. Open Questions Register

| ID | Section(s) | Question | Status |
| -- | --- | --- | --- |
| OQ-001 | spec §21 | Where do generated report content + version history live? (Embedded in Report per ADR-005 vs separate model?) | OPEN |
| OQ-002 | spec §21 | Required vs optional `clockIn`/`clockOut` at model level | OPEN |
| OQ-003 | spec §65 | Deployment target (hosting, domain, prod Mongo) | OPEN |
| OQ-004 | spec §37 | Google OAuth: real integration vs stub | OPEN |
| OQ-005 | spec §49 | Exact dashboard KPI set & charts | OPEN |
| OQ-006 | spec §58 | Export file naming convention | OPEN |
| OQ-007 | spec §21, §54 | Rich-text HTML persisted on Report content vs locked Report schema? (sanitize-on-store, DOMPurify; related to OQ-001) | OPEN |

Rule: OQ-001/2/7 block spec §21 finalization only; all others must not block authoring.