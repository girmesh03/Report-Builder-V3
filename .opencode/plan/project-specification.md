# Report Builder V3 — Project Specification

> **Document type:** Complete PRD + PDS + SAD + HLD + LLD + SDD in a single document.
> Every section of this specification passes its applicable content rules and
> checklists before being considered complete.
>
> **Single source of truth:** this document is the authoritative
> statement of product behavior and technical design. Package manifests
> (`backend/package.json`, `client/package.json`) are the version source of
> truth (§13). Behavior not decided here is registered in §69 (Open
> Questions), never invented.
>
> **No invented details rule:** any unknown behavior is registered in §69
> (Open Questions) and marked `TODO(open)` in its section — never silently invented.
>
> **Cross-reference rule:** all internal references cite this document's section
> numbers and resolve within this document only.
>
> **Naming rules:** entities PascalCase; statuses lowercase enums; providers
> `addis`/`gemini`/`nvidia`; dates Ethiopian `DD-MM-YY` in domain data; times 24h `HH:mm`;
> routes kebab-case; reusable components `Mui*`; constants UPPER_SNAKE_CASE;
> HTTP statuses by `httpStatus.js` semantic name.
>
> **API envelope:** `{ success, message, data }`; paginated
> `{ success, message, data: { docs, page, limit, totalDocs, totalPages, ... } }`.

## Table of Contents

*(Each heading links to its section; the list is generated at final assembly.)*

<!-- TOC injected automatically during controlled builds -->

---

## 1. Introduction, Background & Problem Statement

### 1.1 Product Overview

Report Builder V3 is an intelligent web-based report-building system for daily
supervision reporting in a restaurant company network. It lets an Area
Supervisor record Amharic audio describing the workday's supervision activities
and receive a boss-ready, professionally structured Amharic daily supervision
report with minimal manual effort.

- **User:** the Area Supervisor is the single user type. There is no
  role-based access control (ADR-036). Users — profiles, registration, and
  authentication — are specified in spec §19 and §28; scope and personas in §3.
- **Operating context:** a restaurant company with more than 14 branches in
  Addis Ababa, Ethiopia. A working day may cover one branch or several
  branches; the report must support both cases (§6).
- **Core promise:** eliminate the dependency on manually writing daily
  supervision reports with conventional document editing tools. The
  supervisor speaks the day in Amharic; the system transcribes, organizes,
  and formats it into the required report structure.
- **Platform & stack:** MERN-style web application — Node.js, Express,
  MongoDB/Mongoose, React. JavaScript only. Web-only (no native mobile apps).
  Technology stack and versions: §13.

**Document map.** This specification covers, in order: goals and success
criteria (§2), scope and users (§3), deferred features (§4), core business
rules (§5), the report format (§6), language and tone requirements (§7), AI
behavior rules (§8), standards and conventions (§9), environment and
configuration (§10), constants (§11), and the system architecture (§12). Data,
backend, and frontend detail follows in later parts.

### 1.2 Background

#### 1.2.1 The daily supervision role

An Area Supervisor is responsible for visiting one or more branches every
working day to:

- monitor daily operations;
- evaluate compliance with company standards;
- identify operational issues;
- provide guidance to branch teams; and
- ensure that corrective actions are implemented.

During each branch visit the supervisor performs a set of routine activities:

1. check daily operational activities;
2. check cleanliness;
3. check employee readiness;
4. follow the checklist;
5. observe urgent branch problems;
6. communicate with staff or responsible people;
7. follow up on previously reported issues;
8. take action or give instructions;
9. form an opinion about branch performance;
10. identify things that need immediate attention;
11. identify things that can make the branch better.

#### 1.2.2 The end-of-day reporting obligation

At the end of every working day the supervisor must produce a report that
explains: the date, the branch (or branches), working time, completed
activities, unresolved issues, the general opinion, and the work exit time.

#### 1.2.3 Current process

The existing process depends on manual writing using Telegram, WhatsApp,
Microsoft Word, and Google Docs:

- The supervisor returns home after the working day and prepares the report
  manually.
- The day's activities must be recalled from memory and reconstructed at the
  end of the day.
- Spoken explanations are natural, conversational narrations; they do not
  follow the final report order, and the information they contain is
  unorganized.
- Manually transforming this unorganized narration into the required report
  structure is labor-intensive, mentally demanding, time-consuming, and
  error-prone: omissions, inconsistencies, formatting errors, and
  inaccuracies are common.

There is also no centralized system for managing supervision records:

- Branch information, daily supervision reports, transcriptions, generated
  reports, AI conversations, and historical records are kept separately or
  manually.
- Organizing, searching, updating, retrieving, and reviewing previous reports
  is difficult.
- Managing records across multiple branches over an extended period becomes
  increasingly difficult, which reduces operational efficiency, limits
  historical-performance monitoring, slows recurring-issue identification,
  and weakens informed decision-making.

#### 1.2.4 The Amharic-language gap

Existing speech-to-text and artificial-intelligence solutions provide limited
support for Ethiopian languages, particularly Amharic. This makes it
difficult to transcribe spoken supervision narration accurately and to
produce professional reports with the linguistic accuracy required for
business reporting.

Addis AI is selected as the STT provider because it is specialized in the
Amharic language (provider integration: §16) and is expected to produce more
accurate transcription and report generation than general AI tools that do
not focus on Ethiopian language use cases. The conversation language in the
recorded audio is always Amharic.

### 1.3 Problem Statement

The following problem set defines what the system must solve:

| # | Problem | Consequence |
| - | ------- | ----------- |
| P1 | Reports are prepared manually after the working day | After-hours labor; reduced personal time |
| P2 | The day must be reconstructed from memory | Missed details and inaccuracies |
| P3 | Supervision activities are unstructured narration | Manual conversion cost |
| P4 | Reports are formatted manually to the required structure | Inconsistency; formatting errors |
| P5 | No automation of audio-to-report transformation | Rewriting of information the supervisor already stated verbally |
| P6 | Multi-branch days require per-branch time ranges | Complex formatting; error-prone |
| P7 | No centralized system for branches, reports, transcriptions, AI conversations, and history | Weak organization, search, retrieval, and review; limited trend monitoring and accountability |
| P8 | General STT/AI tools support Amharic poorly | Reduced transcription accuracy; slower adoption of AI-assisted reporting |
| P9 | No tooling supports mid-day capture | Post-day recall; submission delays |
| P10 | No built-in multi-format export | Dependence on external tools (Word, Google Docs, ...) |

**Aggregate impact.** The existing process reduces productivity, consumes
valuable personal time outside working hours, delays report submission,
introduces inconsistencies in report quality, and increases administrative
workload. Supervisors repeatedly perform routine documentation tasks that
could otherwise be automated.

**Therefore.** There is a need for an intelligent web-based system that
eliminates the dependency on manually writing daily supervision reports: the
supervisor records one or more Amharic audio narrations describing the day's
supervision activities (regardless of whether the narration is structured or
conversational); the system transcribes the audio, lets the supervisor review
and correct the transcription, uses an AI model optimized for Amharic to analyze
it, and automatically generates a professional, well-structured daily
supervision report that follows the organization's reporting format. The
supervisor may review the generated report and request corrections;
corrections update only the relevant parts of the report and never rewrite
correct unrelated sections. The system must additionally provide centralized
management of branches, daily reports, transcriptions, generated reports, AI
conversations, user profiles, and reporting analytics,
and must export reports in multiple formats (PDF, TXT, CSV, XLSX, and Google
Docs).

### 1.4 Solution Objectives

- **Record.** The supervisor records one or more audio clips per day from the
  browser (§53).
- **Transcribe.** The audio is transcribed with Amharic speech-to-text via
  Addis AI (§33). The transcription is raw material only — it is not the
  final report.
- **Review and correct.** The supervisor reviews the transcription and may
  edit it directly, request an AI correction (typed instruction or voice
  instruction), or re-run the pipeline to verify accuracy (§54). Correction
  modes: Mode 1 — direct edit + Save; Mode 2 — typed instruction + provider +
  Correct (content model: `raw` holds the original content, written once;
  `latest` holds the current content, initialized to `raw` on creation;
  Accept fixes `latest` as the accepted content; a one-click "Revert to
  original" copies `raw` back into `latest` while they differ; the next
  correction overwrites `latest` — single-undo, no revision history);
  Mode 3 — voice correction (record → STT → fills the instruction field →
  Mode 2).
- **Generate.** The AI turns the captured form metadata (header values) and
  the reviewed transcription (body content; fallback for missing metadata)
  into the structured Amharic report (§6, §34) and rules §8.
- **Review and correct.** After generation, the supervisor reviews the report
  and may request corrections; correction updates only the relevant parts of
  the report and never rewrites correct unrelated sections (§35, §54).
  Correction modes per §1.4.
- **Version.** Generated content is editable after generation; content
  lives on the report row as the `raw`/`latest` pair (BR-11) — no
  version chain (§21).
- **Export.** Reports are exportable as PDF, TXT, CSV, and XLSX (client-side)
  and to Google Docs (backend-side; the user's own Google Drive) (§37, §58).
- **Centralized management.** Branches, reports, transcriptions, AI
  conversations, and analytics are managed from one application (§17, Part C,
  Part D).
- **Language.** Amharic is first-class; English or technical workplace words
  use Amharic workplace transliteration (e.g. `deep fryer` → `ዲፕ ፍራየር`);
  no forced translation. Language and tone requirements: §7.

Goals, objectives, and measurable success criteria: §2. Deferred features
(text-to-speech, realtime processing, native mobile apps, role-based access,
automated translation) are out of scope for this version: §4.

### 1.5 System Overview

One user (the Area Supervisor) drives the system loop: record audio clips →
upload → speech-to-text transcription (Addis AI) → review and correct the
transcription (direct edit, typed instruction, voice instruction, or
re-transcription; correction modes per §1.4) → AI report generation in the
required Amharic format → review and correct the generated report (direct
edit, typed instruction, or voice instruction; correction modes per §1.4)
→ accept → export
(PDF/TXT/CSV/XLSX client-side; Google Docs backend-side). The persisted
entities are User, Report, Branch, Transcription, Audio, and
ChatConversation (models §19–§24). System architecture, components, and data
flow: §12; AI provider integration: §16.

### 1.6 Report Format Summary

The generated report follows this Amharic structure. Two format types exist:
**Type 1 — single branch** and **Type 2 — multiple branches**.

**Type 1 — Single branch**

```text
ቀን: [ቀን]
ብራንች: [ብራንች ስም]
ስም: [ሙሉ ስም]
ስራ የገባሁበት ሰዓት: [ሰዓት]

የተሰሩ ስራዎች:
 - [ስራ 1]
 - [ስራ 2]

መፍትሄ የሚፈሉ ጉዳዮች:
 - [ችግር 1]
 - [ችግር 2]

አጠቃላይ አስተያየት:
 - [አስተያየት 1]

ከስራ የወጣሁበት ሰዓት: [ሰዓት]
```

In Type 1 the work-start time (ስራ የገባሁበት ሰዓት) is a single line.

**Type 2 — Multiple branches**

```text
ቀን: [ቀን]
ብራንች: [ብራንች 1] / [ብራንች 2] / ...
ስም: [ሙሉ ስም]
ስራ የገባሁበት ሰዓት:
ከ[ሰዓት ጀምር] - [ሰዓት ጨርስ] [ብራንች 1] ብራንች
ከ[ሰዓት ጀምር] - [ሰዓት ጨርስ] [ብራንች 2] ብራንች

የተሰሩ ስራዎች:
 - [ስራ 1]
 - [ስራ 2]

መፍትሄ የሚፈሉ ጉዳዮች:
 - [ችግር 1]
 - [ችግር 2]

አጠቃላይ አስተያየት:
 - [አስተያየት 1]

ከስራ የወጣሁበት ሰዓት: [ሰዓት]
```

In Type 2:

- The ብራንች line lists all visited branches joined with `/`.
- The ስራ የገባሁበት ሰዓት section shows one time-range line per branch:
  `ከ[HH:mm] - [HH:mm] [branch name] ብራንች`.

Exact rules, validation, and full samples (including multi-branch examples and
transliteration examples): §6 — this section is a summary only. No branch names
or person names from the sample data are repeated here; they belong exclusively
to the sample reports in §6.

### 1.7 Language & Tone Statement

- The entire application interface — app shell, navigation, labels, buttons,
  validation messages, helper text — is **English**.
- Audio, transcription, AI chat, and report content may be Amharic, English,
  or mixed; the system does not force translation unless the user explicitly
  chooses it.
- The conversation language in the recorded audio is always Amharic.
- English and technical workplace terms must be represented in natural
  Amharic workplace transliteration, not literal translation and not raw
  English spelling (e.g. `deep fryer` → `ዲፕ ፍራየር`). Full language rules: §7;
  AI prompt rules: §8.
---

## 2. Goals, Objectives & Success Criteria
### 2.1 Primary Goal

Report Builder V3 has two primary, product-defining goals:

1. **Speak-and-report.** Enable an Area Supervisor to record Amharic audio
   describing daily supervision activities and receive a boss-ready,
   professionally structured Amharic daily supervision report with minimal
   manual effort.
2. **Eliminate manual report writing.** Eliminate the dependency on manually
   writing daily supervision reports with conventional document editing
   tools (Microsoft Word, Google Docs, Telegram, WhatsApp) and transform the
   reporting workflow from manual documentation into an AI-assisted digital
   process.

### 2.2 Supporting Goals

| Goal | Intent (source basis) | Traced to |
| ---- | --------------------- | --------- |
| G1 | Accurate Amharic transcription — the foundation of the entire product (§2.4 SC-1) | §33 (Addis-only STT — ADR-001; ffmpeg+wavSplitter chunking — ADR-007) |
| G2 | Structured report generation that follows the organization's report format | §6, §34, §8 |
| G3 | Corrections that update only the relevant parts of the report, never rewriting correct unrelated sections | §35, §54 (modes per §1.4) |
| G4 | Reports remain editable after generation, with the current content preserved | `raw`/`latest` content model (BR-11; §21) |
| G5 | Full support for supervision across multiple branches in a single working day (per-branch time ranges) | §6 (Type 2), §21 |
| G6 | Centralized management of branches, daily reports, transcriptions, generated reports, AI conversations, user profiles, and reporting analytics in one application | §17, Part C, Part D |
| G7 | Export in multiple formats: PDF, TXT, CSV, XLSX (client-side) and Google Docs (backend-side, user-owned Drive documents) | §37, §58 |
| G8 | Amharic treated as a core language requirement, not an optional feature; English/technical words in common Amharic workplace transliteration | §7, §8, §5 |
| G9 | A verified transcription workflow: review, correction, and re-transcription on every recording | §33, §54 |

### 2.3 Objectives

The system must deliver the following verifiable capabilities:

- **Transcribe.** Record one or more Amharic audio clips from the browser
  (§53) and produce an Amharic transcription via Addis AI STT (§33). The
  transcription is raw material — never the final report.
- **Review and correct.** Allow the supervisor to review the transcription,
  edit it directly, request AI correction (typed or voice instruction), or
  re-transcribe to verify accuracy (§54; modes per §1.4).
- **Generate.** Generate the structured Amharic report — single-branch (Type 1)
  or multi-branch (Type 2) — from the captured form metadata (header values)
  and the reviewed transcription (body content; also the fallback for missing
  metadata), following §6 and the §8 rules.
- **Review and correct after generation.** Review the report and apply
  corrections to the relevant part only; correct unrelated content must
  remain unchanged (§35, §54).
- **Version.** Keep the generated content editable after generation;
  the current content (`latest`) is preserved and `raw` keeps the
  original (raw/latest model — BR-11; §21).
- **Export.** Export without leaving the application: PDF, TXT, CSV, XLSX
  (client-side) and Google Docs directly in the user's own Google Drive with
  the user's own OAuth token (backend-only; drive.file scope) (§37, §58).
- **Management.** Manage branches, reports, transcriptions, AI conversations,
  user profile, and analytics from one web application
  (§17, Part C, Part D).
- **Platform.** Remain a web-only, JavaScript-only, MUI community-edition
  application — no native mobile apps, no TypeScript, no Next.js, no
  Tailwind (see §9, §13).

### 2.4 Success Criteria

**SC-1 — Transcription accuracy is the foundation (blocking).**
Accurate transcription is the foundation of the entire product. Every
subsequent step — AI report generation, export, review — depends on it.
"Garbage transcription produces garbage reports." All implementation
decisions (chunking strategy, format conversion, MIME types, error handling,
provider selection) prioritize transcription accuracy over convenience,
performance, or code simplicity, which must still be excellent
(technical enforcement: §33 — ffmpeg+wavSplitter chunking, ADR-007).

- Any change to the STT pipeline (chunking, format conversion, MIME type,
  language code, provider endpoint) that degrades transcription quality is
  **a blocking defect** and must be reverted immediately.
- Accuracy must be verified with real Amharic audio before merging.
- Re-transcription is available on every audio recording for verification.

**SC-2 — Report output matches the format and tone.**
The generated report matches the §6 format skeleton (Type 1 or Type 2),
follows the §8 rules (including the no-invent rule: missing dates, branch
names, times, actions, people, problems, or opinions are left blank or marked
not specified — never fabricated), uses the tone of the provided samples, and
is written from the supervisor's point of view.

**SC-3 — Corrections are surgical.**
A user correction (typed or voice instruction) updates only the relevant
section of the report; correct unrelated sections remain unchanged after the
correction (§35).

**SC-4 — Full loop works for any branch scenario.**
The complete workflow — record → transcribe → review/correct → generate →
review/correct → accept → export — works for a single-branch day (Type 1) and
for a multi-branch day (Type 2 with per-branch time ranges and `/`-joined
branch names).

**SC-5 — Exports succeed in all five formats.**
PDF, TXT, CSV, and XLSX exports complete client-side and reproduce the
report content; Google Docs export creates the document in the user's own
Google Drive (drive.file scope) and returns its URL for the user to open.

**SC-6 — Engineering gates pass.**
- Frontend builds with 0 errors (`npx vite build`) and passes lint.
- Backend files pass `node --check`.
- No `console.log` in backend code (Winston replaces it).
- No magic values: every literal lives in `utils/constants.js` or
  `config/env.js`; constants and env objects are frozen.
- No numeric HTTP status codes in code — semantic names from
  `httpStatus.js` only.

**SC-7 — Security gates pass.**
- All AI API keys live only in `backend/.env`; no key ever reaches client
  code, Vite env vars, localStorage, Redux state, or client logs.
- AI and auth endpoints are rate-limited (§27) and protected by
  authentication.
- All service calls (Gemini, Nvidia) use the backend-only proxy; no
  direct client-to-provider calls (§16).
- The fixed global security middleware stack order (§27) is never reordered.

**SC-8 — No invented claims.**
This specification asserts no numeric performance or accuracy targets that
were not supplied in the requirements. Any future quantitative success
metric is registered in §69 and only then adopted.

### 2.5 Guardrails

- Accuracy is prioritized over convenience, performance, or simplicity in
  every implementation decision — while the corresponding metrics,
  performance, and simplicity must still be excellent.
- No automated test frameworks are introduced; no TypeScript, no zod — the
  app stays JavaScript-only with manual validation resolvers (§9).

### 2.6 Definition of Done

A work item against this specification is done only when:

1. All stated behaviors in the referenced sections are implemented without
   deviation.
2. The validation gates in SC-6/SC-7 pass.
3. Report output content has been verified against §6 samples (format + tone).
4. STT accuracy has been verified with real Amharic audio (SC-1).

---

*§2

---

## 3. Scope, Users & Personas

### 3.1 Scope

#### 3.1.1 Scope statement

This version of Report Builder V3 delivers the complete daily-supervision
reporting workflow for the restaurant company's Area Supervisor, as a web-only
application. It covers the full loop — record → transcribe → review/correct →
generate → review/correct → accept → export — plus centralized management of
branches, reports, transcriptions, AI conversations, user
profile, and analytics. Everything beyond the boundaries declared in §3.1.3 is
out of scope for this release.

#### 3.1.2 In-scope feature set

| # | Feature group | In scope (this version) | Traced to |
| - | ------------- | ----------------------- | --------- |
| F1 | Identity & profile | Self-service registration with email + password only; auto-extraction of `firstName`/`lastName` from the email local part; optional profile fields (`avatar`, `position`) set later on the Profile page; Google account registration/sign-in (name, email, avatar; no password for OAuth-created accounts); login, logout, refresh-token rotation (JWT 2-token, httpOnly cookies) | §28, §19 |
| F2 | Branch management | Branch create/read/update; archive → restore → permanent delete (two-path deletion lifecycle); branches listed in pickers, Reports UI, and global search (active-only by default; archived only on explicit filter) | §20, §30, §62 |
| F3 | Report workflow | Wizard-created report (Steps 1–5); one or more audio clips per report; upload as `multipart/form-data` (`clips` field); STT transcription via Addis AI with backend chunking; transcription review, edit, AI correction (typed or voice), re-transcription; AI report generation; report review/correction after generation (3 modes, per §1.4); accept → persisted, versioned | §52, §53, §32, §33, §54, §34, §35, §31, §21 |
| F4 | Status & lifecycle | Report status machine (draft → audio_attached → transcribed → reviewed → completed) + guards; archive/restore/delete; sweeper + TTL retention | §31, §62 |
| F5 | Content data | Report content (`raw`, `latest`); transcription content (`raw`, `latest`); audio records; AI chat conversations per report | §21, §23, §22, §24 |
| F6 | Views & retrieval | Dashboard with KPI cards and charts; Reports list (paginated, status/branch filters); Report details; Global search (Reports + Branches); 404 page | §49, §50, §51, §39, §59 |
| F7 | AI chat | Correction chat UI (MUI X Chat community) over conversation history with provider selection | §55, §36, §24 |
| F8 | Export | PDF, TXT, CSV, XLSX (client-side); Google Docs (backend-side, user-owned Drive document via `drive.file` scope) | §37, §58 |
| F9 | Management | Analytics API + dashboard; user profile; responsive app shell (sidebar, appbar, global search dialog) | §38, §57, §47, §46 |

#### 3.1.3 Out of scope — deferred to later versions

Deferred by user decision and **excluded for this version** (details and
rationale: §4):

- Text-to-speech (TTS).
- Realtime audio processing.
- Native mobile apps (iOS/Android) — web-only.
- Role-based access control — single user type (Area Supervisor).
- Automated translation (reports remain in their original language).

#### 3.1.4 Platform scope

- Web application only; JavaScript only; MUI community edition; no
  TypeScript, no Next.js, no Tailwind (see §9, §13).
- No automated test frameworks (validation gates per §2.4 SC-6/SC-7).

#### 3.1.5 Domain non-goals (permanent boundaries)

The system is not, and is not intended to become:

- a general-purpose document editor or word processor;
- an automated translation service;
- a multi-company / multi-tenant platform;
- a payroll, inventory, or POS / ordering system;
- a public-facing customer application.

### 3.2 Users & Actor model

#### 3.2.1 Actors

| Actor | Type | Access |
| ----- | ---- | ------ |
| Area Supervisor | Authenticated application user (single user type) | All in-scope features; own data (see §3.2.3) |
| Boss (report reader) | Implicit consumer — reads the exported/generated reports; no application account | None (receives the deliverable) |
| Anonymous visitor | Unauthenticated | Landing, Login, Register pages only |

#### 3.2.2 Registration model

- Registration collects only `email` and `password`. No name field on the
  register form; `firstName` and `lastName` are extracted from the email local
  part, e.g. `beza@gmail.com` → `beza`, `beza.ayalew@gmail.com` → `beza`,
  `ayalew` (§19, §28).
- Google OAuth users use Google-provided data (name, email, avatar, no
  password) (Google OAuth stub — ADR-024; §28).
- `avatar` and `position` are optional profile fields edited from the Profile
  page (§19, §57).

#### 3.2.3 Ownership & visibility model

- **User-scoped (private):** every user-owned record — reports,
  transcriptions, audio, AI conversations, analytics, **and branches** — is
  bound to the authenticated, server-assigned user
  (`req.user._id.toString()`); visibility is personal (§19, §20, §28).
  Branches are created and owned by the registering user.
- **Branch snapshot rule:** branch data is embedded into each report's
  `branches[]` block (snapshot by name) and stays readable even after
  archiving or deletion; the snapshot is copied at report creation and
  never rewritten by later branch edits (BR-14, §20, §30).
- These rules are recorded here (§3.2.3) and enforced in all data-layer
  sections (Part B, Part C, and DB-layer sections), especially §30, §39, and §21.

### 3.3 Personas

#### 3.3.1 Primary persona — Area Supervisor

| Attribute | Description |
| --------- | ----------- |
| Summary | An employee of a restaurant company with more than 14 branches in Addis Ababa. Supervises restaurant operations across one or more branches each working day. |
| Typical day | Visits branches to monitor daily operations, check cleanliness and employee readiness, follow the checklist, observe urgent problems, communicate with staff and responsible people, follow up on previously reported issues, act or give instructions, form an opinion about branch performance, and identify immediate-attention and improvement items (duties: §1.2.1). |
| End of day | Must produce a report that explains: date, branch(es), working time, completed activities, unresolved issues, general opinion, and exit time (§1.2.2). |
| Frustrations | Manual post-working-day writing; recall-from-memory; unstructured narration; formatting; multi-branch days with per-branch time ranges; scattered records (§1.2.3). |
| Language | Amharic conversation (always); UI in English; workplace transliteration of English/technical words (§1.7). |
| Skill context | Speaks Amharic; the workflow avoids typing by using audio (§1.1). |
| Goals (per §2) | Boss-ready structured report with minimal effort (G1); correct information; corrected report without full rewrite (G3); versioned, exportable, managed centrally (G4–G7). |
| Frustrations → success criteria | After-hours work (→ SC-4), text-typing (→ no-typing loop), manual formatting (→ §6 format compliance SC-2). |

#### 3.3.2 Secondary persona — Boss (report reader)

| Attribute | Description |
| --------- | ----------- |
| Summary | The report's recipient (the supervisor's boss / senior management). Reads finished daily supervision reports; has no application account. |
| Expectations | Professional, direct, clear, well-structured Amharic; correct per format §6; tone per §1.7/§2.4 SC-2. |
| Interaction surface | Only the exported deliverable: PDF / TXT / CSV / XLSX / Google Docs document (§37, §58). |

Persona statements are illustrative and are derived strictly from the
requirements; they do not assert any invented facts, capacities, or metrics.

### 3.4 Scope boundaries & assumptions

| # | Assumption / boundary | Statement |
| --- | --------------------- | --------- |
| A1 | Single application | All features are part of one web app (client + backend), no satellite tools. |
| A2 | One user per account | A single account belongs to one person; no shared accounts. |
| A3 | Branch user scope | Each branch is created and owned by the registering user; all records — branches, reports, transcriptions, conversations — are user-scoped (§3.2.3). |
| A4 | Days & reports | A report may be created per date; the date comes from the report format (§6), not the system clock; multi-clip days are allowed. |
| A5 | Single-branch vs multi-branch | Both format types supported (§6 Type 1 / Type 2) with per-branch time ranges. |
| A6 | Language realism | Amharic is first-class; English/tech words transliterated; UI stays English (§1.7). |

### 3.5 Explicit non-claims

- No numeric performance, accuracy, or timeline targets are asserted in any
  persona or scope description; SC-8 (§2.4) applies.
- No sample branch or supervisor names are used here; they belong exclusively
  to the sample reports in §6.

---



---

## 4. Deferred Features & Non-Goals

### 4.1 Purpose & relationship

This section records everything that is **not** delivered in this version
and why. It inherits the boundary set in §1.4 (deferred features list),
§3.1.3 (out of scope — deferred to later versions), §3.1.4 (platform scope),
and §3.1.5 (permanent domain non-goals), and gives each item a reason and,
where applicable, the condition under which it may be re-admitted.

Two distinct classes are kept separate:

- **Deferred features (§4.2)** — deliberately postponed by user decision;
  they are *not* open questions and *not* `TODO(open)` markers. Open
  questions live only in §69. A deferred feature returns only through a new
  §66 phase and an explicit amendment of this section.
- **Non-goals (§4.3, §4.4)** — permanent boundaries (technical and domain).
  These are lock decisions, not deferred work.

The deferred features are listed identically in §1.4 and §3.1.3; this section
is the canonical home for their rationale.

### 4.2 Deferred features (may return in a later version)

These features are **excluded for this version** by user decision:

| # | Feature | What it would do | Why deferred | Re-admission condition |
| - | ------- | ---------------- | ------------ | ---------------------- |
| D1 | Text-to-speech (TTS) | Read reports, transcriptions, or notifications aloud in Amharic | Not required for the record-and-report loop; no audio-output dependency in the current pipeline | User request with concrete use case; new phase in §66; audio-output dependency added to §13 |
| D2 | Realtime audio processing | Transcribe audio while it is being recorded (streaming) | The current pipeline is asynchronous: record clip → upload → process (§32, §33); realtime requires streaming architecture and push channel | New phase in §66; streaming component in §12/§33; performance targets in §64 |
| D3 | Native mobile apps (iOS/Android) | Separate native apps wrapping the same domain abilities | Web-only decision (user; §1.1, §3.1.4); the responsive web shell (§47) covers in-browser use | New phase in §66; separate client (§41) and store deployment; §13 change |
| D4 | Role-based access control (RBAC) | Multiple user roles, permissions, and per-role UI | Single user type (Area Supervisor), no RBAC — ADR-036 (§1.1, §3.2.1, §19) | New phase in §66; user model (§19) and auth (§28) redesign; ADR-036 reversal |
| D5 | Automated translation | Translate report content or transcription to a target language automatically | Reports remain in their original language; Amharic-first (ADR-001), no forced translation; only transliteration of workplace terms (§1.7, §7) | New phase in §66; translation provider design (§16) and language policy (§7) |

Each deferred feature carries no API surface, no UI placeholder, and no
dependency in this version — their absence is real, testable, and intentional.

#### 4.2.1 Distinction: deferred vs open questions

- D1–D5 are full user cases we have decided to postpone.
- OQ-004 (§69) concerns **Google OAuth real vs stub** — that is a pending
  question about an *in-scope* feature, not a deferred feature; it is managed
  in §69. The two lists never overlap in items or intent.

### 4.3 Technical stack exclusions (permanent decisions)

The following are permanent, non-negotiable platform decisions, not deferred:

- **TypeScript** — the application stays JavaScript-only (§2.3, §9, §13).
- **Next.js** — the application is React + Vite per §13; no SSR/framework.
- **Tailwind CSS** — styling is MUI + CSS-in-JS conventions (§9, §43, §44);
  no Tailwind.
- **zod** — validation is manual resolvers (no zod) (§2.5, §9, §29).
- **Automated test frameworks** — no automated test suites (Jest, etc.);
  validation uses the gates in §2.4 SC-6/SC-7 and §63.

Reverting any of these requires a change to §9, §13, and explicit user approval—
they are locked decisions recorded in this section so the boundaries are
unambiguous.

### 4.4 Permanent domain non-goals

The system is not, and will never be:

- a general-purpose document editor or word processor (report text editing is
  scoped to report content via §35, §51, §54; not the product's purpose)
  — non-goal basis: product is a reporting system, not a word processor;
- an automated translation service (§4.2 D5 is the routed-and-listed case,
  this non-goal stands against offering translation as a product capability);
- a multi-company / multi-tenant platform — no cross-user branch sharing;
  each user owns a private branch set (§3.2.3); single-tenant;
- a payroll, inventory, or POS / ordering system (no financial, stock, or
  sales business logic anywhere; §3.1.5);
- a public-facing customer application — only authenticated supervisors and
  the anonymous landing/login/register pages (§3.2.1) exist;

Each carries a one-line reason (in parentheses) so that future proposals can
be evaluated against this list.

### 4.5 Interaction with Open Questions

Nothing in this section creates new open questions. Any unknown behavior or
future decision is registered only in §69. When a re-admission happens
(§4.2 re-admission conditions), the item is removed from this section and
resourced in §66 phases; when an open question closes into a deferred feature,
it is moved here with a record in §69.

---



---

## 5. Core Business Rules

### 5.1 Purpose & scope

This section defines the **domain rules** the entire application must obey —
the invariants that every model, API, and page section below must honor.
Every rule is anchored to a prior section (§1–§4) or a locked requirement;
nothing here invents behavior. Where a rule is not yet predetermined, it is
left to its owning section and the §69 register — never decided in prose
here.

Rules are numbered **BR-01 … BR-19** and referenced by ID elsewhere. Specific
implementation details (endpoints, validators, UX flows, formats) intentionally
live in their owning sections: §6–§8 (format, language, AI rules), §21/§31
(versioning, status API), §32–§35 (pipelines, correction service), §51–§54
(details, wizard, recording, review UX), §62 (retention mechanics), §69
(open questions).

### 5.2 Reporting-day rules

- **BR-01 — Report date from the report, not the clock.** A report is tied
  to a report date that comes from the report-format date field (§6), *not*
  from the system clock; a day's recordings may be captured as multiple
  clips within one report (assumption A4; §1.2.2).
- **BR-02 — Multiple clips per report.** One or more audio clips may be
  attached to a single report; all clips belong to the same report and the
  same report date (§1.4, §3.1.2 F3).
- **BR-03 — Single- or multi-branch days (Type 1 / Type 2).** A day's
  report covers one branch (Type 1) or several branches (Type 2) with
  per-branch time ranges and `/`-joined branch names on the branch line
  (§1.6, §2.2 G5, §2.4 SC-4).
- **BR-04 — Report content contract.** A completed report explains: the
  date, the branch (or branches), working time, the completed activities,
  unresolved issues, the general opinion, and the work exit time (§1.2.2,
  §6). Missing values are never invented (BR-19).

Clip-level details (MIME priority, per-clip duration limits, chunking) are
owned by §32/§33/§53 and their constants home (§11) — §5 sets only the
day-level invariants above.

### 5.3 Workflow & status-machine invariants

- **BR-05 — Wizard-driven creation.** A report is created through the
  report-creation wizard (Steps 1–5, each step defined in §52). The wizard
  is the only creation path from the Reports UI.
- **BR-06 — Status machine (forward-only, explicit rewind).** Every report moves through the
  five states — `draft → audio_attached → transcribed → reviewed → completed`
  — in order, without skipping states. The authoritative transition-guard
  table lives in §31 and is reused identically by §51/§52 UI actions
  (status–guard consistency). Backward movement exists only as the
  explicit transitions declared in §31 — the single material-removal
  rewind (last audio deleted, §17.4/§17.6) — never implicit, never
  triggered by edits or content changes (ADR-003).
- **BR-07 — Transcription is raw material only.** The transcription is never
  the final report; the AI-generated report is produced from the captured
  form metadata (header values) and the reviewed transcription (body content;
  fallback for missing metadata) (§1.4, §2.3, §6.1, §33).
- **BR-08 — Review-then-accept.** A report becomes `completed` only after the
  supervisor reviews and accepts the generated report (per the three
  correction modes of §1.4; accept model BR-11). Acceptance is the
  checkpoint that fixes `latest` as the accepted content (§21).

### 5.4 Correction, editing & versioning rules

- **BR-09 — Surgical corrections.** A correction (typed instruction or voice
  instruction) updates only the relevant part of the report; correct
  unrelated sections remain unchanged after the correction (§2.2 G3, §2.4
  SC-3, §35, §54).
- **BR-10 — Editable at every status.** Generated reports remain
  editable after generation, including at `completed`. Editing applies
  to all changeable material — report content, transcription content
  (modes §1.4), and attachment changes (audio added or removed) —
  and every edit updates `latest`; `raw` stays the original. There is
  no version chain (BR-11). A change never rewinds the status (BR-06);
  the only status movement caused by material changes is the
  last-audio rewind of §17.4.
- **BR-11 — Raw/latest content model (single undo).** Every content-bearing
  row (transcription, generated report) carries `raw` — the original
  content, written once at creation (STT output or first generation) and
  never rewritten — and `latest`, initialized to `raw` and always holding
  the current content. A correction (Mode 1/2/3) overwrites `latest`;
  a one-click "Revert to original" copies `raw` into `latest` while they
  differ; Accept fixes `latest` as the accepted content — single-undo, no
  revision-history model (§1.4; decision 2026-08-08).
- **BR-12 — Verification allowed until accept.** Re-transcription is
  available for verification on every audio recording until the report is
  accepted/completed (§2.4 SC-1, §2.2 G9, §33, §54).

### 5.5 Ownership & deletion-lifetime rules

- **BR-13 — Personal scope.** Branches are created and owned by the
  registering user; reports, transcriptions, audio, AI conversations,
  and analytics are likewise private to the authenticated user
  (§3.2.3, §19, §20, §28).
- **BR-14 — Two-path deletion (business).** Deletion is a two-step lifecycle:
  archive (soft) → restore, or delete → permanent. Archiving must never break
  report history: branch archives keep reports readable by embedded name
  snapshot (§3.2.3, §20, §30).
- **BR-15 — Sweeper/TTL hard-delete.** Permanent deletion happens only via
  the sweeper after the TTL window: **30 days / 2592000 s** from `deletedAt`
  where applicable (§62, §31). No other path may hard-delete user data once
  archived — retention contracts in §62, constants in §11.
- **BR-16 — Report two-path lifecycle.** Reports follow the same two-path
  lifecycle (archive → restore → permanent delete) as branches (§3.1.2 F4,
  §62, §31).

### 5.6 Language, export & accountability rules

- **BR-17 — Language contract.** Audio conversation and transcription are always
  Amharic; the UI is English; English/technical words use Amharic workplace
  transliteration, never literal translation (§1.7, §7). AI prompts follow
  the §8 rules.
- **BR-18 — Export fidelity.** Exports reproduce the current accepted report
  content — PDF/TXT/CSV/XLSX client-side and Google Docs into the user's own
  Drive (§2.4 SC-5, §37, §58). Export naming and target rules: §58 (OQ-006).
- **BR-19 — No invented facts anywhere.** Missing dates, branch names, times,
  actions, people, problems, or opinions are left blank or marked
  "not specified" — never fabricated (§2.4 SC-2, §8).

### 5.7 Open questions & boundaries

- This section asserts no undeclared assumption: any open item listed as
  open here (e.g., `clockIn`/`clockOut` required vs optional — see OQ-002 in
  §21 and §69) is left open; its rules are not half-decided in §5.
- All values above (e.g., BR-15's `2592000` s) resolve to §11 constants; the
  no-magic-value rule (§9) applies to every later section that implements
  them. Nothing in §5 creates a new open question.

---


---

## 6. Report Format Specification

### 6.1 Purpose & relationship

This section is the **canonical home of the report format**: the exact
Amharic structure, the two format types (Type 1 — single branch, Type 2 —
multiple branches), the field rules, content routing, tone, and the
verbatim sample reports. §1.6 is a summary only and defers here; the
format defined in this section is what generation (§34), validation
(§31), correction (§35), review (§54), and export (§37, §58) all operate
against.

- **Verification gates.** §2.4 SC-2 (report matches the §6 format and
  tone) and SC-4 (full loop works for Type 1 and Type 2) are checked
  against this section; §2.6 DoD item 3 verifies generated output against
  the §6.8 samples.
- **Name exclusivity.** Beyond the verbatim example content carried from the
  requirements (§6.4, §6.6, §8.4) and the §8.5.3 transcript, sample branch and
  person names appear **only** in §6.8 — never in any behavioral, UI, or API
  specification (§1.6, §3.5).
- **No invention.** Metadata values (date, branch names, visit times, day
  start/exit) are captured and stored at capture time (capture form). The
  reviewed transcription is the source for body content and the fallback
  when a metadata value is missing — a missing value is left blank or
  marked not specified, never invented or deduced from other sources
  (§5 BR-19, §8 rules 5–6).

### 6.2 Canonical skeleton (both types)

The generated report always follows this Amharic structure. Section
labels are fixed Amharic strings; body content is Amharic with §7
transliteration for English/technical workplace terms.

```text
ቀን: [ቀን]
ብራንች: [ብራንች ስም]
ስም: [ሙሉ ስም]
ስራ የገባሁበት ሰዓት: [ሰዓት]

የተሰሩ ስራዎች:
 - [ስራ 1]
 - [ስራ 2]

መፍትሄ የሚፈሉ ጉዳዮች:
 - [ችግር 1]
 - [ችግር 2]

አጠቃላይ አስተያየት:
 - [አስተያየት 1]

ከስራ የወጣሁበት ሰዓት: [ሰዓት]
```

In Type 2 the ስራ የገባሁበት ሰዓት line is replaced by one time-range
line per branch visit (see §6.4); every other line is identical.

### 6.3 Field definitions

| # | Label (Amharic) | Meaning | Value source | Cardinality | Format / notes |
| - | --------------- | ------- | ------------ | ----------- | -------------- |
| 1 | `ቀን` | Report date | Capture form (report date); fallback: reviewed transcription → blank | Single line | Ethiopian `DD-MM-YY` (e.g. `29-10-18`); never the system clock (§5 BR-01) |
| 2 | `ብራንች` | Branch (Type 1) or branches (Type 2) | Capture form (visits → branch names joined with ` / `); fallback: reviewed transcription → blank | Type 1: one name. Type 2: names joined with ` / ` | Text |
| 3 | `ስም` | Full supervisor name | User profile (§19); captured into the capture form | Single line | Text |
| 4 | `ስራ የገባሁበት ሰዓት` | Work-start time / per-branch time ranges | Capture form (visit times); fallback: reviewed transcription → blank | Type 1: one line. Type 2: one line per branch visit | 24h `HH:mm` (Type 1); `ከ[HH:mm] - [HH:mm] [branch] ብራንች` (Type 2) |
| 5 | `የተሰሩ ስራዎች` | Completed activities | Transcription, organized | Bullet list | ` - ` bullets |
| 6 | `መፍትሄ የሚፈሉ ጉዳዮች` | Issues needing solutions (incl. urgent problems) | Transcription, organized | Bullet list | ` - ` bullets |
| 7 | `አጠቃላይ አስተያየት` | General opinion / improvement opinion | Transcription, organized | Bullet list | ` - ` bullets |
| 8 | `ከስራ የወጣሁበት ሰዓት` | Work exit time | Capture form (day exit — last visit end); fallback: reviewed transcription → blank | Single line | 24h `HH:mm` |

### 6.4 Type-specific rules

The format must support one branch or multiple branches. When multiple
branches are visited, the working time section shows the time range for
each branch. The multi-branch time-format example is preserved verbatim
from the requirements:

```text
ስራ የገባሁበት ሰዓት: 02:30
ከ02:30 - 07:40 መድኃኒዓለም ብራንች
ከ07:55 - 12:20 ኤርፖርት ብራንች
```

**Type 1 — single branch:**

- The working day covers exactly one branch.
- `ብራንች:` line contains one branch name.
- `ስራ የገባሁበት ሰዓት:` line contains a single work-start time (`HH:mm`).

**Type 2 — multiple branches:**

- The working day covers two or more branches.
- `ብራንች:` line lists all visited branches joined with ` / ` (e.g.
  `መድኃኒዓለም / ኤርፖርት`); a branch visited more than once is listed
  once in this header line.
- `ስራ የገባሁበት ሰዓት:` shows **one time-range line per branch visit**,
  ordered **chronologically by visit start time** (locked decision):
  `ከ[HH:mm] - [HH:mm] [branch name] ብራንች` (e.g. `ከ02:30 - 07:40 መድኃኒዓለም ብራንች`).
- A branch visited twice appears as two separate lines with its own
  start/end times (see Sample 4).
- The final `ከስራ የወጣሁበት ሰዓት:` equals the end of the last visit.

### 6.5 Canonical formatting conventions

- **Times:** 24-hour `HH:mm`, zero-padded (`01:05`, `09:55`).
- **Time ranges:** exactly `ከ[HH:mm] - [HH:mm] [branch] ብራንች` — the dash
  is ` - ` (space-hyphen-space); visit lines appear in chronological
  visit-start order, one line per branch visit (§6.4).
- **Dates:** Ethiopian `DD-MM-YY` with zero-padded numerals (`29-10-18`).
- **Bullets:** each item on its own line starting with ` - `.
- **Labels:** fixed Amharic label + ASCII colon + space (`ቀን: ...`).
- The §6.8 samples are preserved **verbatim** from the requirements even
  where a sample's typing differs from these conventions (e.g. `2:30`
  without leading zero, `እስከ` instead of ` - `, and the requirement
  authors' own skeleton using `፡` — Ethiopic colon — in the exit-time
  label). Canonical generation follows the conventions in this section;
  samples remain the tone-and-structure reference, not byte-level
  templates.

### 6.6 Tone & writing style

- Professional, direct, clear, work-report oriented.
- Written from the supervisor's point of view; suitable to present to a
  boss.
- Natural in Amharic; **not** overly decorative, conversational, casual,
  or chatbot-like.
- Conversational audio becomes report language. Example: the spoken
  `እኔ ዛሬ መድኃኒዓለም ሄጄ ቼክሊስቱን አይቼ ነበር` is written as
  `በቼክሊስቱ መሰረት በመድኃኒዓለም ቅርንጫፍ የሚከናወኑ መደበኛ የአሰራር ሂደቶችን አረጋግጫለሁ።` —
  the report never repeats the narration verbatim (see §8.4).

### 6.7 Content routing

| Information | Destination |
| ----------- | ----------- |
| Date, branch names, working times, branch time ranges | Header lines (fields 1–4) |
| Completed/checked activities, follow-ups, instructions given, repairs verified | `የተሰሩ ስራዎች` |
| Unresolved issues, urgent problems needing a solution, missing items | `መፍትሄ የሚፈሉ ጉዳዮች` |
| General branch opinion, improvement observations | `አጠቃላይ አስተያየት` |

- Completed activities are separated from unresolved issues (rule 7 of
  the generation rules in §8).
- Urgent problems go under `መፍትሄ የሚፈሉ ጉዳዮች` (rule 8); general branch
  or improvement opinions go under `አጠቃላይ አስተያየት` (rule 9).
- Branch-specific details and per-branch time ranges are preserved when
  multiple branches are mentioned (rules 10–11).

### 6.8 Sample reports (verbatim)

The four sample reports from the requirements, preserved verbatim. They
are the reference for tone, structure, and the DoD check in §2.6 item 3.
Sample branch and person names below appear nowhere else in this
specification (§1.6, §3.5).

**Sample 1 — Type 2, two branches (29-10-18)**

```text
ቀን: 29-10-18
ብራንች: መድኃኒዓለም / ኤርፖርት
ስም: ቤዛ አያሌው
ስራ የገባሁበት ሰዓት: 2:30
ከ02:30 - 07:40 መድኃኒዓለም ብራንች
ከ07:55 - 12:20 ኤርፖርት ብራንች

የተሰሩ ስራዎች:
በመድኃኒዓለምና በኤርፖርት ቅርንጫፎች በቼክሊስቱ መሰረት የዕለት ተዕለት የአሰራር ሂደቶችን፣ የንፅህና ሁኔታዎችን እና የሰራተኞችን ዝግጁነት አረጋግጫለሁ።
በመድኃኒዓለም ብራንች ትናንት ሪፖርት የተደረጉት ሁሉም የጥገና ችግሮች አሁን ላይ ተስተካክለዋል።
በኤርፖርት ቅርንጫፍ የአዲሶቹ ሶፋዎች እግሮች መሰበራቸውን ለቶማስ አሳውቄው፤ እሱም ነገ ቴክኒሻን እንደሚልክ ገልጾልኛል።

መፍትሄ የሚፈሉ ጉዳዮች:
በኤርፖርት ቅርንጫፍ፡ የወንዶች ሎከር ጣሪያ አሁንም እያፈሰሰ ነው፤ ይህ ችግር ከዚህ ቀደም (13-10-18) ሪፖርት የተደረገ ሲሆን እልባት አላገኝም። በተጨማሪም በኪችን ውስጥ ያለው የጭስ ማስወጫ ኤግዝስት ፋን መጽዳት ይፈልጋል፣ የበርገር ሥጋው መጠኑ አነስተኛ ሲሆን ከዳቦ ጋር የተመጣጠነ አይደለም። ስለሆነም እነዚህ ችግሮች መፍትሄ እንዲያገኙ እጠይቃለሁ።

አጠቃላይ አስተያየት:
በሁለቱም ቅርንጫፎች የሥራ እንቅስቃሴው ጥሩ ነበር።

ከስራ የወጣሁበት ሰዓት: 12:20
```

**Sample 2 — Type 2, three branches (26-10-18)**

```text
ቀን: 26-10-18
ብራንች: ኤርፖርት / መድኃኒዓለም / ቡልቡላ
ስም: ቤዛ አያሌው
ስራ የገባሁበት ሰዓት:
ከ01:50 - 04:10 ኤርፖርት ብራንች
ከ04:20 - 07:30 መድኃኔዓለም ብራንች
ከ08:05 - 12:30 ቡልቡላ ብራንች

የተሰሩ ስራዎች:
በኤርፖርትና በመድኃኒዓለም ብራንቾች በቼክሊስቱ መሠረት የዕለት ተዕለት የአሠራር ሂደቶችን፣ የንፅህና ሁኔታዎችን እና የሠራተኞችን ዝግጁነት አረጋግጫለሁ።
በቡልቡላ ብራንች በተዘጋጀው የካሸሮች ሥልጠና ላይ ተሳትፌያለሁ።

መፍትሄ የሚፈሉ ጉዳዮች:
ለሳምቡሳ ዝግጅት የሚያስፈልጉ ግብዓቶች ስቶር ባለመኖራቸው፣ ወደ ብራንቹ ሳምቡሳ አልተላከም። ስለዚህ በተቻለ ፍጥነት ግብዓቶቹ እንዲሟሉ እጠይቃለሁ።
በመድኃኒዓለም ብራንች የግሪሉ ግማሽ ክፍል አይሠራም። በመሆኑም ማቲያስ በተቻለ ፍጥነት እንዲጠግነው ጥሪ አድርጌ ነበር፤ ነገር ግን ሥራ እንደበዛበት አስታውቆኛል፣ ቢሆንም አሁንም እንዲስተካከል እጠይቃለሁ።

አጠቃላይ አስተያየት:
በአጠቃላይ በሦስቱም ቅርንጫፎች የሥራ እንቅስቃሴው ጥሩ ነበር።

ከስራ የወጣሁበት ሰዓት: 12:30
```

**Sample 3 — Type 1, single branch (22-10-18)**

```text
ቀን: 22-10-18
ብራንች: መድኃኒዓለም
ስም: ቤዛ አያሌው
ስራ የገባሁበት ሰዓት: 01:55

የተሰሩ ስራዎች:
በቼክሊስቱ መሰረት በመድኃኒዓለም ቅርንጫፍ የሚከናወኑ መደበኛ የአሰራር ሂደቶች፣ የንፅህና አጠባበቅ ሁኔታ እና የሰራተኞች ዝግጁነት በተገቢው መልኩ መሆናቸውን አረጋግጫለሁ።
ኤፍሬም በህመም እረፍት ላይ ስለነበር የእሱን የሥራ ቦታ ሸፍኜያለሁ።

መፍትሄ የሚፈሉ ጉዳዮች:
በዋናው መግቢያ በር ላይ የሚቀመጠው ምንጣፍ (ካርፔት) እንዲገዛልን ቀደም ሲል ጠይቄ የነበረ ሲሆን አሁንም በተቻለ ፍጥነት እንዲሟላልን እጠይቃለሁ።

አጠቃላይ አስተያየት:
በአጠቃላይ የሥራ እንቅስቃሴው ጥሩ ነበር።

ከስራ የወጣሁበት ሰዓት: 09:30
```

**Sample 4 — Type 2, branch revisited (09-11-18)**

```text
ቀን: 09-11-18
ብራንች: ጎላጉል እና ብስራተ ገብርኤል ብራንች
ስም: ቤዛ አያሌው
ስራ የገባሁበት ሰዓት:
ከ1:05 እስከ 2:20 በጎላጉል ብራንች
ከ3:30 እስከ 9:20 በብስራተ ገብርኤል ብራንች
ከ9:55 እስከ 12:00 በጎላጉል ብራንች

የተሰሩ ስራዎች:
በጎላጉል እና በብስራተ ገብርኤል ብራንቾች በቼክሊስቱ መሰረት የሚከናወኑ የዕለት ተዕለት ተግባራትን፣ የአሰራር ሂደቶችን፣ የንጽህና አጠባበቅ ሁኔታዎችን እና የሰራተኞችን ዝግጁነት ተከታትዬ አረጋግጫለሁ።
በጎላጉል ብራንች በአንዳንድ ሰራተኞች ላይ የአሰራር ስርዓት ክፍተት ስለነበረ፤ እነዚህን ሰራተኞች እና ሱፐርቫይዘሩን ጨምሮ ያየሁትን የስራ አሰራር ክፍተት በድጋሚ እንዳይፈጽሙ መመሪያ ሰጥቻቸዋለሁ።
በጎላጉል ብራንች ማክሰኞ ሪፖርት ተደርጎ የነበረውን የእቃ ማጠቢያ ሲንክ ድሬኔጅ (ሲንፎን) በማትያስ አማካኝነት እንዲስተካከል አድርጌያለሁ።
በብስራተ ገብርኤል ብራንች ከዚህ ቀደም ተጠይቆ የነበረውን ኢንሴክት ኪለር በማትያስ አማካኝነት እንዲሰቀል አድርጌያለሁ።

መፍትሄ የሚፈልጉ ጉዳዮች:
በብስራተ ገብርኤል ብራንች ያለው የዲፕ ፍራየር ኮንታክተር ተበላሽቶ ስለነበር ለማትያስ አሳውቄዋለሁ፤ ነገ መጥቶ እንደሚያስተካክለው አረጋግጦልኛል።
በብስራተ ገብርኤል በእግር ተረግጦ የሚሰራው የእጅ መታጠቢያ በህንፃው ላይ ባሉ የሌሎች ድርጅት ሰራተኞች ጭምር ጥቅም ላይ እየዋለ ይገኛል። በዚህም የተነሳ ከፍተኛ የሳሙና እና የውሃ ብክነት ከመኖሩም በላይ እጅ መታጠቢያው ቶሎ ቶሎ እየተበላሸ በመሆኑ፣ ከህንፃው አስተዳደር ጋር በመነጋገር አፋጣኝ መፍትሄ ሊሰጠው ይገባል።
በጎላጉል ብራንች የላሉ ሶኬቶች እና ማብሪያ ማጥፊያዎች ስላሉ ለማትያስ አሳውቄዋለሁ፤ ነገ መጥቶ እንደሚያስተካክል ነግሮኛል።

አጠቃላይ አስተያየት:
በአጠቃላይ በሁለቱም ብራንቾች ያለው የስራ እንቅስቃሴ ጥሩ ነው።

ከስራ የወጣሁበት ሰዓት: 12:00
```

### 6.9 Verification usage

- §2.4 SC-2: generated reports are checked against §6.2/§6.3 and the tone
  of §6.8 samples.
- §2.4 SC-4: the full loop is exercised for both a Type 1 day and a Type 2
  day.
- §2.6 DoD item 3: report output content is verified against the §6.8
  samples (format + tone) before a work item is done.
- §5 BR-03/BR-04/BR-19 business rules are enforced by the format rules
  above; no new behavior is asserted here.
- **Reserved anchors.** The capture & attribution contract (per-visit
  recording tabs, the attribution priority chain, the per-branch content
  status vocabulary, the branch digest used by filtering, and the
  unassigned-accept gate) is specified in §6.10 (capture & attribution)
  and §6.11 (branch digest & filtering) when that refinement point is
  reached. Nothing in those later subsections may contradict the format
  rules above.

---

## 7. Language & Tone Requirements (Transliteration, UI vs Content Language)

### 7.1 Purpose & relationship

This section is the canonical home of the language and tone rules, in
four parts: (a) the Amharic-transliteration rule for English and
technical workplace words, plus the term dictionary derived from the
verbatim samples (§7.2–§7.5); (b) the UI-versus-content language
boundary (§7.6); (c) the pipeline language policy and language codes
(§7.7); and (d) tone ownership (§7.8). It implements §5 BR-17 (language
contract) at the language level: the conversation and transcription are
Amharic, the UI is English, and English/technical words in the report
use Amharic workplace transliteration — never literal translation, never
forced translation. The §1.7 statement is the executive summary of the
boundary rules; this section is the canonical owner. The generation
pipeline (§34), validation (§31), correction (§35), UI implementation
(§41–§59), and export (§37, §58) all apply this section.

### 7.2 The transliteration rule (verbatim)

The rule is preserved verbatim from the requirements:

> The audio conversation is Amharic, but it may include English or
> technical workplace words. The AI must not translate such words
> literally into unnatural Amharic. The AI must also not leave them in
> English spelling if the expected report style uses Amharic phonetic
> writing.
>
> Instead, the AI must write English or technical words in the common
> Amharic workplace pronunciation/transliteration style. Example: if the
> audio mentions `deep fryer`, the report must not write `deep fryer`
> and must not translate it literally as `ጥልቅ መጥበሻ`. It must write
> `ዲፕ ፍራየር`. This rule applies to all English or technical words.

### 7.3 Authoritative examples (verbatim)

The following examples are given in the requirements:

- `locker` → `ሎከር`
- `kitchen` → `ኪችን`
- `exhaust fan` → `ኤግዝስት ፋን`
- `technician` → `ቴክኒሻን`
- `store` → `ስቶር`
- `deep fryer` → `ዲፕ ፍራየር` (never `ጥልቅ መጥበሻ`, never raw English)

These six pairs are the requirement-provided example set. Terms outside
them follow the rule of §7.2; the dictionary in §7.4 is derived from the
§6.8 samples only.

### 7.4 Term dictionary derived from the §6.8 samples

Terms observed inside the verbatim sample reports (§6.8). This list is
derived from the samples and is not exhaustive; terms not listed follow
the rule of §7.2 (common Amharic workplace pronunciation). The
dictionary is frozen to the samples — no entry is invented or imported
from any other source.

| English term | Amharic transliteration | Provenance |
| ------------ | ----------------------- | ---------- |
| checklist | `ቼክሊስት` | Samples 1–3 |
| exhaust fan | `ኤግዝስት ፋን` | Sample 1; §7.3 |
| locker | `ሎከር` | Sample 1; §7.3 |
| kitchen | `ኪችን` | Sample 1; §7.3 |
| burger | `በርገር` | Sample 1 |
| technician | `ቴክኒሻን` | Sample 1; §7.3 |
| sofa | `ሶፋ` | Sample 1 |
| grill | `ግሪል` | Sample 2 |
| store | `ስቶር` | Sample 2; §7.3 |
| carpet | `ካርፔት` | Sample 3 |

### 7.5 Application rules

The transliteration decision matrix is canonical:

| Input in the audio / transcription | Required output |
| ---------------------------------- | --------------- |
| English or technical workplace word with a common Amharic phonetic form | Amharic workplace transliteration (e.g. `deep fryer` → `ዲፕ ፍራየር`) |
| English or technical workplace word with no Amharic phonetic form in common workplace use | Raw English spelling (explicit exception; the dictionary documents the known cases) |
| Any English or technical word | Literal translation is forbidden (`ጥልቅ መጥበሻ` for `deep fryer` is never written) |

Additional rules:

- The rule applies to **all** English or technical words, with no
  exception list beyond the matrix (§7.2).
- The decision is per word, not per sentence: a mixed-language utterance
  keeps each word independently — transliterate what has a common
  Amharic form, keep the remainder raw English, never literal-translate.
- Header labels (`ቀን`, `ስም`, `ብራንች`, `ስራ የገባሁበት ሰዓት`, `የተሰሩ ስራዎች`,
  `መፍትሄ የሚፈሉ ጉዳዮች`, `አጠቃላይ አስተያየት`, `ከስራ የወጣሁበት ሰዓት`) are
  fixed Amharic strings owned by §6.3 and are never transliterated or
  translated.
- Names and captured values (branch names, person names, dates, times)
  are never transliterated or translated. Sample branch and person
  names appear only in the verbatim example content of
  §6.4/§6.6/§6.8 and the §8.5.3 transcript; they are excluded from
  every other part of this specification (§6.1, §1.6, §3.5) and are
  never reused.

### 7.6 UI vs content language boundary (canonical)

The boundary rules are preserved verbatim from the requirements:

> App shell, navigation, labels, buttons, validation messages, helper
> text, and everything else in the application interface must be English.
>
> Audio, transcription, AI chat, and report content can be Amharic,
> English, or mixed.
>
> Do not force translation unless the user explicitly chooses it.
>
> The conversation language in recorded audio is always Amharic.

Canonical elaboration:

**English chrome surfaces — UI copy is English.** App shell and
navigation (§47); page headings and section titles (§48–§59); buttons,
labels, helper text, validation messages (§29, §60); toasts and
empty/error/success states (§60); dialogs and confirmations (§46);
table and grid headers (§46, §50, §51); filters and controls; date
pickers (§46; Ethiopian calendar with English day/month names —
ADR-011); and the editor toolbar (§46). No Amharic copy is authored for
these surfaces.

**Content surfaces — the language is the user's own, Amharic by
default.** Recorded audio (§53), transcription text and its review
editor (§54), AI chat messages (§36, §55), the generated report body and
its editor (§51), and exported document content (§37, §58). These
surfaces may be Amharic, English, or mixed, and are never
machine-translated.

**Amharic inside the UI is allowed only on content surfaces.** The only
Amharic strings in the application are (a) the fixed report-label
strings of §6.2/§6.3 rendered inside report preview, edit, and export
views, and (b) user-entered or AI-produced content itself.

**Display conventions (English UI, numeric notation).** Ethiopian dates
are always displayed in numeric notation (`DD-MM-YY`) with English
day/month names — never Ethiopian month names, never Latin-letter
Amharic words (ADR-011, ADR-032; implementation §43, §46).

### 7.7 Pipeline language policy & codes (canonical)

- **Primary language:** Amharic (`am`) for all conversation-facing
  stages; English-aware (`en`) prompting is first-class where a provider
  requires or benefits from it. Language codes are named constants
  (home §11); provider capability details live in §16.
- **Extensibility only:** Afan Oromo (`om`) and Tigrinya (`ti`) are
  reserved language codes, not activated features — they appear as
  constants with no active UI, speech-to-text, or generation path
  (§11, §16).
- **Speech-to-text is always Amharic.** The recorded conversation is
  always Amharic (§7.6), so transcription runs with the Amharic language
  parameter on every clip (Addis AI; ADR-001, §33). Accuracy is the
  blocking requirement (§2.4 SC-1).
- **Content language is preserved end-to-end.** Speech-to-text (§33) →
  transcription review (§54) → generation (§34) → correction (§35) →
  export (§37, §58) never converts the content language implicitly.
- **No automatic translation anywhere.** Translation capability that a
  provider exposes is never invoked by the transcription, generation,
  correction, chat, or export paths (§16, §34, §35, §36, §37). Reports
  remain in their original language; a user-chosen target-language
  control is a deferred feature, not part of this version (§4 D5, §66).

### 7.8 Tone ownership & boundary

- The report tone is defined canonically in §6.6; the
  conversation-to-report transformation rules (including "never repeat
  the narration verbatim") are defined canonically in §8.4. This section
  holds no tone lists and does not duplicate them.
- Tone rules apply regardless of the content language: Amharic-only and
  mixed-language content both meet §6.6 and §8.4.
- The §2.4 SC-2 gate scores tone against §6.6 and §8.4 (enforced in §31,
  §34, §35).

### 7.9 Verification usage

- §2.4 SC-2 and §2.6 DoD item 3: generated output is checked for
  transliteration violations (raw English outside the §7.5 exception,
  literal translation) against §7.2–§7.5.
- §2.4 SC-2: transliteration violations fail the report format/tone
  gate.
- §7.5 matrix tests: the six §7.3 example pairs are exercised as
  positive/negative cases in §31 validation fixtures.
- UI-language sweep: the chrome surfaces enumerated in §7.6 carry no
  Amharic copy; checked in the page audits of §48–§59 and the universal
  UX states of §60. Content surfaces are exempt by design.
- Mock data and fixtures (§25, §40) supply Amharic content on the
  content surfaces and English copy on the chrome surfaces.
- Implemented and validated in §31 (validation), §34 (generation), §35
  (correction); prompt construction per §8.

---

## 8. AI Behavior Rules

### 8.1 Purpose & relationship

This section is the canonical, numbered rule set the AI must follow when
producing report text. §5 BR-17 points here; §34 (generation) turns
these rules into the production prompt; §31 (validation) checks rule
adherence; §35 (correction) applies rule 16. The 16 rules are preserved
verbatim from the requirements (below), each with a canonical
interpretation and implementation pointers. The outline scope for this
section — 16 generation rules, correction rules, and the no-invent
rule — is fully covered here: generation rules in §8.2–§8.4, correction
behavior in §8.5.

### 8.2 The 16 generation rules (verbatim)

The AI must follow these rules when generating the report:

1. Generate the report in Amharic.
2. Use the exact section structure required by the report format.
3. Match the tone and writing style of the provided samples.
4. Use the reviewed transcription as the source of truth.
5. Do not invent missing dates, branch names, times, actions, people, problems, or opinions.
6. If required information is missing, leave it blank or mark it as not specified according to the chosen prompt rule.
7. Separate completed activities from unresolved issues.
8. Put urgent problems under `መፍትሄ የሚፈሉ ጉዳዮች`.
9. Put general branch opinion or improvement opinion under `አጠቃላይ አስተያየት`.
10. Preserve branch-specific details when multiple branches are mentioned.
11. Preserve time ranges per branch when the audio contains them.
12. Write from the supervisor's point of view.
13. Do not output an explanation of how the report was generated.
14. Do not include unrelated conversation content.
15. Do not include Person 2's questions unless the answer contains report information.
16. When the user asks for correction or update after review, update the report according to the user's instruction without changing unrelated correct content.

### 8.3 Canonical interpretation

| Rule | Canonical interpretation | Implemented / verified in |
| ---- | ------------------------ | ------------------------- |
| 1 | All report text is Amharic; §7 transliteration for English/technical words | §34, §31 |
| 2 | The §6.2 skeleton with §6.3 fields; Type 1/Type 2 per §6.4 | §6, §34 |
| 3 | Tone per §6.6 and the §6.8 samples | §6.6, §31 |
| 4 | Source of truth is the transcription **after** review for body content; header metadata (to date, branch names, visit times) comes from the capture form (§6.1, §6.3) | §6.1, §6.3, §30, §34 |
| 5 | Same as §5 BR-19; no invented facts, blanks allowed | §6.1, §7.2 |
| 6 | Missing values render as blank or "not specified"; the chosen prompt rule is this default (locked decision) | §6.1, §34 |
| 7 | Completed activities vs unresolved issues are separate content classes (§6.7 routing) | §6.7 |
| 8 | Urgent problems always route to `መፍትሄ የሚፈሉ ጉዳዮች` | §6.7 |
| 9 | General/improvement opinions route to `አጠቃላይ አስተያየት` | §6.7 |
| 10 | Multi-branch details preserved; per-branch facts stay with the branch | §6.4, §6.7 |
| 11 | Per-branch time ranges from the audio are preserved, chronologically ordered | §6.4 |
| 12 | First-person supervisor voice | §6.6 |
| 13 | Generation output is the report text only — no meta-explanation | §34 |
| 14 | Off-topic audio content is dropped (applies to both voices) | §34, §31 |
| 15 | Person 2 (e.g. the boss) content is excluded unless an answer carries report information | §34, §31 |
| 16 | Surgical correction — only the addressed part changes | §8.5, §35 |

**Rule-4 reconciliation (canonical).** In keeping with §6.1/§6.3, rule 4
applies to body content: activities, unresolved issues, urgent problems,
opinions, actions, and time ranges. Header values (to date, branch names,
visit times) originate from the capture form, with the reviewed
transcription as fallback when a value is missing — and a missing value is
left blank, never invented (rules 5–6).

### 8.4 Tone & conversation-to-report transformation (verbatim)

The generated report must sound like the samples above (§6.8). The tone
should be:

- Professional.
- Direct.
- Clear.
- Work-report oriented.
- Written from the supervisor's perspective.
- Suitable to present to a boss.
- Natural in Amharic.
- Not overly decorative.
- Not conversational.
- Not casual.
- Not like a chatbot answer.

The AI must transform conversation into report language. For example,
if the audio says something conversational like `እኔ ዛሬ መድኃኒዓለም ሄጄ ቼክሊስቱን አይቼ ነበር`,
the report should not simply repeat the conversation. It should write
in the report style:

```text
በቼክሊስቱ መሰረት በመድኃኒዓለም ቅርንጫፍ የሚከናወኑ መደበኛ የአሰራር ሂደቶችን አረጋግጫለሁ።
```

The transcription is not the final report. The transcription is only
the raw Amharic text version of the recorded conversation or spoken
explanation. It may include repetition, unordered information, questions
and answers, informal wording, clarifications, corrections, side
comments, and mixed technical terms. When someone reads the
transcription, they should be able to understand the information. But
the transcription itself cannot be used directly as the report because
it is not organized, polished, or formatted. The AI must process the
transcription and convert it into the required report structure.

The spoken explanation may not follow the final report order. The AI
must organize it.

The AI is responsible for:

- Extracting date information.
- Extracting branch names.
- Extracting working time and branch time ranges.
- Extracting performed activities.
- Extracting unresolved issues.
- Extracting urgent problems.
- Extracting actions already taken.
- Extracting general opinions.
- Organizing the extracted information into the required report format.
- Writing the report in Amharic.
- Matching the tone of the provided report samples.
- Correcting or updating the generated report when the user asks after review.

The metadata-extraction bullets above apply only as the documented fallback:
when the capture form lacks a value, the AI may read it from the reviewed
transcription; otherwise the value is left blank or marked not specified.
Header values are never invented and never override the form (§6.1, §6.3,
§8.3 rule-4 reconciliation).

### 8.5 Correction & review behavior (canonical)

This subsection is the canonical home of the review-and-correct behavior:
what happens after generation, what the user can ask for, and how a
correction is applied. It implements §5 BR-08 (review-then-accept),
BR-09 (surgical corrections), BR-10 (editable at every status), and rule
16 of this section. Implementation lives in §35 (correction pipeline)
and §21 (acceptance model); the content model is `raw`/`latest` (BR-11).

#### 8.5.1 The review step (verbatim)

After the AI generates the report, the supervisor must be able to
review it. If the supervisor says something like:

- `ይህን ችግር ወደ መፍትሄ የሚፈሉ ጉዳዮች አስገባው`
- `የመውጫ ሰዓቱን 12:30 አድርገው`
- `ይህን አስተያየት አጠቃላይ አስተያየት ውስጥ አስገባው`
- `ይህን ክፍል አጥፋው`
- `ቃሉን እንደዚህ ቀይረው`

The user may also speak the correction instead of typing it (§1.4
correction modes; audio path §35).

#### 8.5.2 The surgical-update rule (verbatim)

The AI must update only the relevant part of the generated report. It
must not rewrite correct unrelated sections unnecessarily.

This is rule 16 of §8 and BR-09 of §5. A correction writes `latest`
(the current content); `raw` stays as the original; acceptance fixes
`latest` as the accepted content (BR-11). There is no version chain —
the previous content is not retained (§5 BR-10, §21).

#### 8.5.3 Conversation-to-report example (verbatim)

The requirements include a raw conversational audio transcript and its
extracted final report. The raw transcript is reproduced verbatim
below; its extracted report is §6.8 Sample 4.

```text
ቀን 09 11 18 ብራንች ጎላጉል እና ብስራተ ገብርኤል ብራንች ጎላጉል እና ብስራተ ገብርኤል ስም ቤዛ አያሌው ስም ቤዛ አያሌው ስራ የገባሁበት ሰዓት ከ አንድ ሰአት ከአምስት እስከ ሁለት ሰአት ከሃያ ጎላጉል ብራንች ከሶስት ሰአት ከ ሶስት ሰአት ከሰላሳ እስከ ዘጠኝ ሰአት ከሃያ በስራተ ገብርኤል ከዘጠኝ ሰአት ከሃምሳ አምስት እስከ አስራ ሁለት ሰአት ጎላጉል ብራንች የተሰራ ስራ በቴክ ሊስቱ መሰረት በቼክ ሊስቱ መሰረት በሁለቱም ብራንቾች የሚከናወኑ ስራዎችን በአግባቡ መሆናቸውን አረጋግጫለሁ። ሌላ የተሰራ ስራ አንዳንድ ሰራተኞች ብራንቹ የት ነበር? በጎላጎል ብራንድ ያሉ አንዳንድ ሰራተኞች ላይ የአሰራር ስርዓት ክፍተት ስለነበረ እነዚህ የአሰራር ስርዓት ያለባቸውን ሰራተኞችን እና ሱፐርቫይዘሩን ጨምሮ ያየሁትን የስራ አሰራር ክፍተት በድጋሚ እንዳይፈጽሙት መመሪያ ሰጥቻቸዋለሁ። በጎላጉል ቅርንጫፍ ማክሰኞ ሪፖርት ተደርጎ የነበረው የእቃ ማጠቢያ ሲንክ ድሬኔጅ እንዲስተካከል ጠይቄ የነበረው ማትያስ መጥቶ አስተካክሎታል። በብስራተ ገብርኤል ከዚህ በፊት ተጠይቆ የነበረው ኢንሴክት ኪለር በማትያስ አማካኝነት እንዲሰቀል አድርጌያለሁ።ሌላ ኢሹ ወይም አፋጣኝ መፍትሄ የሚፈልግ ጉዳዮች  አፋጣኝ መፍትሄ የሚፈልጉ ጉዳዮች በብስራተ ገብርኤል ያለው ዲፕ ፍራየር ኮንታክተር ችግር ነበረበት እሱ እንዲስተካከል ማትያስን አናግሬዋለሁ ስለዚህ ነገ መጥቶ ያስተካክለዋል ወይም እንደሚያስተካክለው አረጋግጦልኛል ሌላ በብስራተ ግብረ ኤል ያለ አፋጣኝ መፍትሄ የሚፈልግ ችግር በእግር ተረግጦ ኦፕሬት የሚደረግ እጅ መታጠቢያ አለ ይህ እጅ መታጠቢያ በቢውልዲንጉ ወይም ደግሞ በህንፃው ላይ ያሉ ሰራተኞች ወይም የሌላ ድርጅት ሰራተኞች አብረውን ስለሚጠቀሙ የከፍተኛ የሆነ የሳሙና እና የውሃ በክነት አለ የሆነ የሳሙና እና የውሃ ብክነት አለ። እጅ መታጠቢያውም ቶሎ ቶሎ እየተበላሸ ነው። ስለዚህ ይሄ ከህንፃው አሰራሮች ከህንፃው አሰራሮች ጋራ በመነጋገር አፋጣኝ መፍትሄ ይፈልጋል። እ ሌላ በጎላጉል ብራንች አፋጣኝ መፍትሄ የሚፈልግ ጉዳይ እ ሶኬት እና ማብሪያ ማጥፊያዎች የላሉ መስተካከል ያለባቸው ልክ ያልሆኑ አሉ። እነሱን እንደ እንዲያስተካክል ማቲያስን አናግሬው ነገ መጥቶ እንደሚያስተካክል አሳውቆኛል አጠቃላይ አስተያየት በሁለቱም ብራንቾች ያለው የስራ እንቅስቃሴ ጥሩ ነው
```

#### 8.5.4 Verification usage

- §2.4 SC-3: corrections are surgical (typed or voice instruction);
  §2.6 DoD item 4 is STT accuracy (SC-1).
- §5 BR-09 and BR-10/BR-11 are enforced here; §35 and §21 implement them.

### 8.6 Verification usage

- §2.4 SC-2 / §2.6 DoD item 3: rule adherence is verified against the
  §6.8 samples and §6.5 conventions.
- BR-17 and BR-19 are enforced through rules 1, 5, 6.

---

## Part II — Standards & Configuration (SDD)

## 9. Standards, Conventions & Code Style

### 9.1 Purpose & scope

This section is the canonical home of the engineering conventions the
entire implementation must follow: module and syntax rules (§9.2),
naming and code rules (§9.3), the JSDoc documentation standard (§9.4),
logging conventions (§9.5), UI conventions (§9.6), mandatory code
hygiene checks (§9.7), and the git protocol summary (§9.8). It
implements the §2.4 SC-6 engineering gates, the §2.5 guardrails
(JavaScript-only, no zod, no Tailwind), and the no-magic-value rule.
The header naming-rule summary is the executive statement; this section
is the canonical owner. The technology stack itself (versions,
manifests) is §13; the ADR record that backs these conventions is §14.

### 9.2 Module & syntax rules

- **ES modules only** in the backend: `import`/`export` exclusively;
  `require()`/`module.exports` are forbidden. The backend package must
  declare `"type": "module"`.
- **JavaScript only.** No TypeScript (`.ts`/`.tsx`), no TypeScript
  config, no Next.js, no Remix, no Tailwind CSS, no zod — these are
  permanent bans (§2.5, §4.3). Validation is manual resolvers with a
  consistent error shape (§29).
- **Format.** Semicolons required. Single quotes. Trailing commas.
  2-space indentation. 100-character width. LF line endings. UTF-8
  encoding. These apply to every backend and client source file.

### 9.3 Naming, imports & code rules

- **camelCase** for variables and functions.
- **PascalCase** for classes and components.
- **kebab-case** for file names and for route paths (naming model of
  this document; routes are defined in the API sections).
- **Route parameters** follow `<resource>Id`: the singular resource
  name suffixed with `Id` — a bare `:id` is never used (`:reportId`,
  `:branchId`, `:conversationId`, `:transcriptionId`, `:audioId`,
  `:userId`).
- **Document reference fields** use the plain model name — no suffix:
  `user`, `branch`, `report`, `audio`, `transcription`,
  `conversation` (`branches[].branch` in a report's embedded
  snapshot, §20). `Id`-suffixed names are reserved for route
  parameters only (§12.11-1); document fields never carry the `Id`
  suffix.
- **AI selection fields** are `provider`, `model`, `reasoning`
  (§16.2) — the per-request/message triple carries plain names, same
  no-suffix doctrine; provider-native wire keys (`thinkingLevel`,
  `reasoning_effort`) are not renamed.
- **UPPER_SNAKE_CASE** for constants and environment variables.
- Reusable components are named `Mui*`; page components use plain
  PascalCase (§46).
- Unused parameters use a `_` prefix (`_req`, `_res`, `_next`) to
  signal intentional non-use; no unused imports, no unused exports, no
  dead code (unused constants, variables, or methods are removed).
- Components are functional components with hooks; props are
  destructured in the function signature; event handlers are prefixed
  with `handle`.
- The authenticated user id is read via `req.user._id.toString()`.
- The primary key of every Mongoose document is accessed as `_id`
  only — `report._id.toString()` / `report?._id`; code never refers to
  it as `id` (`report.id` is not used). Route parameters remain
  `<resource>Id` (§9.3 route-parameter rule) — they are URL parameter
  names, not document fields.
- **Import order:** built-in modules → npm packages → local modules,
  alphabetical within each group.
- **Import style:** named imports for utilities and functions; default
  import for React components; `*` imports are never used.
- All imports must be referenced in the file body (no unused imports).

### 9.4 JSDoc & documentation conventions

JSDoc is the type-documentation mechanism (no TypeScript). The
standard:

- JSDoc block comment on every file or module. Module-level:
  `@module path/name` at the top of each file — `@module`, not
  `@file`, including for theme customizations and `AppTheme.jsx`.
- Functions: `@param {type} name - description`, `@returns {type}`,
  `@throws {ErrorType} reason` where applicable.
- Constants: `@type {TypeDefinition}` on exported constants.
- Object shapes: `@typedef {Object} ModelName` with
  `@property {Type} fieldName - description`.
- Express types: `import('express').Request`,
  `import('express').Response`, `import('express').NextFunction`.
- Mongoose async middleware: `@returns {Promise<void>}`.
- Components: `@param {Object} props` documenting name, label, error,
  helperText, and control props.
- Async functions: `@returns {Promise<Type>}`.
- Work-product rule: documentation files are never created
  proactively; markdown/README files are written only when explicitly
  requested (§9.7 hygiene).

### 9.5 Logging conventions

- All backend logging goes through `utils/logger.js` (Winston). The
  `console.log` ban in backend code is absolute — Winston replaces it
  in all environments. `console.log` is not used in the frontend.
- Log levels: error, warn, info, http, verbose, debug, silly.
  Development = debug level; production = info level.
- Module labels via Winston child loggers: Server, DB, Auth, AI-Addis,
  AI-Gemini, AI-Nvidia.
- Log files are written to the `logs/` directory (gitignored), rotated
  daily via the Winston daily-rotate-file transport, and auto-deleted
  after 30 days (§11 retention constants).
- Safe logging (production): never log passwords, JWT token values,
  raw cookies, API keys or secrets, raw audio file contents, full
  transcription texts, or full generated report texts. Use message IDs
  or truncated previews instead.
- AI provider logs: log provider, model, status code, and timing only;
  never request or response bodies in production (ADR-019).

### 9.6 UI conventions (global)

- MUI Community edition only (ADR-012); styling via MUI `sx` and
  `styled()` only — no Tailwind, no other CSS frameworks (§43, §44).
- MUI imports are tree-shaken; reusable components set a `displayName`.
- Reusable input components use `forwardRef`.
- Forms use `react-hook-form` with `register` by default:
  - `useForm({ mode: 'onBlur' })` with destructured
    `register, handleSubmit, formState`.
  - `Controller` only for components whose `register` cannot work
    (MUI X DatePicker/TimePicker); each `Controller` use is justified
    with a code comment.
  - Cross-field validation via `validate: (value) => value ===
    getValues('field') || 'message'`; no `watch`.
  - Backend errors are never routed through `setError`; the network
    layer (§42) normalizes them — including field-validated 422
    errors — and the UI surfaces them via toasts (§60). `setError`
    remains for UI client-side rule failures only.
  - No debounce, never `useDebounce`; direct `register` integration
    only.
  - Submit buttons: `size="small"`, `isSubmitting` disables them, and
    they must not shrink on flex.
- These rules are applied by the page sections (§52, §54) and the
  reusable library (§46).

### 9.7 Code hygiene checks (mandatory per change)

After every change:

- `node --check` on all backend files.
- `npx vite build` on the client with 0 errors; delete `dist/*` after
  the check always.
- Check every file (new and edited) for: unused imports, unused
  variables, unused parameters, missing JSDoc, hardcoded magic values,
  deprecated MUI props; check all new components.
- No `.id` property access and no `id` fields on models or DTOs — the
  primary key is `_id` everywhere (§9.3).

Build commands:

| Environment    | Command                  | Description                    |
| -------------- | ------------------------ | ------------------------------ |
| Backend dev    | `npm run dev` (backend)  | nodemon server.js on port 4000 |
| Backend prod   | `npm start` (backend)    | Production start               |
| Backend check  | `node --check`           | Syntax validation              |
| Frontend dev   | `npm run dev` (client)   | Vite on port 3000              |
| Frontend build | `npm run build` (client) | Vite production build          |
| Frontend lint  | `npx eslint src/`        | ESLint                         |

### 9.8 Git protocol (summary)

- Implementation phases use feature branches named
  `phase-N-description`; no direct commits to `main`.
- The phase protocol has six steps in order: (1) Pre-Git: check status
  and create feature branch; (2) deep codebase analysis; (3) analysis
  of all prior phases; (4) phase execution and validation; (5) user
  review and explicit approval; (6) post-git: stage, commit, push,
  merge, delete branch. Step 6 never runs without explicit user
  approval.
- Commit messages: `feat: phase N description` for feature phases;
  `chore: phase N description` for hardening. No amending after push.
- Post-git flow (each step verified before proceeding): `git status` +
  `git branch -vv` → `git fetch origin` → handle uncommitted changes →
  `git pull origin <branch>` (halt on merge conflict and prompt the
  user) → stage with `git add .` after `git diff` review → commit →
  `git push origin <branch>` → checkout `main`, pull → merge feature
  branch (halt on conflict) → push `main` → delete local and remote
  feature branch after verifying the merge → final verification
  (`git status` clean, `git branch -vv` in sync, `git log --oneline -5`
  shows the recent commit).

### 9.9 Verification usage

- §2.4 SC-6 implements these conventions as success gates; §2.6 DoD
  item 2 (SC-6/SC-7 gates) is enforced here.
- The no-magic rule (§9.1, §11.1) applies to every later section: any
  section that adds a literal must point at its home in §10 or §11.
- §4.3 exclusions are mirrored here; any reversal requires a §9, §13
  change and explicit user approval (§4.3).
- Implementation of the runtime behaviors is canon in §27 (logger,
  shutdown), §29 (validators), §46 (components), §52/§54 (forms).

---

## 10. Environment & Configuration

### 10.1 Purpose & scope

This section is the canonical home of process configuration: the
`.env` policy, the single frozen `env` object exported from
`config/env.js`, and the backend and client environment-variable
inventories. It implements the §2.4 SC-7 key-storage rule and the
SC-6 no-magic rule for everything configuration-related. Constants
that are not environment-specific live in §11; this section covers
values that vary by environment.

### 10.2 `.env` policy

- `.env` files are gitignored and never committed.
- `.env` files exist locally with placeholder or correct values.
- `.env.example` files are never created.
- All API keys (Addis AI keys — starting with `sk_`; Gemini; Nvidia)
  are stored only in `backend/.env`. They must never appear in client
  code, Vite env vars sent to the browser, `localStorage`, Redux
  state, or client logs.
- Client environment variables must be prefixed `VITE_` and are
  accessed via `import.meta.env.*` only.
- If the pre-defined `.env` does not include a required variable, the
  loader resolves it by checking `backend/.env` and `client/.env`
  before applying a default or failing fast (§10.3).

### 10.3 Configuration object — `config/env.js`

- `config/env.js` is the only file that reads `process.env`.
  `process.env` is never accessed anywhere else.
- The module exports a single validated defaults-applied
  `Object.freeze()`d `env` object.
- Adding an env var is a three-step process:
  1. add the variable to the local `.env`;
  2. add a field to the config object in `config/env.js`;
  3. add validation/default logic in `config/env.js`.
- Lookup order: (1) the live process environment, (2) the pre-defined
  `.env`, (3) `backend/.env` and `client/.env` (both files are
  consulted), (4) the `Default` column of §10.4–§10.5. A Required
  variable missing from every location fails fast at boot.

### 10.4 Backend environment variables

| Variable             | Required | Default                      | Description                              |
| -------------------- | -------- | ---------------------------- | ---------------------------------------- |
| NODE_ENV             | No       | development                  | Runtime environment                      |
| PORT                 | No       | 4000                         | Backend HTTP port                      |
| MONGO_URI            | Yes      | —                            | MongoDB connection string (atlas/local) |
| CLIENT_ORIGIN        | No       | http://localhost:3000        | CORS origin; `credentials: true`         |
| JWT_ACCESS_SECRET    | Yes      | —                            | Signs the 15-minute access token         |
| JWT_REFRESH_SECRET   | Yes      | —                            | Signs the 7-day refresh token            |
| ADDIS_API_KEY        | Yes      | —                            | Addis AI API key (starts with `sk_`)     |
| GEMINI_API_KEY       | Yes      | —                            | Google Gemini API key (backend only)     |
| NVIDIA_API_KEY       | Yes      | —                            | NVIDIA API key (backend only)            |
| NVIDIA_API_URL       | Yes      | —                            | NVIDIA NIM chat-completions base URL; official value per §16.4 (§16) |
| AI_TIMEOUT_MS        | No       | 30000                        | AI provider request timeout in ms, env-overridable (§16) |

Variables marked Required with no default have no fallback values;
after the §10.3 lookup chain (pre-defined `.env`, `backend/.env`, and
`client/.env`) yields no value, the app fails fast at boot
(validation in `config/env.js`).

### 10.5 Client environment variables

| Variable          | Required | Default                        | Description              |
| ----------------- | -------- | ------------------------------ | ------------------------ |
| VITE_API_BASE_URL | Yes      | http://localhost:4000/api/v1   | Backend API base URL     |
| VITE_APP_NAME     | Yes      | Report Builder                 | Application display name |

Client reads only VITE_ variables. No API keys are ever exposed there
(§10.2).

### 10.6 Verification usage

- §2.4 SC-7 (keys only in `backend/.env`) and SC-6 (env objects
  frozen) are enforced via this section.
- Consumers of the `env` object: server boot (§26), CORS (§27), auth
  (§28), providers (§16, §33–§37).
- New environment variables are always added through §10.3; any bypass
  (reading `process.env` elsewhere) violates §10.3 and fails review.

---

## 11. Constants & httpStatus

### 11.1 Purpose & scope

- The canonical homes for every non-environment literal are
  `backend/utils/constants.js` and `client/src/utils/constants.js`,
  and `backend/utils/httpStatus.js` for HTTP status codes (client
  mirrors the status-code semantics in `client/src/utils/httpStatus.js`
  naming).
- No magic values anywhere: every literal used by §9.1 rules must
  resolve to §11 or §10; validation constants are never hardcoded in
  validator files (they come from the constants file).
- New constants are added to the relevant constants file — never
  declared inline in a controller, model, component, or utility.

### 11.2 Constraint rules

- Every constants group is `Object.freeze()`d on export; mutation of
  imported constants is forbidden.
- Groups are named with UPPER_SNAKE_CASE keys consistent with the
  group organisation below.
- Numeric HTTP codes never appear in code: key-value pairs map the
  semantic name (§11.6).
- Provider ids, report statuses, and language codes are domain
  constants owned here (§5, §16, §7.7), used identically everywhere
  (§5.6).

### 11.3 Backend constants inventory

| Constant                          | Value / members                              | Used by                     |
| --------------------------------- | -------------------------------------------- | --------------------------- |
| `AUDIO_MAX_DURATION_SEC`          | 900                                          | §32, §53                    |
| `AUDIO_MAX_SIZE_BYTES`            | 52428800 (50 MB)                             | §32, §53                    |
| `AUDIO_ALLOWED_MIME_TYPES`        | `[audio/mpeg, audio/wav, audio/mp4, audio/webm]` | §32, §53            |
| `PAGINATION_DEFAULT_PAGE`         | 1                                            | §30                         |
| `PAGINATION_DEFAULT_LIMIT`        | 10                                           | §30                         |
| `PAGINATION_MAX_LIMIT`            | 100                                          | §30                         |
| `ADDIS_AI_STT_MAX_DURATION_SEC`   | 60                                           | §33                         |
| `BCRYPT_SALT_ROUNDS`              | 12                                           | §28                         |
| `ACCESS_TOKEN_TTL_MIN`            | 15                                           | §28                         |
| `REFRESH_TOKEN_TTL_DAYS`          | 7                                            | §28                         |
| `AI_TEMPERATURE`                  | 0.2                                          | §34                         |
| `AI_MAX_OUTPUT_TOKENS`            | 2048                                         | §34                         |
| `AI_TOP_P`                        | 0.9                                          | §34                         |
| `AI_TOP_K`                        | 40                                           | §34                         |
| `AI_CORRECTION_MAX_OUTPUT_TOKENS` | 2048                                         | §35                         |
| `AI_CORRECTION_TEMPERATURE`       | 0.15                                         | §35                         |
| `AI_PROVIDER_RETRIES`             | 3                                            | §16                         |
| `AI_PROVIDER_BACKOFF_BASE_MS`     | 1000                                         | §16                         |
| `ADDIS_AI_BASE_URL`               | `https://api.addisassistant.com`             | §16                         |
| `GEMINI_BASE_URL`                 | `https://generativelanguage.googleapis.com/v1beta` | §16                |
| `RATE_LIMIT_GLOBAL_WINDOW_MIN`    | 15                                           | §27                         |
| `RATE_LIMIT_GLOBAL_MAX`           | 100                                          | §27                         |
| `RATE_LIMIT_AUTH_WINDOW_MIN`      | 15                                           | §27                         |
| `RATE_LIMIT_AUTH_MAX`             | 20                                           | §27                         |
| `RATE_LIMIT_AI_WINDOW_MIN`        | 1                                            | §27                         |
| `RATE_LIMIT_AI_MAX`               | 10                                           | §27                         |
| `ARCHIVED_TTL_SECONDS`            | 2592000 (30 days)                            | §31, §62                    |
| `LOG_RETENTION_DAYS`              | 30                                           | §26 (logger)                |
| `SWEEPER_INTERVAL_MS`             | 3600000 (1 hour, default)                    | §31, §62                    |

### 11.4 Domain constants

| Constant          | Value                                                     | Used by |
| ----------------- | --------------------------------------------------------- | ------- |
| `REPORT_STATUSES` | `['draft', 'audio_attached', 'transcribed', 'reviewed', 'completed']` | §5, §31, §51 |
| `AI_PROVIDERS`    | `['addis', 'gemini', 'nvidia']`                           | §16, §34, §35, §36 |
| `LANGUAGE_CODES`  | `{ am: 'am', en: 'en' }` with `om`/`ti` reserved, not activated | §7.7, §16, §33, §34 |
| `AI_MODELS`       | per-provider model registry, see §16.2: every model entry carries an id, a `default` flag, and a `reasoning` capability flag. Initial registry: addis `[Addis-፩-አሌፍ]` (default, reasoning off); gemini `[gemini-3.1-flash-lite]` (default, reasoning on); nvidia `[deepseek flash 4]` (default, reasoning on) | §16, §34, §35, §36, §54 |
| `AI_REASONING_EFFORTS` | `['off', 'low', 'medium', 'high']`   | §16, §34, §35, §36, §54 |

### 11.5 Client constants inventory

The client constants file mirrors the shared business sets consumed
by the UI:

| Constant              | Value (mirror of)    | Used by |
| --------------------- | -------------------- | ------- |
| `REPORT_STATUSES`     | §11.4                | §51, §50 |
| `AI_PROVIDERS`        | §11.4                | §54     |
| `AI_MODELS`           | §11.4                | §54     |
| `AI_REASONING_EFFORTS`| §11.4                | §54     |
| `PAGINATION_*`        | §11.3                | §50     |
| `AUDIO_*`             | §11.3 (MIME list)    | §53     |

Client-side magic-value ban and freeze rules are identical to the
backend (§11.2).

### 11.6 httpStatus.js mapping

Status codes are consumed by semantic name only — numeric literals
are banned on both sides. Requirement-established codes:

| Name                     | Code | Use case                                     |
| ------------------------ | ---- | -------------------------------------------- |
| `OK`                     | 200  | Successful reads and updates                     |
| `CREATED`                | 201  | Resource creation                            |
| `NO_CONTENT`             | 204  | Successful deletion                          |
| `BAD_REQUEST`            | 400  | Malformed requests                           |
| `UNAUTHORIZED`           | 401  | Missing/invalid credentials                 |
| `FORBIDDEN`              | 403  | State/lifecycle blockers (e.g. generate on archived) |
| `NOT_FOUND`              | 404  | Missing resource (report/branch "not found") |
| `CONFLICT`               | 409  | Duplicate key (11000), duplicate email, archive/restore lifecycle violations |
| `UNPROCESSABLE_ENTITY`   | 422  | Validation failures                          |
| `TOO_MANY_REQUESTS`      | 429  | Rate-limit tiers (§11.3)                     |
| `INTERNAL_SERVER_ERROR`  | 500  | Unexpected errors                            |
| `BAD_GATEWAY`            | 502  | AI provider errors (any provider)            |

Any additional code used later must be added to `httpStatus.js` with
a named key before it is referenced (e.g. `CONFLICT` if not already
present — add it there, never a numeric literal).

### 11.7 Verification usage

- §2.4 SC-6 (no magic values / frozen constants) and its DoD gate
  are enforced here and by §9.7.
- Every later section (esp. §31–§35, §53, §62) must consume the §11
  constants; where a section in this hierarchy first uses a new
  literal, it lists the name it introduces.
- §33 chunking uses `ADDIS_AI_STT_MAX_DURATION_SEC`; §62 sweeper uses
  `ARCHIVED_TTL_SECONDS` and `SWEEPER_INTERVAL_MS`; §26 logger uses
  `LOG_RETENTION_DAYS` — all values in §11.3, no magic anywhere.

---

## Part A — Architecture (SAD/HLD)

## 12. System Architecture Overview

### 12.1 Purpose & scope

This section is the canonical home of the system architecture: the
high-level component model, the end-to-end processing sequence
(record → upload → STT → review → generate → correct → export), the
backend and frontend layering, the authentication/session model, the
AI provider integration boundary, the data/storage architecture, the
runtime topology, and the set of locked decisions adopted in §12.11.

This is a high-level design (SAD/HLD). Low-level detail lives in its
owned sections: data structures in Part B (§18–§25), backend internals
in Part C (§26–§40), frontend internals in Part D (§41–§59), and
cross-cutting mechanics (sweeper, security, performance) in Part E
(§60–§64). Every pointer below forwards to its low-level home; §12
never duplicates what those sections own.

The rules of this document apply here as everywhere: naming follows
§9 (camelCase, UPPER_SNAKE_CASE constants, route parameters in
`<resource>Id` form, primary keys as `_id` — never `id`),
configuration follows §10 (frozen `env` object, no
`process.env` access outside `config/env.js`), and every literal
resolves to a §11 constant with semantic `httpStatus` names. Success
gates §2.4 SC-6 and SC-7 are satisfied by the structures defined in
this section.

### 12.2 Architectural principles & constraints

The architecture derives exclusively from the statement in §1.3, the
goals in §2, and the deferral decisions in §4:

1. **Single web application.** One product centrally manages
   branches, daily reports, transcriptions, generated reports, AI
   conversations, user profiles, and analytics
   (G6, §2). There is no second application, plugin, or standalone
   service.
2. **Browser-first runtime.** The supervisor drives a Vite
   single-page application in the browser; no desktop, no native
   app, no PWA packaging in scope (§4).
3. **Asynchronous, non-realtime pipeline.** The core loop is
   request/response: clip capture → upload → server-side processing.
   There is no streaming transcription, no server-pushed state, and
   no browser WebSocket today (D2, §4). All pipeline sections (§33,
   §53) and §64 assume this; realtime is deferred to §66 and would
   require the component registered at §12.8/§33 only under separate
   approval.
4. **AI is backend-orchestrated.** Every AI call (speech-to-text and
   text generation) originates on the backend; provider keys live
   only in `backend/.env` (§10.2, SC-7) and never reach the browser.
   The browser never talks to a provider directly (proxy rule, §16).
5. **JS-only, minimal surface.** No TypeScript, no Next.js/Remix, no
   Tailwind; the stack is owned by §13 with the package manifests as
   the version source of truth.
6. **Fixed request pipeline.** The security middleware chain
   (`helmet -> cors -> compression -> cookie-parser -> express-mongo-sanitize
   -> rate-limit`) is never reordered and never loses a link (§2.4,
   enforced in §27).
7. **Single route registry.** All routes mount under `/api/v1` and
   every route module is registered in `routes/index.js`; `app.js`
   registers no route directly (Part C §26).
8. **Write paths are transactional.** All write-flows use MongoDB
   sessions with explicit commit/abort and `endSession()` in
   `finally`; model hooks, instance methods, and static methods are
   session-aware (§18, §27). Read-only endpoints do not use
   transactions.
9. **No magic numbers.** Every literal and status code is a named
   §11 constant referenced by semantic name (SC-6).
10. **Server is the single source of record.** The browser keeps
    only ephemeral UI state (Redux and local component state) and a
    cache of server data via RTK Query; possibly stale copies are
    always re-fetched (§42).
11. **Records outlive resources.** Archive marks
    `isArchived`/`archivedAt`; permanent deletion happens only through
    the sweeper after the 30-day window (BR-15), with TTL indexes on
    `archivedAt` as the MongoDB-internal safety net (BR-17, §18,
    §62).
12. **Ethiopian language first.** Amharic is the language of both UI
    chrome and content when the §7.6 boundary allows; providers may
    change for generation but the produced report is always Amharic
    (§6, §16).

### 12.3 High-level component diagram

The system has two runtime components plus external providers. The
topology is:

```
+----------------------------------------- Browser (client SPA) -------------------------------------------+
|  Vite build · React · MUI (community) · RTK Query (fetchBaseQuery + baseQueryWithReauth)                  |
|  react-hook-form · MUI X (DataGrid, Chat, DatePicker) · rich-text editor (planned @tiptap/react, §13.5) · ethiopianDate                      |
|  PublicLayout / AppShell · pages §48–§59 · toasts & state protocol (§60)                                   |
+------------------------------------------------------------------------------------------------------------+
               |                                     HTTP/1.1 JSON under /api/v1
               |                                     cookies (httpOnly access + refresh) sent automatically
               v                                     CORS origin http://localhost:3000
+----------------------------------------- Node.js Express backend (port 4000) -------------------------------+
|  fixed security chain: helmet -> cors -> compression -> cookie-parser -> express-mongo-sanitize -> rate-limit      |
|  config/env.js (frozen) · Winston logger · utils/constants.js · routes/index.js -> controllers            |
|  controllers (asyncHandler, sessions) -> models (session-aware) -> response envelope                       |
|  global error handler · sweeper timer (§62) · graceful shutdown                                            |
+----+----------+------------+------------------+--------------------+-------------------------------+------+
     |          |            |                  |                  |               |
     v          v            v                  v                  v               v
+----+----------+------------+------------------+--------------------+-------------------------------+------+
     |          |            |                  |                  |               |
     v          v            v                  v                  v               v
+-----------+  +-------------+  +------------------+  +--------------------+  +-------------+  +----------------------+
| MongoDB    |  | local FS       |  | Google Docs API    |  | Addis AI            |  | Gemini      |  | Nvidia AI            |
| (Mongoose) |  | uploads/audio/ |  | (export, user-     |  | (Amharic STT +      |  | (text       |  | (text generation)    |
| TTL        |  | gitignored     |  | owned Drive file)  |  | generation, fetch)  |  | generation; |  | axios)               |
| indexes;   |  | §22, §32       |  | §37                |  | §16, §33            |  | axios)    |  | §16                  |
| §19–§24    |  |                |  |                    |  |                     |  |            |                      |
+-----------+  +-------------+  +------------------+  +--------------------+  +-------------+  +----------------------+

```

Attribution: the browser (client) and Node backend are the only
execution components; MongoDB and the local filesystem are the two
persistence components; Addis AI, Gemini, and Nvidia are AI providers;
Google Docs is the external export target. All external calls are
outbound-only from the backend.

### 12.4 End-to-end sequence (canonical)

The canonical loop matches §1.5 exactly:

**record → upload → STT → review → generate → correct → accept → export**

| # | Stage     | What happens here (from §1.5)                                   | Principal section(s) |
| - | --------- | --------------------------------------------------------------- | -------------------- |
| 1 | Record    | The supervisor records one or more Amharic audio clips per visit/branch; clip limits (duration 900 s, 50 MB, MIME allowlist) from §11 | §53, §32, §11 |
| 2 | Upload    | Clips are uploaded as multipart form uploads through multer; files land in `backend/uploads/audio/` (gitignored); validation and temp-cleanup rules of §32 | §32 |
| 3 | STT       | The backend prepares the audio (chunking per the 60 s threshold, `ADDIS_AI_STT_MAX_DURATION_SEC`), calls Addis AI with retries, and persists the raw transcription (`raw` set from the STT result, `latest` initialized to it) | §33, §11 |
| 4 | Review    | Transcription review supports the four paths of §1.4: direct edit (Mode 1 type=direct), typed instruction (Mode 2), voice instruction (Mode 3), or re-transcription; all persist through the same pipeline | §31, §54, §35 |
| 5 | Generate  | A provider (addis, gemini, or nvidia) generates the report in the required Amharic structure from the reviewed transcription, under §8 rules | §34, §16 |
| 6 | Correct   | The supervisor reviews the generated report; changes are surgical (only relevant parts) and never rewrite correct unrelated sections; correction modes: direct edit, typed instruction, or voice instruction (§1.4) | §34, §35 |
| 7 | Accept & export | The accepted content is persisted (`latest` fixed at accept, BR-11); export happens in the chosen format: PDF, TXT, CSV, XLSX from the client or Google Docs from the backend | §37, §58 |

When several clips belong to one branch, they merge into the branch's
set of items in chronological order (§6.4) before generation (§1.5).

The same centralized sequence is reused across the whole product: the
Reports list → details → wizard → transcription review → report review
(page toolbar) are all thin views over it (§50–§54, §58). The
frontend never re-implements pipeline steps — each step stays a
backend service call. Page content lives in Part D.

### 12.5 Backend architecture (HLD)

- **Runtime:** a single Node.js/Express process; nodemon in
  development, `npm start` (backend) in production (§9.7). The web
  server hosts `/api/v1` and, in production, the built client
  static files (§65).
- **Layers (top → bottom):**
  1. **Middleware chain** — the fixed security stack plus CORS,
     cookie-parser, body parsing, and rate limiters (§27);
  2. **Routing layer** — every route module lives in `routes/` and is
     mounted in `routes/index.js` (§26); each route applies its
     validator middleware before its controller (§29);
  3. **Controller layer** — one controller file per domain; handlers
     are wrapped with `express-async-handler`; write handlers use the
     transaction template (startSession → startTransaction → writes →
     commit/abort → endSession in finally); errors are forwarded via
     `next(error)` (§27);
  4. **Data layer** — Mongoose models (session-aware hooks and
methods), `mongoose-paginate-v2` on list endpoints (page 1, limit
      10, max 100), TTL indexes where declared (§18–§24).
- **Response contract:** every HTTP response is the envelope
  `{ success, message, data }` (paginated lists add
  `{ docs, page, limit, totalDocs, totalPages }`); error responses
  reuse the same envelope with `data: null` (§5, §27).
- **Errors:** `CustomError`; the global error handler logs via
  Winston; development returns the stack trace, production a generic
  message (§27).
- **Background work:** the sweeper is a single timer inside the web
  process (every `SWEEPER_INTERVAL_MS`, §11) running two passes —
  expired-archives hard delete and orphan sweep (dependents + audio
  files); each parent deletion runs in its own transaction (§62). TTL
  indexes on `archivedAt` (Report §21, Branch §20) remain the
  MongoDB-only safety net.
- **No queues:** no job queues, message brokers, or workers — all
  pipeline work is request/response except the sweeper.

### 12.6 Frontend architecture (HLD)

- **Runtime:** a Vite single-page application; dashboard via
  `main.jsx`/`App.jsx`; two top page layouts — `PublicLayout` (auth
  pages) and `AppShell` (authenticated shell with sidebar) — §41,
  §47.
- **Store & data access:** Redux Toolkit with RTK Query; one API
  layer via `createApi` (base URL from `VITE_API_BASE_URL`, §10),
  `fetchBaseQuery` with credentials, and `baseQueryWithReauth`;
  domain endpoints are injected on their pages (§41, §42).
- **Transform & error layer:** all success data is unwrapped from
  the envelope in the network layer; all backend errors (except the
  401 reauth path) are normalized into a toast-ready error
  (`message`, plus field errors for 422) in `baseQueryWithReauth`;
  the UI uses toasts, never `setError`, for backend errors (§9.6,
  §42, §60).
- **Entity keys:** cached entities use `_id` as the key
  (`selectId: (entity) => entity._id`) per §9.3.
- **Design system:** MUI Community with `sx`/`styled` (§9.6, §43–§44);
  reusable components are named `Mui*` (§46); icons-only responsive
  behavior and overflow rules live in §45; the theme supports
  Ethiopic text (§43).
- **Pages:** map §48–§59; shared behavior (loading, error, empty
  states, toasts, confirm dialogs) via §60.

### 12.7 Authentication & session architecture

- **Credentials:** email + password (bcrypt, 12 rounds) — Google
  OAuth is a stub with a provider-neutral architecture (ADR-031,
  §28).
- **Tokens:** two JWTs: access (15 min) and refresh (7 days, path
  `/api/v1`, signed with `JWT_REFRESH_SECRET`); both delivered as
  httpOnly cookies (§10.4, §28).
- **Reauth:** the client reauth chain in §42 is the single owner:
  on 401 → `POST /api/v1/auth/refresh` → on success retry the original
  request; on failure clear auth state and redirect to login. 401s
  are never toasted (§9.6, §42).
- **Rotation:** refresh-token rotation on each refresh flow; forced
  logout and session listing live in §28/§57.

### 12.8 AI integration architecture (HLD)

- **All calls from backend** (proxy rule): the browser never
  contains provider keys or issues provider calls (§10.2 SC-7).
- **Transport:** Addis AI calls use native `fetch` on the backend;
  Gemini/Nvidia use axios (details in §16).
- **Providers:** Addis AI — Amharic-first, default provider, used for
  STT and also for text generation; Gemini and NVIDIA — supported
  providers for text generation with a fallback chain (§16, §34).
- **Fallback/retry:** failure of the current provider triggers the
  fallback chain in the configured order, with retries counted per
  provider rules (§16, §34).
- **STT specifics:** chunked transcription — when audio is longer
  than the 60 s chunk, the backend splits it and transcribes chunks
  sequentially (chunk size from §11; pipeline §33).
- **Generation & correction:** generation uses the temperature,
  top-p, top-k, and max-output-token constants from §11; typed and
  voice instructions pass through the §34/§35 services (surgical
  partial-edit approach).
- **Chat:** conversation turns saved for display via §36 (AI Chat &
  Conversation) and rendered in §55.

### 12.9 Data & storage architecture

- **Primary store:** MongoDB via Mongoose for all persistence of
  product data — models §19–§24; conventions (timestamps,
  transforms, indexes, TTL, sessions) defined in §18.
- **Audio files:** binary audio is stored on the backend local
  filesystem, in `backend/uploads/audio/`, which is gitignored (§32).
  Metadata (path, size, duration, MIME) is in the Audio document. No
  GridFS/S3/object storage is in use.
- **Exports:** client-side exports (PDF, TXT, CSV, XLSX) are
  generated in the browser and downloaded; Google Docs documents are
  created in the user's own Drive via the export API with the
  `drive.file` scope (§37).
- **Retention:** everything honoring the sweeper rules of §62 (30
  days / `ARCHIVED_TTL_SECONDS`); audio files removed from the
  filesystem after commit, retried by the orphan sweep on failure
  (§31, §62).
- **Mock data & seeding:** developed on the §40 seed endpoints /
  §25 mock-content rules; mock data support sessions (§18, §40).

### 12.10 Ops & runtime architecture

- **Development:** two processes on the developer machine: client
  (Vite, port 3000) and backend (nodemon, port 4000); the client's
  API base is `VITE_API_BASE_URL` (§10); CORS allows
  `CLIENT_ORIGIN=http://localhost:3000` with credentials (§27).
- **Production:** the client is built to static files and served by
  the backend Express instance; a single service, no containers,
  no external orchestration, no CDN in scope (§65).
- **Boot:** server startup requires the §10.3 env lookup; required
  vars from §10.4; the app fails fast at boot when the lookup chain
  (§10.2–§10.4) is exhausted.
- **Logs:** Winston writes to `logs/` (daily rotation, 30-day
  retention) (§9.5); safe-logging rules prevent secrets in logs
  (ADR-019).
- **Shutdown:** graceful shutdown stops accepting connections,
  clears the sweeper timer, closes the server (§26).
- **Health check:** `/api/v1` health endpoint (§26).

### 12.11 Locked decisions (single source of truth)

This specification is the single source of truth. The decisions below
are normative: they are stated once here and applied wherever they are
referenced.

| # | Decision                                                                                           | Applied in                                             |
| - | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| 1 | Route parameters use the `<resource>Id` form (`:reportId`, `:branchId`, `:transcriptionId`, `:conversationId`); a bare `:id` is never used | §9.3; route definitions (§30–§39, §49–§54) |
| 2 | Backend errors (including 422) are surfaced through **toasts**; `setError` is never used for server errors | §9.6, §12.4, §12.6, §42, §60 |
| 3 | Every document's primary key is **`_id`**; code never uses `id` (`report._id`, never `report.id`) | §9.3, §12.6, §41–§42 |
| 4 | Environment lookup chain: pre-defined `.env` → `backend/.env` and `client/.env` → default → fail-fast (required) | §10.2–§10.4, §12.10 |
| 5 | Amharic STT is provided by Addis AI **exclusively**; Gemini and NVIDIA are text-generation providers only | §12.8, §16, §33 (ADR-001; index §14) |

(An ADR index lives in §14; ADR-001 is listed there.)

### 12.12 Verification usage

- §1.5 (the canonical loop), §1.3 (vision), §2 (G6), §2.4 (SC-6,
  SC-7) and §4 (D2 realtime defer) chain into this section; all
  statements trace back and none are invented.
- Every later architecture section (§13–§17) builds on §12: §13
  names the stack, §14 lists the ADRs referenced here (§12.11),
  §15 expands the file structure, §16 adds provider detail, §17 the
  data overview (ERD + relationships + cascade map).
- Cross-references from Parts C and D anchor on the sequence of §12.4
  and the backend and frontend HLD views (§12.5, §12.6).
- This section introduces no new constants; all numbers used here
  resolve to §11 or §10, per SC-6.

---

## 13. Technology Stack & Versions

### 13.1 Purpose & scope

This section is the canonical home of the technology stack: the
platform foundations (§13.2), the backend package inventory (§13.3),
the client package inventory (§13.4), the list of approved planned
dependencies (§13.5), the permanent exclusions (§13.6), and the
dependency-addition protocol (§13.7).

The package manifests are the sole version authority: the tables in
§13.3 and §13.4 are transcripts of the current manifests, not
recommendations. Any divergence between this section and a manifest
is resolved in favor of the manifest, and this section is updated with
the manifest. Reversing a stack decision requires a change to §9 and
§13 together with explicit approval (§4.3, §9.2).

The rules of this document apply here: naming from §9 (`<resource>Id`,
`_id`, UPPER_SNAKE_CASE constants), configuration from §10, and all
non-version literals resolve to §11 (no magic values). Version numbers
are manifest data, so they appear only in the tables of this section.

### 13.2 Platform foundations

- Every npm package is ESM: both manifests declare
  `"type": "module"` (§9.2).
- **Node.js:** neither manifest pins a Node version. The runtime is
  the installed LTS of the environment; deployment binds the runtime
  (§65).
- **Package manager:** npm. Both `package-lock.json` files are
  committed (the gitignore rules ignore `node_modules`, never lock
  files), so installs are reproducible.
- **Processes:** two runtime components — backend (Node.js/Express,
  port 4000) and client (Vite dev server, port 3000; production
  serves the built client from the backend, §12.10, §65). MongoDB is
  external to both (§12.3).
- **API contract:** REST/JSON with the envelope of §5; all AI calls
  leave the backend only (§12.8, §16).

### 13.3 Backend stack & dependency inventory

Transcript of `backend/package.json` (dependencies and
devDependencies, caret ranges preserved verbatim):

| Package                     | Range        | Role                                  | Anchor     |
| --------------------------- | ------------ | ------------------------------------- | ---------- |
| express                     | ^5.2.1       | Web framework (Express 5)             | §26, §27   |
| mongoose                    | ^9.7.4       | ODM / data layer                      | §18–§24    |
| express-async-handler       | ^1.2.0       | Controller wrapper                    | §26, §27   |
| helmet                      | ^8.3.0       | Security headers (chain, first)       | §27        |
| cors                        | ^2.8.6       | CORS with credentials                 | §27, §10.4 |
| compression                 | ^1.8.1       | Response compression (chain)          | §27        |
| cookie-parser               | ^1.4.7       | Cookie parsing                        | §27, §28   |
| express-mongo-sanitize      | ^2.2.0       | Strips `$` and `.` from input (fixed chain, step 5) | §27 |
| express-rate-limit          | ^8.5.2       | Rate-limit tiers                      | §27        |
| express-validator           | ^7.3.2       | Request validation middleware         | §29        |
| mongoose-paginate-v2        | ^1.9.5       | List pagination (1/10/100)            | §27        |
| jsonwebtoken                | ^9.0.3       | JWT access + refresh tokens           | §28        |
| bcryptjs                    | ^3.0.3       | Password hashing (12 rounds)          | §28        |
| multer                      | ^2.2.0       | Audio upload handling (clips)         | §32        |
| axios                       | ^1.10.0      | Provider HTTP (Gemini, Nvidia)        | §16        |
| winston                     | ^3.17.0      | Logging (no console.log)              | §9.5       |
| winston-daily-rotate-file   | ^5.0.0       | Daily log rotation / retention        | §9.5       |
| dotenv                      | ^17.4.2      | `.env` loading                        | §10.2      |
| dayjs                       | ^1.11.21     | Date/time utilities                   | §6.6       |
| morgan (dev)                | ^1.11.0      | HTTP request logging (development)    | §9.7       |
| nodemon (dev)               | ^3.1.14      | Development auto-restart              | §9.7       |

Notes:

- Addis AI calls use the platform's native `fetch`; Gemini and NVIDIA
  calls use axios. Neither uses an AI SDK (§16, §12.8).
- The backend has no test framework and no TypeScript compiler
  (§13.6).
- `dotenv` feeds `config/env.js` at boot; `process.env` remains
  readable only there (§10.3).

### 13.4 Client dependency inventory

Transcript of `client/package.json` (dependencies and devDependencies,
caret ranges preserved verbatim):

| Package                     | Range             | Role                                            | Anchor     |
| --------------------------- | ----------------- | ----------------------------------------------- | ---------- |
| react                       | ^19.2.8           | UI runtime (React 19)                          | §41, §44   |
| react-dom                   | ^19.2.8           | DOM renderer                                   | §41        |
| react-router                | ^8.3.0            | Routing (single package)                      | §41, §47   |
| @reduxjs/toolkit            | ^2.12.0           | Store + RTK Query (createApi)                 | §41, §42   |
| react-redux                 | ^9.3.0            | React bindings                                 | §41        |
| react-hook-form             | ^7.84.0           | Forms (register; no debounce)                 | §9.6       |
| react-toastify              | ^11.1.0           | Toast surfaces (§60 consumer)                  | §60        |
| react-error-boundary        | ^6.1.2            | Error boundary                                 | §60        |
| @mui/material               | ^9.3.1            | Component library (community)                 | §43–§46    |
| @mui/icons-material         | ^9.3.1            | Icons                                          | §46        |
| @mui/lab                    | ^9.0.0-beta.8     | Experimental MUI components                   | §46        |
| @emotion/react              | ^11.14.0          | CSS-in-JS engine (sx/styled)                  | §9.6, §44  |
| @emotion/styled             | ^11.14.1          | styled() helper                                | §9.6, §44  |
| @mui/x-data-grid            | ^9.11.0           | Data tables (lists)                            | §50, §56   |
| @mui/x-date-pickers         | ^9.11.0           | Date & time pickers (with ethiopianDate)     | §52        |
| @mui/x-charts               | ^9.11.1           | Analytics charts                               | §49        |
| @mui/x-chat                 | ^9.0.0-alpha.16   | AI chat panel (alpha; §55 usage)              | §55        |
| @fontsource/inter           | ^5.3.0            | Inter font (typography)                       | §43        |
| jspdf                       | ^4.2.1            | PDF export (client-side)                       | §58        |
| jspdf-autotable             | ^5.0.8            | PDF tables (report tables)                   | §58        |
| dayjs                       | ^1.11.21          | Date/time (DD-MM-YY display)                 | §6.3, §52  |
| vite                        | ^8.2.0            | Build tool                                    | §9.7       |
| @vitejs/plugin-react        | ^6.0.4            | Vite React transform                            | §9.7       |
| eslint                      | ^10.8.0           | Linting (devDependency)                       | §9.7       |
| @eslint/js                  | ^10.0.1           | ESLint core config                              | §9.7       |
| eslint-plugin-react-hooks   | ^7.1.1            | React hooks linting                             | §9.7       |
| eslint-plugin-react-refresh | ^0.5.3            | Fast-refresh lint                               | §9.7       |
| globals                     | ^17.7.0           | ESLint globals                                  | §9.7       |
| @types/react               | ^19.2.17          | Editor/lint typing (dev only)                  | §9.7       |
| @types/react-dom            | ^19.2.3           | Same (dev only)                                | §9.7       |

Notes:

- The client has **no axios**: every server call is RTK Query via
  `fetchBaseQuery` + `baseQueryWithReauth` (§12.6, §42).
- `@types/*` packages exist only for editor support and linting;
  the codebase is JavaScript-only — no `.ts`/`.tsx` files exist
  (§4.3, §9.2).
- `@mui/x-chat` is distributed as an alpha; its API is considered
  experimental and the manifest pin is authoritative until upgraded
  through §13.7 (§55).
- TXT, CSV, and XLSX exports have **no export library in the
  manifest**: the implementation decision belongs to §58 and any
  package needed must pass the §13.7 protocol first.
- `ethiopianDate` is a local utility (not an npm package); the MUI
  X DatePicker adapter uses it (§52).

### 13.5 Approved planned dependencies (not yet installed)

The following are approved additions that are not yet in the
manifests; they are installed with their owning phase (§66) and then
become manifest truth:

| Package       | Purpose                                          | Manifest target | Entrance gate              |
| ------------- | ------------------------------------------------ | --------------- | -------------------------- |
| @tiptap/react | `MuiEditor` rich-text editing (toolbar: bold, italic, font size, text color) | client dependencies | editor phase in §66 |
| dompurify     | Sanitizes rich-text HTML on save and on render  | client dependencies | editor phase in §66; §61 |

Until these are installed, no section may assume their behavior; the
editor and its sanitization are introduced by the editor phase (§66).

### 13.6 Permanent exclusions (non-negotiable)

Mirrors §4.3 and §12.2; reversing any of these requires a §9 + §13
change with explicit approval:

- **TypeScript** — no `.ts`, `.tsx`, or TS configuration; JS only.
- **Next.js / Remix** — React + Vite SPA; no SSR or app framework.
- **Tailwind CSS** — MUI `sx`/`styled()` only.
- **Automated test frameworks** — none are added to either manifest.
- **zod** — manual validators with the consistent error shape (§29,
  §9.6).
- **Client-side AI SDKs / browser provider keys** — the browser never
  carries provider credentials (SC-7, §12.8).
- **WebSocket / streaming dependencies** — the pipeline is
  asynchronous (§12.2, D2); a future realtime phase evaluates
  additions via §13.7 and §66.
- **External binary stores (S3, GridFS)** — audio stays on the local
  uploads path (§12.9).

### 13.7 Dependency protocol (normative decisions)

1. **Existing package wins.** Any package referenced anywhere in this
   document is the installed package — its exact name and version in
   the manifest, never an alias or a remembered name. Where a naming
   convention used a shorter form, the installed name governs:
   `mongoose-paginate-v2` (alias "mongoose-paginate"),
   `express-mongo-sanitize` (alias "mongo-sanitize" in the security
   chain). Tables in §13.3–§13.4 are transcripts of the manifests and
   are kept in sync; any conflict resolves to the manifest.
2. **Addition flow.** A new dependency is: justified in its owning
   section (purpose), approved as part of the phase plan (§66) or
   explicitly by the owner, installed with `npm install` (which
   updates the manifest and the committed lockfile), and recorded in
   §13.4/§13.5. Direct installs outside this flow are not allowed.
3. **Removal flow.** Unused packages are removed as part of §9.7
   hygiene; the manifest change is committed with the phase.
4. **Caret ranges.** Ranges are kept verbatim as the manifest
   declares them; a deliberate upgrade is a §13.7 addition-flow
   decision.
5. **Minimal surface.** The stack stays minimal (principle §12.2):
   no package is added that can be replaced by a documented platform
   or existing package behavior.

### 13.8 Verification usage

- Consistency gates: §4.3 / §9.2 / §12.2 reuse the exclusions above;
  §9.7 enforces the build/lint commands with the exact toolchain from
  §13.4.
- The planned-dependency gate keeps §46 editor work and §58 export
  work honest against the manifest until the §66 phase installs them.
- This section introduces no constants; every numeric value is a
  manifest-copied version or an §11-bounded literal.

## 14. ADR Index

### 14.1 Purpose & scope

This section is the canonical registry of the architectural decision
records (ADRs) that govern this document. Each entry states a decision,
its current status, and the sections that implement it. The normative
detail of every decision is written in the sections named in the Owner
column; no decision is re-stated in full anywhere else. When an entry
and an owner section differ, the owner section governs and the entry
is corrected in the same change (§14.5).

The index covers ADR-001 through ADR-038. It resolves every ADR
reference used elsewhere in this document (§1.1, §2.4, §5.4, §12.2,
§12.8–§12.11, §13) and is the place where future decisions are
recorded (ADR-039 onward).

### 14.2 Register rules

1. **Numbering is permanent.** A new decision takes the next free
   number (ADR-039 onward); existing numbers are never renumbered,
   reused, or reallocated.
2. **One row, one decision.** — An entry records the decision, its
   status, and its owning sections. Package names in entries follow
   the installed names (`mongoose-paginate-v2`, `express-mongo-sanitize`,
   §13.7 — existing package wins); titles otherwise keep their
   recorded wording.
3. **Status is temporary by nature.** — Every row currently carries a
   single status: **Approved** — in force and implemented as of this
   writing, and changeable going forward through the §14.5 protocol.
   No status here claims permanence; a row changes only through the
   protocol, never by silent edit. The §12.11 register of cross-cutting
   decisions is the companion register; it changes by the same
   protocol.
4. **Section prose governs.** — When an owner section and this index
   differ, the owner section is authoritative and the index row is
   updated in the same change that fixes the divergence (§14.5).

### 14.3 Index of decisions (ADR-001 … ADR-038)

| ADR | Decision | Status | Owner |
| --- | -------- | ------ | ----- |
| 001 | Amharic-first stack: Addis AI for STT only; text generation user-selectable across Addis AI, Gemini, NVIDIA | Approved | §6, §12.8, §16, §33 |
| 002 | Backend-only proxy: the browser never calls a provider directly | Approved | §16 (proxy rule §12.2) |
| 003 | Status machine: defined states, forward and explicit backward transitions only | Approved | §5.3, §31 |
| 004 | Dual-token JWT (httpOnly): access 15 min + refresh 7 days, rotated | Approved | §28 |
| 005 | Unified ReportVersion — one content record with version history, replacing separate GeneratedReport and ReportVersion | **Retired (2026-08-09)** — version history removed by decision; report content lives on the report row as `raw`/`latest` (BR-11); no version chain | §5.4, §21 |
| 006 | Client-side export only for PDF/TXT/CSV/XLSX; Google Docs export is backend-only | Approved | §37, §58 |
| 007 | ffmpeg + wavSplitter chunking pipeline (accuracy-critical) | Approved | §33 |
| 008 | Hybrid HTTP clients: platform-native `fetch` for Addis AI; axios for Gemini and NVIDIA | Approved | §13.3, §16 |
| 009 | Self-service registration (single user type; no admin-created accounts) | Approved | §3.2.2, §28 |
| 010 | Multi-branch report support (Type-1/Type-2, one day, several branches) | Approved | §6.4, §21, §31 |
| 011 | Ethiopian calendar display: numeric notation with English labels | Approved | §6.3, §43 |
| 012 | MUI Community edition only (no licensed MUI X Pro) | Approved | §13.4, §43 |
| 013 | Graceful shutdown protocol | Approved | §12.10, §26 |
| 014 | Provider fallback chain: Addis AI → Gemini → NVIDIA | Approved | §16, §34 |
| 015 | Two-path deletion lifecycle: archive, then permanent deletion | Approved | §18, §31, §62 |
| 016 | Error-handling strategy: CustomError class, global handler, 422 for validation | Approved | §27, §29 |
| 017 | Transform layer for API responses (DTO mapping) | Approved | §17, §27 |
| 018 | Session-based transactions for every write operation | Approved | §12.2, §18, §27 |
| 019 | Safe logging policy: Winston; no `console.log` in the backend | Approved | §9.5 |
| 020 | Frozen configuration and constants objects | Approved | §10.3, §11.2 |
| 021 | JSDoc as the documentation standard | Approved | §9.4 |
| 022 | ES modules enforced throughout (no CommonJS) | Approved | §9.2, §13.2 |
| 023 | MUI X Chat as the correction interface | Approved | §55 |
| 024 | Google OAuth implemented as a stub; real integration remains an open question | Approved | §28, §37 — question open in §69 |
| 025 | React Router data mode with route lazy loading | Approved | §41, §47 |
| 026 | Redux Toolkit with the injectEndpoints pattern | Approved | §41, §42 |
| 027 | Eight-phase implementation plan | Approved | §66 |
| 028 | Feature-branch git strategy, one branch per phase | Approved | §9.8, §66 |
| 029 | Rate limiting: global, auth, and AI tiers | Approved | §27 |
| 030 | Re-transcription and AI-transcription-correction support | Approved | §23, §33 |
| 031 | Provider-neutral OAuth service architecture | Approved | §37 |
| 032 | Ethiopian dates displayed in numeric notation only | Approved | §6.3, §43, §46 |
| 033 | Per-component states: loading, empty, error, success | Approved | §60 |
| 034 | Server-driven pagination on list endpoints; the DataGrid never holds a full client-side dataset (server-side via `mongoose-paginate-v2`) | Approved | §27, §50, §56 |
| 035 | Fixed middleware stack order, never reordered | Approved | §12.2, §27 |
| 036 | Single user account type — no roles, no RBAC | Approved | §3.2.1, §19, §28 |
| 037 | Mock-data seeding strategy (metadata-only audio clips) | Approved | §40 |
| 038 | Rich-text editor: TipTap + DOMPurify (installed at the editor phase) | Approved (temp; §14.4) | §13.5, §46, §51, §54, §61, §66 |

### 14.4 Planned-install decision — ADR-038 (rich-text editor)

The editor of the report content area (§51) and the transcription
review surface (§54) is **TipTap + DOMPurify**:

- **Components.** `@tiptap/react` (headless editor; MUI-themed toolbar
  of Bold, Italic, Font size, Text color) and `dompurify` (HTML
  sanitizer). Both are approved planned dependencies and are installed
  when the editor phase implements them (§13.5, §66).
- **Storage.** The value persisted is an HTML string; `dompurify`
  sanitizes on write **and** on render; `dangerouslySetInnerHTML` is
  used only on already-sanitized input (§61). The same HTML feeds the
  review, correction, and export flows (§37, §58). No JSON-document
  storage.
- **Replacement (standing).** The editor choice is approved for the
  implementation phase, not secured permanently (§14.2 status rule).
  If the editor — TipTap or DOMPurify — proves unsuitable while the
  editor phase is built, the replacement package is installed through
  the dependency flow (§13.7: addition flow, existing package wins,
  the superseded package removed via §9.7 hygiene), the owning
  sections (§46, §51, §54, §58, §61) are rewritten in the same
  change, and this row is amended per §14.5. Until installation,
  nothing outside the owning sections depends on the editor (§13.5).

### 14.5 Amendment & reversal protocol

1. A row changes only through this protocol — no silent edits. The
   change step:
   - the owning section text is changed first — the sections the row
     names;
   - the row items (title / status / Owner) are updated in the same
     change;
   - the change is committed with the phase that carried it (§9.8,
     §66).
2. **Reversal of a whole decision** follows the path already used in
   §4: an explicit owner decision, delivered as a §66 phase (the §4.2
   rows D4/D5 show the ADR-036 / ADR-001 reversal precedent).
3. **Implementation-time replacement** (the ADR-038 case) uses the
   dependency flow of §13.7 (addition of the replacement, removal of
   the previous package via §9.7 hygiene, manifest wins) and the row
   is amended in the same change.
4. Numbering stays stable across amendments (§14.2 rule 1).

### 14.6 Verification usage

- Consistency gates: every ADR reference authored elsewhere resolves
  to exactly one row — e.g. §1.1 (ADR-036), §2.4 and §7.7 (ADR-001,
  ADR-007), §4.2 (ADR-001,
  ADR-036), §7.6 (ADR-011, ADR-032), §9.5 and §12.10 (ADR-019),
  §9.6 (ADR-012), §12.7 (ADR-031), §12.11 (ADR-001) — and the Owner
  column is the only anchor target.
- Sections authored later carry their ADR rows forward from the
  Owner column when they cite ADR numbers (citation rule §8).
- Introduces no new sections and no constants; the numeric values in
  the rows are decision statements (15 minutes, 7 days, the 30-day
  lifecycle of §62); the constant homes for those values are declared
  where the owning sections are authored (§11).

## 15. Project Structure

### 15.1 Purpose & scope

This section is the canonical file map of the two runtime components
(`backend/` and `client/`). It fixes the folder structure, the file
naming conventions, the boundaries that files must not cross, and the
ownership rules for later changes to the tree.

Every path referenced anywhere in this document resolves to a node in
§15.4 (backend) or §15.5 (client). Sections authored later adopt these
paths; when a later section must add or rename a file, the tree is
amended in the same change (§15.7). The same single-source pattern
that governs §13.1 (technology) and §14.4 (decisions) applies here:
the tree is the statement, later sections are its readers.

Nothing in this section adds a package (the packages are owned by
§13) and nothing here adds a constant (values belong to §11).

### 15.2 Tree conventions

1. **File names.** JavaScript modules use kebab-case
   (`wavSplitter.js`, `httpStatus.js`, `constants.js`, `logger.js`).
   Component files (`.jsx`) are named by their single exported
   PascalCase component (`App.jsx`, `AppTheme.jsx`, `MuiButton.jsx`) —
   the documented examples in §9.4 and §46 pin this exception to the
   kebab-case rule of §9.3. Route paths are kebab-case, and file names
   of route modules, controllers, models, and services follow the
   kebab-case rule; their concrete names are assigned by their owning
   sections (§19–§24, §26, §30–§39).
2. **One module per file.** Every file exports one primary artifact
   (component, route array, schema, service, or utility). Barrel files
   are not used; imports stay descriptive and tree-shaken (§9.3,
   §9.6).
3. **Layer shading.** Files that exist in the current repository
   scaffold are marked `(scaffold)`; files and folders created during
   implementation carry the owner section that specifies them and are
   assumed to be created in the phase plan (§66) of that owner.
   Runtime artifacts that are never committed are marked `(runtime)`.
4. **Import boundaries.** Backend modules import only within
   `backend/`; `config/env.js` is the only file that reads
   `process.env` (§10.3); physical audio files are touched only
   through `uploads/audio/` (§32). Client modules import only within
   `client/src/`; the network layer is the only place an HTTP call
   leaves the SPA (§12.6, §42).
5. **Paths are written relative to the component root**
   (`backend/…`, `client/src/…`), never as absolute filesystem paths.
6. **Git boundaries.** `.env` files, `backend/uploads/`, `logs`,
   `node_modules`, `dist`, and `*.local` are ignored (§10.2); the tree
   shows only committed files plus the runtime artifacts they
   document.
7. **Client placement rules.** Reusable MUI components live in
   `components/reusable/`; layout shells in `components/layout/`;
   MuiDataGrid column sets in `components/columns/`; every other
   component lives at `components/<domain>/<Name>.jsx`. State lives in
   `redux/`: `app/store.js` and one slice per domain under
   `features/`, with `features/apiSlice.js` as the single API layer.
   Page files are exempt from enumeration here — the page set is a
   decision of the page sections (§48–§59), and each page enters the
   tree with the change that implements it (§15.7).

### 15.3 Repository root

```
<repo root>/
|-- .gitignore                      # .env / uploads/ / logs / node_modules / dist / *.local (§10.2)
|-- README                        # root documentation; not imported by the runtime
|-- backend/                      # §15.4
`-- client/                       # §15.5
```

The repository root also hosts the authoring workspace of this
document. It is an authoring artifact: it is never imported, built, or
deployed, and no runtime code references it. The architecture below
has exactly two components, plus the external providers of §16.

### 15.4 Backend tree (target)

```
backend/
|-- server.js                       # process entry; nodemon dev target, npm start in production (§9.7, §26)
|-- app.js                          # Express app; middleware wiring + route-registry mount; registers no route directly (§12.2, §26)
|-- package.json                    (scaffold)
|-- package-lock.json               (scaffold)
|-- .env                            (runtime, never committed — §10.2)
|-- config/
|   `-- env.js                      # the only reader of process.env.; frozen config object (§10.3)
|-- utils/
|   |-- logger.js                   # Winston logging, no console.log (§9.5)
|   |-- constants.js                # backend constants inventory (§11.3)
|   |-- httpStatus.js               # semantic HTTP status names (§11.6)
|   `-- wavSplitter.js              # PCM-level WAV chunking for STT (§33)
|-- middleware/                     # fixed chain extras + auth + tiers (contents named by §26–§28)
|-- routes/
|   |-- index.js                    # the single route registry (§12.2, §26)
|   `-- <domain>.routes.js          # per-domain route modules, kebab-case (§30–§39)
|-- controllers/
|   `-- <domain>.controller.js      # one controller file per domain (§26, §30–§39)
|-- models/
|   `-- <entity>.model.js           # one schema file per entity, session-aware (§19–§24)
|-- services/                       # provider & pipeline work: STT, generation, correction,
|                                   # chat, exports, analytics, search — contents §33–§39
|-- jobs/
|   `-- sweeper                     # single in-process timer, two passes (§12.5, §62)
|-- mock/                           # seed and wipe scripts, session-safe (§40, ADR-037)
`-- uploads/
    `-- audio/                      (runtime; gitignored; created by multer — §32)
```

The layer hierarchy follows §12.5 top to bottom: middleware chain →
mount registry/route modules → controllers → services (provider and
pipeline work) → models → MongoDB. The response envelope, error
handling (global handler + CustomError), pagination helper, and the
transaction template (§27) are used by every layer that raises an
HTTP response or writes data.

### 15.5 Client tree (target)

```
client/
|-- index.html                      (scaffold)  # Vite entry
|-- vite.config.js                  (scaffold)  # dev server, build (§9.7)
|-- eslint.config.js                (scaffold)
|-- package.json                    (scaffold)
|-- package-lock.json               (scaffold)
|-- public/
|   |-- favicon.svg                 (scaffold)
|   `-- icons.svg                   (scaffold)
`-- src/
    |-- main.jsx                    (scaffold)  # flat route map; RouterProvider; Provider;
    |                                           # LocalizationProvider + AdapterDayjs (§41)
    |-- App.jsx                     (scaffold)  # application shell & guards (§41)
    |-- assets/                     (scaffold)  # hero.png and starter art; documented use in §43
    |-- theme/
    |   |-- AppTheme.jsx            (scaffold)  # theme definition (§43)
    |   |-- themePrimitives.js      (scaffold)
    |   `-- customizations/         (scaffold)  # inputs, dataGrid, datePickers, charts,
    |                                           # navigation, surfaces, feedback, dataDisplay, index — §44
    |-- utils/
    |   |-- constants.js                       # client constants inventory (§11.5)
    |   |-- httpStatus.js                      # client mirror of the status semantics (§11.6)
    |   `-- ethiopianDate.js                   # Ethiopian calendar conversions (§13.4, §46, §52)
    |-- hooks/
    |   `-- useAudioRecorder.js                # recording hook; reused by Mode 3 (§53)
    |-- redux/
    |   |-- app/
    |   |   `-- store.js                       # store creation; Provider wiring (§41–§42)
    |   `-- features/
    |       |-- apiSlice.js                  # RTK Query createApi; fetchBaseQuery +
    |       |                                #   baseQueryWithReauth; network & error layer (§41–§42)
    |       `-- <domain>Slice.js             # one slice per domain (e.g. reports, branches) (§41)
    |-- components/
    |   |-- layout/                          # PublicLayout, AppShell, AppSidebar (§47)
    |   |-- reusable/                        # Mui* library, one file per component (§46)
    |   |-- columns/                         # domain column-set files for MuiDataGrid (§50, §56, ADR-034)
    |   |-- landing/                          # e.g. Hero.jsx — example of a domain folder
    |   |-- login/                            # e.g. LoginForm.jsx — example of a domain folder
    |   |-- report/                           # e.g. ReportCard.jsx — example of a domain folder
    |   `-- <domain>/                        # every other component lives at
    |-- pages/                                # one <Name>.jsx per routed view. The page set is
    |                                         # NOT fixed in this tree: page shape is decided by
    |                                         # the page sections (§48–§59) when they are authored,
    |                                         # and each implementing phase adds its page files
    |                                         # here in the same change (§15.7)
```

The design system and the data-access layer are the two structural
parts with fixed homes: the theme files exist in the scaffold, and the
store/API layer has the fixed layout `redux/app/store.js` +
`redux/features/` (§41–§42). Every page — and every component — imports
only from `components/`, `redux/`, `hooks/`, and `utils/`, so page
files own no leaf UI outside page-level composition (§12.6, §15.6).

### 15.6 Folder responsibilities

- `config/` — configuration, frozen at boot (§10.3). One file: `env.js`.
- `utils/` — pure helpers and constants; no database access, no HTTP,
  no request state. Backend: logger/constants/httpStatus/wavSplitter;
  client: constants/httpStatus/ethiopianDate.
- `routes/` — only route definitions and validator references; the
  registry `index.js` is the single mount point (§12.2).
- `controllers/` — request lifecycle only: validate (throws 422),
  session/transaction, service call, envelope response, `next(error)`
  (§12.5, §27).
- `models/` — schema, indexes, toJSON transforms, session-aware hooks
  and methods (§18–§24).
- `services/` — provider & pipeline work (STT, generation,
  correction, chat, exports, analytics, search; §33–§37); the only
  layer that talks remotely (fetch for Addis AI, axios for the other
  providers, §16).
- `jobs/` — the sweeper; one timer, every `SWEEPER_INTERVAL_MS` (62).
- `mock/` — seed + wipe; session-safe (§40).
- `components/layout/` — layout shells only; `components/reusable/` —
  Mui* UI library only (§46); `components/columns/` — MuiDataGrid
  column sets only (§50, §56); every other component lives at
  `components/<domain>/<Name>.jsx` — one folder per concern (e.g.
  `login/`, `landing/`, `report/`) — and never outside `components/`.
- `pages/` — one `<Name>.jsx` per routed view; the page set and page
  shape are decided by the page sections (§48–§59) when they are
  authored, never pre-committed here; each implementing phase adds its
  page files in the same change (§15.7, §66).
- `hooks/` — shared logic that touches UI state (recording hook and
  its siblings; §53).
- `redux/` — `app/store.js` (store creation) and `features/` slices;
  `features/apiSlice.js` is the single RTK Query API descriptor
  (createApi, fetchBaseQuery, `baseQueryWithReauth`, error
  normalization, §12.6); these are the only client modules that know
  the API envelope shape (§41–§42).

### 15.7 File growth & ownership rules

1. **The tree is a living contract.** Any change that adds, renames,
   or deletes a folder or file lands in this document in the same
   change that makes it (mirror of §13.7 for dependencies and §14.5
   for decisions). A section that first names a file must name a path
   that the tree already contains or update the tree in the same
   pass.
2. **Ownership for naming.** Concrete file names are assigned by the
   owning sections (§18–§40 for backend files, §41–§59 for client
   files); the patterns are fixed here (§15.2) and there.
3. **Unused paths are dead code.** §9.7 hygiene extends to files:
   a module with no active import is removed, and the tree shrinks
   with it.
4. **Runtime artifacts are never listed as files** (uploads/, logs,
   build output) — they are marked with their owner and never
   imported.
5. **No new packages and no new constants** are introduced by this
   tree; both are owned by §13 (packages) and §11 (constants).

### 15.8 Verification usage

- Consistency gates: every path referenced anywhere else in this
  document must appear in the trees of §15.4/§15.5 or be added to
  them in the same change — this includes §12 (diagram paths),
  §13.2-§13.4 (manifest paths), §10 (env paths) and every later
  section that names a file.
- Folder responsibilities above are the mapping keys for §12.5 layer
  order and the forbidden-crossing list of §12.2 (no routes in
  `app.js`; registries in `routes/index.js`).
- Markers `(scaffold)` correspond exactly to files under version
  control today; an audit can diff the tree against the tracked files.
- Forward gate on pages: page behavior is authored by §48–§59, not
  here. The intents already decided are recorded once here so they
  are not lost, and are applied where the page sections author them:
  the reports view is a list/grid toggle (a button group) — there is
  no separate reports list page — and branches render as a grid
  through the MuiDataGrid (ADR-034). This tree commits nothing else
  about page shape before those sections exist.
- This section introduces no constants; none of its literals is a
  magic value (§11).

## 16. AI Provider Integration Architecture

The AI layer connects the backend to three external providers — Addis
AI, Google Gemini, and NVIDIA — under the backend-only proxy rule
(§12.2-4, ADR-008). Amharic speech-to-text is provided by Addis AI
exclusively (ADR-001, §12.11-5); all three providers are available for
text generation, with a fixed fallback chain (ADR-014). §16 refines
the HLD of §12.8 into the executable integration contract.

### 16.1 Purpose & scope

- **Owned here — the transport contract.** Provider roster and roles,
  the backend-only proxy rule, credentials and their home, exact
  request/response contracts per provider, timeout/retry/backoff
  policy, provider-error mapping, the fallback chain, and the
  configuration home for all of the above.
- **Owned elsewhere — deliberately not repeated here.** Prompt and
  system-prompt composition, plus parse/validation of provider text
  into the report, is authored by §34 (generation) and §35
  (correction). The chunked transcription pipeline — single-pass WAV
  conversion, PCM-level split, per-chunk orchestration — is §33. The
  per-message provider choice, usage metadata, and conversation
  persistence are §36. Provider picker UI and client mirror constant
  are §54 and §11.5. Audio limits at the client are §32, §53.
- **Explicitly out of scope (deferred, §4).** Realtime WebSocket
  streaming is deferred to a later version (D2); its relay is never
  used and no WebSocket URL appears in source (§12.2-3). Text-to-
  speech (D1 — its `/api/v1/audio` endpoint is never called) and
  automated translation (D5 — `/api/v1/translate` is never called)
  author no endpoint design here — per §7.7 the pipeline never
  converts content language implicitly and translation is never
  automatic.
- **Provider picker UX (normative).** The end user selects the
  provider at generation time (dropdown); per requirements the
  default provider selection is Addis (§54). The selection is not a
  §16 concern beyond the constant validation in §16.2.

### 16.2 Provider inventory & roles

The canonical provider ids are the `AI_PROVIDERS` members of §11.4 —
`['addis', 'gemini', 'nvidia']` — and their canonical order doubles as
the fallback chain of §16.6. Any `provider` appearing in a request
body, conversation message, or log context that is not a member of
this list is rejected at validation (422, §11.6) and violates the
domain-constant rule of §11.4.

| Provider | Role | Transport (ADR-008) | Authentication | Models (registry §11.4) | Reasoning | Notes |
| -------- | ---- | ------------------- | -------------- | ----------------------- | --------- | ----- |
| `addis`  | STT — exclusive (ADR-001, §12.11-5); text generation — default | native `fetch` + Node `FormData`/`Blob` | `x-api-key` header; key starts with `sk_` | `Addis-፩-አሌፍ` (default) | none — no reasoning parameter exists; `reasoning` is never sent | Amharic-first; only provider used for STT; default text provider §34 |
| `gemini` | text generation only | axios (ADR-008) | query parameter `key=${GEMINI_API_KEY}` | `gemini-3.1-flash-lite` (default) | yes — `thinkingConfig.thinkingLevel` (`minimal`/`low`/`medium`/`high`); thinking cannot be fully disabled on this family, `off` maps to `minimal` | base `GEMINI_BASE_URL` (§11.3) |
| `nvidia` | text generation only | axios (ADR-008) | `Authorization: Bearer ${NVIDIA_API_KEY}` | `deepseek flash 4` (default) | yes — OpenAI-compatible `reasoning_effort` via `chat_template_kwargs` (`off` → thinking off; `low`/`high`; `medium` maps to `high` per DeepSeek docs) | NVIDIA NIM OpenAI-compatible chat completions; base URL from env `NVIDIA_API_URL` (§10.4), official canonical value `https://integrate.api.nvidia.com/v1` |

The **model registry** (`AI_MODELS`, §11.4) is the single source of
truth for selectable models:

- Each provider entry lists its selectable models, the `default`
  model, and a `reasoning` capability flag. A request carries exactly
  one `(provider, model, reasoning)` triple; both names and the
  reasoning value must be members of the registered sets
  (`AI_PROVIDERS`, `AI_MODELS`, `AI_REASONING_EFFORTS` — §11.4) or
  the request is rejected at validation (422, §11.6).
- `reasoning` is transmitted only when the selected model's
  `reasoning` flag is on; for models without reasoning (Addis) the
  parameter is simply absent — never an error, never a fallback
  trigger.
- Adding or removing a model changes only the `AI_MODELS` constant
  (§11.4) and this registry's catalog check (§16.8), under the §14.5
  amendment discipline — no transport code changes.

- **Role enforcement.** STT is never sent to Gemini or NVIDIA
  (§12.11-5) — the STT pipeline §33 consumes exclusively provider
  `addis`. Text generation may use any of the three; the chosen
provider id, model id, and reasoning effort are stored per
conversation message (§36, ADR-014) so an initial generation and its
corrections may differ (§34, §35).
- **Free-only policy.** Each provider account in use must be free — no
  credit card, no subscription, no paid tier. The app does not call a
  provider under an account that requires payment. A provider or
  model that becomes paid is removed from `AI_PROVIDERS` via the
  §14.5 amendment protocol before any code change.
- **Model catalog check.** Model strings live in the `AI_MODELS`
  registry (§11.4). The NVIDIA model string shown (`deepseek flash 4`)
  is validated against the NVIDIA catalog at implementation time
  (build.nvidia.com, §16.8) — NIM model ids drift between catalog
  revisions and an unregistered id is a known 404 source; the
  registry entry is updated in the same change that implements it —
  never a magic literal at the call site.

### 16.3 Backend-only proxy rule & credential handling

- **No browser-to-provider call, ever** (SC-7, §2.4; ADR-008; §12.2-4).
  The browser talks only to `/api/v1` of the backend (VITE_API_BASE_URL,
  §10.5). The browser transmits at most a `<provider>`; it never
  holds — and never receives — any provider key, token, or signed
  URL.
- **Keys.** `ADDIS_API_KEY`, `GEMINI_API_KEY`, `NVIDIA_API_KEY` live
  only in `backend/.env` — required (§10.4), boot fail-fast per the
  §10.3 lookup chain. No key is placed in Vite env vars, `import.meta.env`,
  Redux state, localStorage, or middleware logs (§9.5, ADR-019).
- **HTTP client choice** (ADR-008; §13.3). Addis endpoint: backend
  native `fetch` with the global `fetch`, `FormData`, and `Blob`
  available on the installed LTS runtime (§13.2); Gemini/NVIDIA:
  axios. No official AI SDK is installed anywhere (ADR-008). If the
  running runtime lacks reliable multipart forwarding, a small
  documented helper package is approved under §13.5 — the transport
  rules of this section remain.
- **Secrets are never logged** (ADR-019; §9.2). Keys, tokens, request
  bodies, and response bodies are excluded from logging. Only provider,
  model, status code, latency, and request/response ids are logged
  (§16.5).

### 16.4 Request & response contracts

All contracts are non-streaming `application/json` default, unless
stated; response text is returned in the language of the prompt
(Amharic `am` for the report pipeline, §7.7; LANGUAGE_CODES §11.4).
No SSE/streaming anywhere (D2, §12.2-3).

**Structured-output contract (mandatory for text generation).** For
maximum accuracy, every generation and correction call — whichever
provider or model is used — must return structured JSON matching the
§34/§35 schema:

- Each provider is asked for JSON through its strongest documented
  mechanism (Gemini `responseMimeType`/`responseSchema`; NVIDIA
  `response_format`; Addis has no response-format parameter, so its
  JSON mode is a prompt instruction composed by §34/§35 — see the
  Addis bullet below).
- The adapter parses the provider text as JSON before normalization;
  a non-parsable or schema-invalid payload is a provider failure:
  it is retried under the §16.5 policy, then participates in the
  fallback chain (§16.6). Schema ownership stays in §34/§35; §16
  owns only that JSON is requested, parsed, and validated as one
  contract across all three providers.
- The raw schema text never appears in §16 — it is authored where it
  is consumed (§34 generation, §35 correction).

**Addis AI — text generation** (base `ADDIS_AI_BASE_URL`, §11.3):

- `POST {ADDIS_AI_BASE_URL}/api/v1/chat_generate`
- headers: `x-api-key: <ADDIS_API_KEY>`, `Content-Type: application/json`
- body:

```json
{
  "model": "<default model id of AI_MODELS.addis>",
  "prompt": "<§34 composed prompt — includes the structured-output instruction>",
  "target_language": "am",
  "conversation_history": [
    { "role": "user", "content": "…" },
    { "role": "assistant", "content": "…" }
  ],
  "generation_config": {
    "temperature": "AI_TEMPERATURE",
    "maxOutputTokens": "AI_MAX_OUTPUT_TOKENS",
    "topP": "AI_TOP_P",
    "topK": "AI_TOP_K"
  }
}
```

- `target_language` is always `am` for report generation and
  corrections (report language is Amharic, §6/§12.2-12; `en` is
  reserved for future English output, §7.7). `conversation_history`
  is formed from the §36 conversation when a report is regenerated
  after the initial generation and its entries are limited to
  `role`/`content` fields. Generation payload values: `AI_*` §11.3
  constants.
- **Model + reasoning.** The `model` id comes from the `AI_MODELS`
  registry entry for `addis` (§11.4). Addis exposes no reasoning
  parameter — no `reasoning` is ever sent to this provider,
  and a stored reasoning value on the message is ignored rather
  than an error (§16.2).
- **Structured output at Addis.** Addis documents no
  `response_format` knob; its JSON mode therefore arrives through the
  prompt: §34/§35 compose the strict instruction ("respond with a
  single JSON object that matches the provided schema — no prose, no
  code fences") and the adapter's JSON extraction of the response
  text is the contract step before the §16.5 parse-failure policy
  applies. The prompt text itself is domain-owned (§34/§35).
- Response — 200:

```json
{
  "response_text": "…",
  "finish_reason": "stop",
  "usage_metadata": {
    "prompt_token_count": 0,
    "candidates_token_count": 0,
    "total_token_count": 0
  },
  "modelVersion": "<model id from AI_MODELS.addis>"
}
```

- Normalized result surfaced to §34/§35: `{ text: response_text,
  model: modelVersion }`, with `usage_metadata` optionally carried to
  §36. `finish_reason` is validated (`stop`); any other value —
  including blocked/dry-run responses — is treated as a provider
  failure for fallback (§16.6).

**Addis AI — STT — `POST {ADDIS_AI_BASE_URL}/api/stt`:**

- Encoding: `multipart/form-data` with `audio` (file) and
  `request_data` (stringified JSON carrying `language_code: 'am'`).
- This section and §33 honor the constants `AUDIO_ALLOWED_MIME_TYPES`
  (wav/mp3/m4a/webm) and `ADDIS_AI_STT_MAX_DURATION_SEC` (60 s per
  chunk; §11.3).
- Response (200): `{ status: 'success', data: { transcription,
  usage_metadata: { totalBilledDuration, requestId } }, confidence }`.
  The `requestId` is logged (ADR-019) and the caller (the §33
  pipeline) may persist it per the Audio/Transcription docs §22–§23.
- Error semantics: provider 4xx/5xx per §16.5; a chunk that fails is
  marked failed and the pipeline continues with the remaining chunks
  (§16.5, §33). A failed chunk is never part of the text-generation
  fallback chain (§16.6).

**Google Gemini — `POST {GEMINI_BASE_URL}/models/{model from AI_MODELS.gemini}:generateContent?key=${GEMINI_API_KEY}`:**

- body:

```json
{
  "contents": [
    { "role": "user", "parts": [{ "text": "…" }] }
  ],
  "systemInstruction": { "parts": [{ "text": "…" }] },
  "generationConfig": {
    "temperature": "AI_TEMPERATURE",
    "maxOutputTokens": "AI_MAX_OUTPUT_TOKENS",
    "topP": "AI_TOP_P",
    "topK": "AI_TOP_K",
    "responseMimeType": "application/json",
    "responseSchema": "<schema object supplied by §34/§35>",
    "thinkingConfig": {
      "thinkingLevel": "<translated reasoning — 'off' maps to 'minimal'>"
    }
  }
}
```

- `systemInstruction` and `contents` come from §34/§35 and the §36
  conversation; `role` = `user`/`model` mapping to internals is
  handled by the adapter (no Gemini syntax leaks to the domain).
- **JSON.** `responseMimeType` and `responseSchema` are fixed
  contract values; the schema object content is supplied by §34/§35
  at call time and never stored in §16.
- **Reasoning.** `thinkingConfig.thinkingLevel` is sent only when a
  registered model has `reasoning: true` (§16.2). Translation of the
  app-level effort to the provider level: `high → high`, `medium →
  medium`, `low → low`, `off → minimal` — the Gemini 3 flash family
  cannot fully disable thinking, `minimal` is its documented
  floor. Default when the user does not choose: the effort stored on
  the conversation message (§36), else `off`/`minimal`.
- Note: Gemini 3-family models take `thinkingLevel`; the older
  2.5-family `thinkingBudget` is not used by any registered model
  and no legacy branch exists.
- Response — 200: `{ candidates: [{ content: { parts: [{ text }] } }],
  usageMetadata }`. Normalized: `{ text: <joined parts>,
  usageMetadata }`. `stream:false`/no `alt_sse` — streaming is never
  requested (D2).

**NVIDIA — `POST {NVIDIA_API_URL}/chat/completions`:**

- `NVIDIA_API_URL` is `Required` with no default (§10.4). The
  official documented base (NVIDIA NIM chat completions, per NVIDIA
  docs) is `https://integrate.api.nvidia.com/v1`.
- headers: `Authorization: Bearer ${NVIDIA_API_KEY}` (free-tier keys
  are created at build/portal, `build.nvidia.com`).
- body:

```json
{
  "model": "<model id from AI_MODELS.nvidia>",
  "messages": [
    { "role": "system", "content": "…" },
    { "role": "user", "content": "…" }
  ],
  "temperature": "AI_TEMPERATURE",
  "max_tokens": "AI_MAX_OUTPUT_TOKENS",
  "response_format": { "type": "json_object" },
  "reasoning_effort": "<translated reasoning>"
}
```

- Model ids follow the NVIDIA catalog naming (e.g. the `deepseek`
  catalog id) and are validated against the registry at deploy time
  (§16.8); the body value is always the registered id — never an
  inline literal.
- **JSON.** `response_format: { "type": "json_object" }` is the fixed
  OpenAI-compatible structured-output knob (documented on NIM and the
  DeepSeek NIM model pages).
- **Reasoning.** Sent only for models with `reasoning: true`. The
  adapter translates the app-level effort into the DeepSeek/NIM
  mechanism — `off → { "thinking": false }`; `low → { "thinking":
  true, "reasoning_effort": "low" }`; `medium → { "thinking": true,
  "reasoning_effort": "high" }` (DeepSeek documents no native
  `medium`; it maps to `high`); `high → { "thinking": true,
  "reasoning_effort": "high" }`. The `reasoning_effort` passthrough is
  used only where the NIM deployment documents top-level support;
  the adapter prefers `chat_template_kwargs` as the reliable
  transport and switches to the passthrough form only for
  deployments that document it — a decision recorded at deployment
  time in §16.8, not per request.
- Response — 200: `{ id, choices: [{ message: { role, content } }],
  usage }`. Normalized: `{ text: choices[0].message.content, model }`;
  when reasoning is on, the model may also return
  `message.reasoning_content` — it is never surfaced to the client
  (§9.5, ADR-019) and never stored (§36). Sends no streaming header;
  `stream` is never `true`.

### 16.5 Timeout, retry & error policy

- **Timeout.** Every provider call is constrained by `AI_TIMEOUT_MS`
  (§10.4; default 30000 ms, env-overridable). A timeout is classified
  as a network failure and the retry policy below applies.
- **Retry policy** (per single provider):
  - Retries = `AI_PROVIDER_RETRIES` (3, §11.3): one initial call plus
    up to **3** retries, spaced by the exponential schedule 1 s →
    2 s → 4 s derived from `AI_PROVIDER_BACKOFF_BASE_MS` = 1000
    (1000 ms, 2000 ms, 4000 ms) (§11.3).
  - **Network failure** (DNS, refused/aborted connection, timeout, TLS
    reset, or provider 5xx): retry with the schedule above; the
    request is only given up after the last retry.
  - No request is aborted between retries; each attempt sends a full
    fresh request.
  - When a provider 429 response carries a `Retry-After` header
    (addis/nvidia), the next attempt waits that long — capped so the
    total wait stays bounded per the app AI rate tier (§27); a
    persistent 429 is a provider failure (§16.6).
- **Semantic errors — 4xx (config/auth faults).** 400/401/403/404 are
  not retried (retrying cannot change the outcome) and do not trigger
  fallback (they would recur identically on every provider instance);
  they surface as a 502 for the caller — with the key value never
  logged (§16.3, ADR-019).
- **5xx** — provider outage: retry schedule, then fallback (§16.6).
- **Structured-output failures.** A provider response that cannot be
  parsed as JSON, or that parses but fails the §34/§35 schema, is a
  provider failure: retried under the same policy, then participates
  in fallback (§16.6). A schema failure is never silently accepted —
  "best effort" text is not stored (accuracy gate, §2.3 G6).
- **STT chunk semantics:** a network failure or provider error on one
  chunk is handled per chunk: after retries the chunk is marked
  **failed** and the pipeline continues processing the remaining
  chunks — a failed chunk does not abort the whole recording (§33);
  the final transcription fuses the succeeded chunks.
- **App rate limits vs provider limits.** The app enforces its own AI
  tiers (RATE_LIMIT_AI_WINDOW_MIN=1, RATE_LIMIT_AI_MAX=10,
  §27/§11.3) as **the** primary guard. Provider-issued 429s (usage
  quotas: Addis daily/monthly token quotas; NVIDIA free tier ≈40 RPM)
  are second-layer: honored with Retry-After; a 429 that persists
  beyond the bounded schedule is a provider failure — for generation
  and correction it triggers fallback (§16.6); for STT the chunk is
  marked failed (§33).

### 16.6 Fallback chain

- **Fixed chain (ADR-014; §12.11-5).** For all text generation (initial
  generation §34, corrections §35), the order of `AI_PROVIDERS`
  (§11.4) is the fallback order: `addis → gemini → nvidia`.
- **Trigger**: a provider fails, per §16.5 (retries exhausted, or a
  non-transient error); the caller retries the whole request against
  the next provider in the chain — **the retries count is per
  provider, not shared** (§12.8).
- **Model & effort ride along.** The request carries the
  `(provider, model, reasoning)` triple (§16.2). On
  fallback to the next provider, that provider's own registered
  model is used — the user's selection for that provider if one was
  stored on the message (§36), otherwise the provider's `default`
  registry entry. The reasoning applies only where the target model
  has `reasoning: true`; otherwise the reasoning value is silently
  omitted — never an error, never a second fallback (§16.2).
- **No fallbacks for STT.** STT happens at provider addis (ADR-001);
  if the chunk fails after retries, it is marked failed as above.
- **Per-message selection** (§36). A conversation/result may carry a
  different provider per message; initial generation with `addis`,
  correction with `gemini` is legitimate. The provider id stored is
  always verified against the `AI_PROVIDERS` constant (§11.4,
  ADR-014).
- **Chain exhausted.** If `addis`, `gemini` and `nvidia` all fail the
  request, the operation fails with a 502 (BAD_GATEWAY, §11.6) —
  surfaced to the user through the error envelope of §31 and a toast
  (§12.2-2 / §60) — never with raw provider messages.

### 16.7 Configuration home

- **Environment (§10.4, amended in the same change).** All keys are
  read by `config/env.js` (the only `process.env` reader, §10.3):
  `ADDIS_API_KEY`, `GEMINI_API_KEY`, `NVIDIA_API_KEY`, plus two new
  rows: `NVIDIA_API_URL` (Required — no default; operator sets the
  base URL; the canonical official value is recorded in §16.4) and
  `AI_TIMEOUT_MS` (No, default 30000).
- **Constants (§11.4/§11.3, amended in the same pass).** Base URLs
  and operational values are §11.3 constants (never inline):
  `ADDIS_AI_BASE_URL`, `GEMINI_BASE_URL`, `AI_PROVIDER_RETRIES`,
  `AI_PROVIDER_BACKOFF_BASE_MS`. The model registry `AI_MODELS` and
  the effort enum `AI_REASONING_EFFORTS` live in §11.4 (domain
  constants) together with `AI_PROVIDERS` and `LANGUAGE_CODES`; the
  generation knobs `AI_TEMPERATURE`, `AI_MAX_OUTPUT_TOKENS`,
  `AI_TOP_P`, `AI_TOP_K`, `AI_CORRECTION_TEMPERATURE` stay in §11.3.
- **Client (mirror, §11.5).** The client sees only `AI_PROVIDERS`,
  `AI_MODELS`, and `AI_REASONING_EFFORTS` (for the §54 picker); it
  holds no provider URL, schema, or key (SC-7).

### 16.8 Verification usage

- **Consistency.** Sections 12.2, 12.8, 12.11-5, 13.3, 14 (ADR-001,
  008, 014), 7.7 references resolve; the constant tables of §11 and
  the env table of §10 are updated in the same change. No new
  endpoints are added beyond what §34/§35 and §33 own.
- **Registry & catalog gates.** Every registered model id is checked
  against its provider's live catalog before activation
  (build.nvidia.com for NVIDIA — NIM ids drift and are a known 404
  source; ai.google.dev for Gemini; Addis docs for Addis); the
  effort translation tables of §16.4 are re-verified whenever a
  provider documents a change to its reasoning knobs. The §54 picker
  is driven exclusively by the §11.5 mirrors — a registry change
  without a mirror change is a review error.
- **Structured-output gate.** Generation and correction calls always
  request JSON (Gemini `responseMimeType`/`responseSchema`, NVIDIA
  `response_format`, Addis prompt-instruction); a call missing its
  JSON mechanism fails review (SC-8 / §2.3 G6 accuracy).
- **No invented claims (SC-8).** All provider URLs, models, reasoning
  knobs, and JSON mechanisms are those published by the providers
  (Addis AI docs, Gemini docs, NVIDIA NIM/DeepSeek docs, §16.4); no
  latency/payment promises are introduced. Numeric values not given
  by providers are explicit (timeout default) with a note.
- **Deferred gates.** No realtime relay URLs; no translation or TTS
  endpoints; no browser-side provider token (§4.2). Grep gate: no
  `wss://`, no `/v1/translate`, no `/api/v1/audio`.
- **Pipeline handoff.** §33/§34/§35/§36 must trigger only through
  the §16 contract; violations of §15.7 are raised at review.
- This section introduces no constants of its own; any literal
  resolves to §10.4 or §11.3/§11.4. None of the provider samples in
  the contract carries a runtime value in the code — names resolve
  to constants or registry entries.


## 17. Data System Overview (ERD + relationships + cascade map)

The data system is MongoDB (Mongoose) as the single system of record
for six persisted entities — User, Branch, Report, Audio, Transcription,
ChatConversation — authored by §19–§24 and governed by the storage and
retention rules of §12.9, the conventions of §18, and the ownership
model of §3.2.3 (everything user-scoped per BR-13). §17 renders that
system as one canonical view: entity inventory, ERD with cardinalities,
the cascade and lifecycle map, the storage map, and the data-presence
invariants under the five-state status machine. Field-level schemas,
endpoint behaviors, and transitions are owned exclusively by §19–§24
and §30–§31 and §33; this section commits the overview only and no
field sets, endpoints, or transition rules.

### 17.1 Purpose & scope

§17 is the data-system counterpart to the runtime view of §12: it maps
every persisted row to its owning model section, shows how rows relate
and where cascades run, and states which artifacts must exist at each
report status — the data view that §30/§31 guards will enforce in
Part C. Boundaries: field-level schemas = §19–§24; conventions
(timestamps, transforms, indexes, TTL, sessions) = §18; seeding and
mock rules = §25 and §40; binary storage = §32; retention and sweeper =
§31 and §62 (constants in §11). No new endpoint, no new constant, and
no new path is introduced here; any future entity requires amending
§17, §13.3, and §15 in the same change (G6 central-state visibility).

### 17.2 Entity inventory & system of record

| Entity | Model section | Owner scope (§3.2.3, BR-13) | Key (per §12.11-1, §12.11-3) | Notes |
|---|---|---|---|---|
| User | §19 | user-scoped | `_id` | single actor; no roles (ADR-036) |
| Branch | §20 | user-scoped (`user`) | `_id` | created and owned by the registering user; two-path lifecycle (BR-14, BR-16) |
| Report | §21 | user-scoped (`user`) | `_id`, report date field | five-status machine (`REPORT_STATUSES`, §11.4; BR-06) |
| Audio | §22 | user-scoped (`user`) | `_id` | document carries metadata only; binary on local FS (§12.9) |
| Transcription | §23 | user-scoped (`user`) | `_id` | derived from one audio; `raw` + `latest` (F5) |
| ChatConversation | §24 | user-scoped (`user`) | `_id` | one per report; messages carry `{ provider, model, reasoning }` (§16.2, §36) |

Ownership: every row of the six collections is bound to the
authenticated, server-assigned user (`req.user._id.toString()`,
§3.2.3); all queries across §30–§39 resolve the owning user
server-side; nothing is shared between users. Branches are owned by
their creator, and reports reference them only through the embedded
snapshot (BR-14). The six collections above are the complete
persisted system of record; the `branches[]` block and conversation
messages are child documents of their owning
entity (§17.3), not separate collections.

### 17.3 Entity–relationship map (ERD) & cardinalities

Compact map (the §12.3 style is the rendered diagram; this table is
the authoritative edge list):

| Edge | Cardinality | Key fields | Authority |
|---|---|---|---|
| User — Branch | 1 — N | `user` on Branch | §3.2.3, §20 |
| User — Report | 1 — N | `user` on Report | §3.2.3, §21 |
| Branch — Report | N — M via snapshot | `branches[].branch` + snapshot `name` | §20, BR-14 |
| Report — Audio | 1 — N clips, ordered | audio refs | BR-01/BR-02, §22 |
| Audio — Transcription | 1 — 1 | transcription ref | §22, §23, §33 |
| Report — ChatConversation | 1 — N | conversation refs | §24, §36 |

No collection reads another collection's private cells except through
the edges above. The branch snapshot is copied at report creation and
never rewritten by later branch edits (§3.2.3, BR-14); a report that
references an archived or deleted branch still renders its name. The
snapshot shape is `branches[].{ branch, name }` — `branch` is the
branch document id (live join key, rename-proof; used by branch
filters and pickers while the branch exists), `name` is the immutable
display snapshot (`§17.4` tombstone rules).

### 17.4 Cascade, lifecycle & integrity map

- **Hard delete** happens only via the service layer, inside
  sessions/transactions (§18): report delete cascades its
  audio documents, transcriptions, conversations, and version rows;
  audio delete cascades its transcription; binary unlink failures are
  retried by the orphan sweep (§12.9, §31, §62).
- **Audio removal (delete a clip) at any status (BR-10).** Deleting
  one audio of a report always cascades its transcription and leaves
  the report row and every other artifact intact. Pre-completion the
  status survives as long as the presence map of §17.6 still holds;
  deleting the **last** audio of a `audio_attached` report rewinds to
  `draft`, and of a `transcribed`/`reviewed` report rewinds to
  `audio_attached` — the single explicit backward transition
  (ADR-003; declared in §31). A `completed` report never rewinds:
  the accepted content (`latest`) is fixed at acceptance (BR-11), so
  audio deletion there is storage hygiene only and leaves the status
  and accepted content untouched. The remaining clips' items re-merge in
  chronological order before the next generation (§6.4).
- **Audio addition at any status (BR-10).** New clips can be attached
  at every status; adding never rewinds a status — at `draft` it
  simply enables the next forward step (`draft` → `audio_attached`)
  when the user proceeds, and at later statuses it adds source
  material for the next generation/correction cycle.
- **Two-path lifecycle** (BR-14, BR-16): archive is soft (`isArchived`,
  `archivedAt`, hidden from pickers by default) and reversible
  (`restore`); delete is soft on a `deletedAt` marker; permanent
  removal runs only via the sweeper after `ARCHIVED_TTL_SECONDS`
  (§11.3, BR-15) or the TTL-index safety net (§18). Branch
  archiving/deletion never breaks report history — the name snapshot
  survives (BR-14).
- **Immutability:** `raw` is written once and never touched; `latest`
  is the single current-content slot (BR-11); no version chain
  exists.
- **Ownership guard:** every user-scoped query resolves `user`
  from the authenticated session; a row whose owner differs from the
  session is a data-integrity violation (§3.2.3 enforcement, §30).
- **No cascade Branch → Report:** the embedded snapshot means branch
  rename, archive, or delete never cascades into reports (BR-14).
- **Tombstone rule (deleted branches):** after a branch is
  permanently removed (sweeper or TTL index, `ARCHIVED_TTL_SECONDS`),
  its `branches[].branch` references become tombstones — any lookup
  of the deleted document returns `null`. Every report read path
  (list, detail, export, analytics) renders the snapshot `name` and
  never requires the branch lookup to succeed; the ref is joined
  best-effort only while the document exists (branch filters and
  pickers are built from live branches only). A tombstone is never
  rewritten, never re-attached, and never an error for the report —
  history stays readable (BR-14). The orphan sweep never deletes a
  report because its branch is gone (§12.9, §62).

### 17.5 Storage, retention & seeding map

- Single system of record: MongoDB (the six collections of 17.2),
  built by the §19–§24 models (§12.3, §12.9, §15). Binary audio lives
  on the local filesystem (`uploads/audio/`, gitignored) with only
  metadata (path, size, duration, MIME) in the Audio document; no
  GridFS, no object store (§12.9).
- Exports are generated in the browser; the Google Docs file is
  created in the user's own Drive under the `drive.file` scope (§37).
- Retention & sweeps: the sweeper timer (§26, §62) permanently removes
  expired rows per `ARCHIVED_TTL_SECONDS`; orphan audio sweep retries
  failed unlinks (§31, §62); logs rotate at 30 days (§9.5).
- Seeding: mock/seed data flows only through §25 rules and the §40
  seed endpoints; never hard-coded into models (§40).
- Out of scope: backups, external object storage, CDN (§12.9, §4.2).

### 17.6 Status-machine data-presence invariants

The statuses are `REPORT_STATUSES` (§11.4; BR-06). The table below
states which persisted artifacts exist while a report sits in each
state — the data presence requirement; the *transitions* and their
guards live exclusively in §30/§31, so this table is the mirror view,
never the rule book. The only backward movement anywhere in the
machine is the explicit material-removal rewind of §17.4 (last audio
deleted), declared in §31 (ADR-003); because the rewind moves a row
to the highest state whose presence requirements still hold, the map
below stays valid at every instant — including immediately after any
audio addition, removal, or content edit (BR-10).

| Status | Required persisted artifacts |
|---|---|
| `draft` | report row only (no audio required) |
| `audio_attached` | report + at least one `Audio` row |
| `transcribed` | report + audio rows + transcription(s) with `raw` (and `latest`, both initialized equal) |
| `reviewed` | transcription content locked by the review decision (accept/revert, BR-11) |
| `completed` | accepted content fixed at accept (BR-08, BR-11); report exported (§37) |

An invariant across every status: the report's `user` equals the
session owner and every artifact of §17.4/§17.6 is present — a row that
violates the map above is a data-integrity violation (§30). Content and
transcription edits never change these rows (BR-11), audio removal
cascades transcription (17.4), and the last-audio rewind lands on the
highest state whose presence holds — so the map is never violated by
an allowed material change (BR-10).

### 17.7 Verification usage

- Grep gates: `ARCHIVED_TTL_SECONDS`, `REPORT_STATUSES`,
  `ADDIS_AI_STT_MAX_DURATION_SEC` resolve to §11.3/§11.4 — never the
  literals `2592000`, status strings, or durations; only the six
  §19–§24 entities appear in §17; the edges of 17.3 map to BR-01/
  BR-02, BR-06, BR-08, BR-10, BR-14, BR-15, BR-16, and
  §16.6 message metadata; the snapshot shape everywhere is
  `branches[].{ branch, name }` and no read path treats a missing
  branch document as an error state (tombstone rule, 17.4). Audio
  deletion cascades transcription, the last-audio rewind is the only
  backward transition and must be declared in §31 (ADR-003), and
  `completed` reports never rewind on any edit or audio change
  (BR-10).
- Cross-section checks: §17 never asserts an endpoint, fieldset,
  transition, or policy owned by §19–§24, §30–§31, or §33–§37; seeding
  and storage mirror §12.9 and §25/§40 exactly; the ownership view
  matches §3.2.3/BR-13 (user-owned branches and reports).
- §17 introduces no constant (§11 unchanged), no path (§15.4
  unchanged), and no package; it is standalone — it references only
  specification sections, never plan folders or tool files.
