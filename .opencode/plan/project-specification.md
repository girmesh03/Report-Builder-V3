# Report Builder V3 — Project Specification

> **Document type:** Complete PRD + PDS + SAD + HLD + LLD + SDD in a single document.
> Every section of this specification passes its applicable content rules and
> checklists before being considered complete.
>
> **Source of truth (priority):** (1) Basic App Information & requirements in this
> project session; (2) `backend/package.json` & `client/package.json`; (3) locked user
> decisions in this session; (4) Addis AI public docs; (5) MUI community docs; (6) session notes.
> Conflicts resolve against the higher-priority source and are registered in §69.
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

*(Sections are authored in dependency order; each heading links to its section.)*

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
conversations, report version history, user profiles, and reporting analytics,
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
  Correct (accept model: `text = aiCorrectedText` on Accept; one-click "Revert
  to original" while `aiCorrectedText` exists; next correction overwrites the
  slot — single-undo, no revision history);
  Mode 3 — voice correction (record → STT → fills the instruction field →
  Mode 2).
- **Generate.** The AI transforms the reviewed transcription into the
  structured Amharic report (§6, §34) and rules §8.
- **Review and correct.** After generation, the supervisor reviews the report
  and may request corrections; correction updates only the relevant parts of
  the report and never rewrites correct unrelated sections (§35, §54).
  Correction modes per §1.4.
- **Version.** Generated content and its version history are handled per the
  Unified ReportVersion — ADR-005 (§21, §22).
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

*§1 authored — content rules pass (cross-reference sweep clean; pointers
to §2–§17, §19–§35, §53–§58 and §69 resolve in-document).*

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
| G4 | Reports remain editable after generation, with version history preserved | Unified ReportVersion (ADR-005; §21) |
| G5 | Full support for supervision across multiple branches in a single working day (per-branch time ranges) | §6 (Type 2), §21 |
| G6 | Centralized management of branches, daily reports, transcriptions, generated reports, AI conversations, report version history, user profiles, and reporting analytics in one application | §17, Part C, Part D |
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
  or multi-branch (Type 2) — from the reviewed transcription only, following
  §6 and the §8 rules.
- **Review and correct after generation.** Review the report and apply
  corrections to the relevant part only; correct unrelated content must
  remain unchanged (§35, §54).
- **Version.** Keep the generated content versioned and editable; preserve
  at least the correct previous version with history (Unified ReportVersion —
  ADR-005; §21).
- **Export.** Export without leaving the application: PDF, TXT, CSV, XLSX
  (client-side) and Google Docs directly in the user's own Google Drive with
  the user's own OAuth token (backend-only; drive.file scope) (§37, §58).
- **Management.** Manage branches, reports, transcriptions, AI conversations,
  version history, user profile, and analytics from one web application
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

*§2 authored — derived solely from the Basic App Information and §1; content
rules pass; all references resolve in-document; no invented numeric targets.
Pointers to §5/§6/§8/§9/§13/§16/§17/§21/§28/§33/§34/§35/§37/§53/§54/§58/§69
detailed in later parts.*

---

## 3. Scope, Users & Personas

### 3.1 Scope

#### 3.1.1 Scope statement

This version of Report Builder V3 delivers the complete daily-supervision
reporting workflow for the restaurant company's Area Supervisor, as a web-only
application. It covers the full loop — record → transcribe → review/correct →
generate → review/correct → accept → export — plus centralized management of
branches, reports, transcriptions, AI conversations, version history, user
profile, and analytics. Everything beyond the boundaries declared in §3.1.3 is
out of scope for this release.

#### 3.1.2 In-scope feature set

| # | Feature group | In scope (this version) | Traced to |
| - | ------------- | ----------------------- | --------- |
| F1 | Identity & profile | Self-service registration with email + password only; auto-extraction of `firstName`/`lastName` from the email local part; optional profile fields (`avatar`, `position`) set later on the Profile page; Google account registration/sign-in (name, email, avatar; no password for OAuth-created accounts); login, logout, refresh-token rotation (JWT 2-token, httpOnly cookies) | §28, §19 |
| F2 | Branch management | Branch create/read/update; archive → restore → permanent delete (two-path deletion lifecycle); branches listed in pickers, Reports UI, and global search (active-only by default; archived only on explicit filter) | §20, §30, §62 |
| F3 | Report workflow | Wizard-created report (Steps 1–5); one or more audio clips per report; upload as `multipart/form-data` (`clips` field); STT transcription via Addis AI with backend chunking; transcription review, edit, AI correction (typed or voice), re-transcription; AI report generation; report review/correction after generation (3 modes, per §1.4); accept → persisted, versioned | §52, §53, §32, §33, §54, §34, §35, §31, §21 |
| F4 | Status & lifecycle | Report status machine (draft → audio_attached → transcribed → reviewed → completed) + guards; archive/restore/delete; sweeper + TTL retention | §31, §62 |
| F5 | Content data | Report content with version history (Unified ReportVersion — ADR-005; §21); transcription text (`text`, `aiCorrectedText`); audio records; AI chat conversations per report | §21, §23, §22, §24 |
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

- **User-scoped (private):** reports, transcriptions, audio, AI conversations,
  analytics — all bound to the authenticated, server-assigned user
  (`req.user._id.toString()`); visibility is personal (§19, §28).
- **Shared (global):** branches — the branch list is company-level and shared
  across all supervisors; branch data is embedded into each report's
  branch entries (snapshot by name) and stays readable even after
  archiving (§20, §30).
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
| A3 | Branch global scope | Branch list is global/shared; report/transcription/chat data is user-scoped (§3.2.3). |
| A4 | Days & reports | A report may be created per date; the date comes from the report format (§6), not the system clock; multi-clip days are allowed. |
| A5 | Single-branch vs multi-branch | Both format types supported (§6 Type 1 / Type 2) with per-branch time ranges. |
| A6 | Language realism | Amharic is first-class; English/tech words transliterated; UI stays English (§1.7). |

### 3.5 Explicit non-claims

- No numeric performance, accuracy, or timeline targets are asserted in any
  persona or scope description; SC-8 (§2.4) applies.
- No sample branch or supervisor names are used here; they belong exclusively
  to the sample reports in §6.

---

*§3 authored — derived from the Basic App Information, §1, and §2; content
rules pass; all references resolve in-document; assumptions A1–A6 declared;
personas contain no invented facts or metrics.*

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
- a multi-company / multi-tenant platform — one company's global branch list
  (§3.2.3), single-tenant;
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

*§4 authored — derived from §1–§3; all references resolve to existing
sections (checked against the outline); no invented details — every item is a
user decision recorded in §1.4 and §3.1.3–§3.1.5; nothing registered as an
open question; pointers to §7/§9/§12/§13/§16/§19/§28/§29/§32/§33/§35/§41/§43/
§44/§47/§51/§54/§63/§64/§66/§69 detailed in later parts.*

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
- **BR-06 — Forward-only status machine.** Every report moves through the
  five states — `draft → audio_attached → transcribed → reviewed → completed`
  — in order, without skipping states. The authoritative transition-guard
  table lives in §31 and is reused identically by §51/§52 UI actions
  (status–guard consistency).
- **BR-07 — Transcription is raw material only.** The transcription is never
  the final report; the AI-generated report is produced from the reviewed
  transcription (§1.4, §2.3, §33).
- **BR-08 — Review-then-accept.** A report becomes `completed` only after the
  supervisor reviews and accepts the generated report (per the three
  correction modes of §1.4; accept model BR-11). Acceptance is the
  checkpoint that persists and releases the version (§21).

### 5.4 Correction, editing & versioning rules

- **BR-09 — Surgical corrections.** A correction (typed instruction or voice
  instruction) updates only the relevant part of the report; correct
  unrelated sections remain unchanged after the correction (§2.2 G3, §2.4
  SC-3, §35, §54).
- **BR-10 — Editable after generation, versioned.** Generated reports remain
  editable after generation; every change creates the next version of the
  Unified ReportVersion (ADR-005; §21, §22; OQ-001 remains open for future
  extended history).
- **BR-11 — Single-undo accept model.** Accept sets `text = aiCorrectedText`;
  a one-click "Revert to original" is available while `aiCorrectedText`
  exists; the next correction overwrites the slot — single-undo, no
  revision-history model (§1.4; decision 2026-08-08).
- **BR-12 — Verification allowed until accept.** Re-transcription is
  available for verification on every audio recording until the report is
  accepted/completed (§2.4 SC-1, §2.2 G9, §33, §54).

### 5.5 Ownership & deletion-lifetime rules

- **BR-13 — Global vs personal scope.** Branches are global/shared across all
  supervisors; user records — reports, transcriptions, audio, AI
  conversations, analytics — are private to the authenticated user
  (§3.2.3, §19, §28).
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

*§5 authored — derived from §1–§4 with the cross-reference rules applied;
no invented details — every BR is anchored to a prior section or an open
question; no `TODO(open)` markers; pointers to §6/§7/§8/§9/§11/§19/§20/§21/§22/
§28/§30/§31/§32/§33/§35/§37/§51/§52/§53/§54/§58/§62/§69 detailed in later parts.*
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
  the report never repeats the narration verbatim (see §8 rule 3).

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

*§6 authored — derived from the requirements' report-format specification;
samples preserved verbatim in §6.8; canonical conventions in §6.3–§6.5
govern generation; all references resolve in-document; no invented
content; pointers to §7/§8/§19/§31/§34/§35/§37/§54/§58 detailed in later
parts.*

---

## 7. Language & Tone Requirements (Transliteration)

### 7.1 Purpose & relationship

This section is the canonical home of the Amharic-transliteration rule
for English and technical workplace words, plus the term dictionary
derived from the verbatim samples. It implements §5 BR-17 (language
contract) at the language level: audio and transcription are Amharic,
the UI is English, and English/technical words in the report use
Amharic workplace transliteration — never literal translation. The
generation pipeline (§34), validation (§31), and correction (§35) all
apply this section.

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

### 7.4 Term dictionary derived from the §6.8 samples

Terms observed inside the verbatim sample reports (§6.8). This list is
derived from the samples and is not exhaustive; terms not listed follow
the rule of §7.2 (common Amharic workplace pronunciation).

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

- The rule applies to **all** English or technical words, without
  exception list (§7.2).
- Literal translation is forbidden (`ጥልቅ መጥበሻ` for `deep fryer`).
- Raw English spelling is kept only if no Amharic phonetic form is in
  common workplace use; the dictionary above documents the known cases.
- The sample branch and person names are excluded from this
  specification entirely (§6.1, §1.6, §3.5) and are never transliterated
  or reused.

### 7.6 Verification usage

- §2.4 SC-2 and §2.6 DoD item 3: generated output is checked for
  transliteration violations (raw English, literal translation) against
  §7.2–§7.4.
- §2.4 SC-2: transliteration violations (raw English, literal translation)
  fail the report format/tone gate.
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
| 4 | Source of truth is the transcription **after** review (§1.4, §30) | §30, §34 |
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

### 8.5 Correction & review behavior (canonical)

This subsection is the canonical home of the review-and-correct behavior:
what happens after generation, what the user can ask for, and how a
correction is applied. It implements §5 BR-08 (review-then-accept),
BR-09 (surgical corrections), BR-10 (editable, versioned), and rule 16 of
this section. Implementation lives in §35 (correction pipeline) and §21
(acceptance model); the version history is §21 per ADR-005 (see OQ-001).

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

This is rule 16 of §8 and BR-09 of §5. A correction creates a new
version; the previous version stays in history (§5 BR-10, §21). Before
acceptance the corrected text becomes the pending `aiCorrectedText`;
acceptance fixes it as the report text (§5 BR-11, §21).

#### 8.5.3 Conversation-to-report example (verbatim)

The requirements include a raw conversational audio transcript and its
extracted final report. The raw transcript is reproduced verbatim
below; its extracted report is §6.8 Sample 4.

```text
ቀን 09 11 18 ብራንች ጎላጉል እና ብስራተ ገብርኤል ብራንች ጎላጉል እና ብስራተ ገብርኤል ስም ቤዛ አያሌው ስም ቤዛ አያሌው ስራ የገባሁበት ሰዓት ከ አንድ ሰአት ከአምስት እስከ ሁለት ሰአት ከሃያ ጎላጉል ብራንች ከሶስት ሰአት ከ ሶስት ሰአት ከሰላሳ እስከ ዘጠኝ ሰአት ከሃያ በስራተ ገብርኤል ከዘጠኝ ሰአት ከሃምሳ አምስት እስከ አስራ ሁለት ሰአት ጎላጉል ብራንች የተሰራ ስራ በቴክ ሊስቱ መሰረት በቼክ ሊስቱ መሰረት በሁለቱም ብራንቾች የሚከናወኑ ስራዎችን በአግባቡ መሆናቸውን አረጋግጫለሁ። ሌላ የተሰራ ስራ አንዳንድ ሰራተኞች ብራንቹ የት ነበር? በጎላጎል ብራንድ ያሉ አንዳንድ ሰራተኞች ላይ የአሰራር ስርዓት ክፍተት ስለነበረ እነዚህ የአሰራር ስርዓት ያለባቸውን ሰራተኞችን እና ሱፐርቫይዘሩን ጨምሮ ያየሁትን የስራ አሰራር ክፍተት በድጋሚ እንዳይፈጽሙት መመሪያ ሰጥቻቸዋለሁ። በጎላጉል ቅርንጫፍ ማክሰኞ ሪፖርት ተደርጎ የነበረው የእቃ ማጠቢያ ሲንክ ድሬኔጅ እንዲስተካከል ጠይቄ የነበረው ማትያስ መጥቶ አስተካክሎታል። በብስራተ ገብርኤል ከዚህ በፊት ተጠይቆ የነበረው ኢንሴክት ኪለር በማትያስ አማካኝነት እንዲሰቀል አድርጌያለሁ።ሌላ ኢሹ ወይም አፋጣኝ መፍትሄ የሚፈልግ ጉዳዮች  አፋጣኝ መፍትሄ የሚፈልጉ ጉዳዮች በብስራተ ገብርኤል ያለው ዲፕ ፍራየር ኮንታክተር ችግር ነበረበት እሱ እንዲስተካከል ማትያስን አናግሬዋለሁ ስለዚህ ነገ መጥቶ ያስተካክለዋል ወይም እንደሚያስተካክለው አረጋግጦልኛል ሌላ በብስራተ ግብረ ኤል ያለ አፋጣኝ መፍትሄ የሚፈልግ ችግር በእግር ተረግጦ ኦፕሬት የሚደረግ እጅ መታጠቢያ አለ ይህ እጅ መታጠቢያ በቢውልዲንጉ ወይም ደግሞ በህንፃው ላይ ያሉ ሰራተኞች ወይም የሌላ ድርጅት ሰራተኞች አብረውን ስለሚጠቀሙ የከፍተኛ የሆነ የሳሙና እና የውሃ በክነት አለ የሆነ የሳሙና እና የውሃ ብክነት አለ። እጅ መታጠቢያውም ቶሎ ቶሎ እየተበላሸ ነው። ስለዚህ ይሄ ከህንፃው አሰራሮች ከህንፃው አሰራሮች ጋራ በመነጋገር አፋጣኝ መፍትሄ ይፈልጋል። እ ሌላ በጎላጉል ብራንች አፋጣኝ መፍትሄ የሚፈልግ ጉዳይ እ ሶኬት እና ማብሪያ ማጥፊያዎች የላሉ መስተካከል ያለባቸው ልክ ያልሆኑ አሉ። እነሱን እንደ እንዲያስተካክል ማቲያስን አናግሬው ነገ መጥቶ እንደሚያስተካክል አሳውቆኛል አጠቃላይ አስተያየት በሁለቱም ብራንቾች ያለው የስራ እንቅስቃሴ ጥሩ ነው
```

#### 8.5.4 Verification usage

- §2.4 SC-3: correction behavior is tested end-to-end (typed and spoken);
  §2.6 DoD item 2 is STT accuracy (SC-1).
- §5 BR-09 and BR-10/BR-11 are enforced here; §35 and §21 implement them.

### 8.6 Verification usage

- §2.4 SC-2 / §2.6 DoD item 3: rule adherence is verified against the
  §6.8 samples and §6.5 conventions.
- BR-17 and BR-19 are enforced through rules 1, 5, 6.

---

*§7–§9 authored — §7.2/§7.3/§8.2/§8.4/§8.5.1/§8.5.2 and the §8.5.3 transcript
preserved verbatim from the requirements; §7.4 derived only from §6.8
samples; canonical decisions in §8.3; no invented content; pointers to
§21/§30/§31/§34/§35 detailed in later parts.*

