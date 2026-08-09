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

Authored top sections (each heading links to its section; later
sections are appended here as they are authored):

- [1. Introduction, Background & Problem Statement](#1-introduction-background--problem-statement)
- [2. Goals, Objectives & Success Criteria](#2-goals-objectives--success-criteria)
- [3. Scope, Users & Personas](#3-scope-users--personas)
- [4. Deferred Features & Non-Goals](#4-deferred-features--non-goals)
- [5. Core Business Rules](#5-core-business-rules)
- [6. Report Format Specification](#6-report-format-specification)
- [7. Language & Tone Requirements (Transliteration, UI vs Content Language)](#7-language--tone-requirements-transliteration-ui-vs-content-language)
- [8. AI Behavior Rules](#8-ai-behavior-rules)
- [9. Standards, Conventions & Code Style](#9-standards-conventions--code-style)
- [10. Environment & Configuration](#10-environment--configuration)
- [11. Constants & httpStatus](#11-constants--httpstatus)
- [12. System Architecture Overview](#12-system-architecture-overview)
- [13. Technology Stack & Versions](#13-technology-stack--versions)
- [14. ADR Index](#14-adr-index)
- [15. Project Structure](#15-project-structure)
- [16. AI Provider Integration Architecture](#16-ai-provider-integration-architecture)
- [17. Data System Overview (ERD + relationships + cascade map)](#17-data-system-overview-erd--relationships--cascade-map)
- [18. Data Model Conventions (timestamps, transforms, indexes, TTL, sessions)](#18-data-model-conventions-timestamps-transforms-indexes-ttl-sessions)
- [19. User Model](#19-user-model)
- [20. Branch Model](#20-branch-model)
- [21. Report Model](#21-report-model)
- [22. Audio Model](#22-audio-model)
- [23. Transcription Model](#23-transcription-model)
- [24. ChatConversation Model](#24-chatconversation-model)
- [25. Mock Content & Seeding](#25-mock-content--seeding)
- [41. Frontend Foundation](#41-frontend-foundation)
- [42. Frontend Network Layer](#42-frontend-network-layer)
- [43. Design & Theme System](#43-design--theme-system)
- [44. Theme & Component Customizations](#44-theme--component-customizations)
- [45. Responsive System](#45-responsive-system)
- [46. MUI Reusable Component Library](#46-mui-reusable-component-library)
- [47. Layout System](#47-layout-system)
- [48. Pages — Auth (Landing, Login, Register)](#48-pages--auth-landing-login-register)
- [49. Page — Dashboard & Analytics UI](#49-page--dashboard--analytics-ui)
- [50. Page — Reports List](#50-page--reports-list)
- [51. Page — Report Details](#51-page--report-details)
- [52. Page — Report Creation Wizard](#52-page--report-creation-wizard)
- [53. Audio Recording UX](#53-audio-recording-ux)
- [54. Transcription Review UX](#54-transcription-review-ux)
- [55. AI Correction Chat UI](#55-ai-correction-chat-ui)
- [56. Page — Branches](#56-page--branches)
- [57. Page — Profile](#57-page--profile)
- [58. Export UI](#58-export-ui)
- [59. Global Search & 404 Page](#59-global-search--404-page)

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
**Type-1 — single branch** and **Type-2 — multiple branches**.

**Type-1 — Single branch**

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

In Type-1 the work-start time (ስራ የገባሁበት ሰዓት) is a single line.

**Type-2 — Multiple branches**

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

In Type-2:

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
| G5 | Full support for supervision across multiple branches in a single working day (per-branch time ranges) | §6 (Type-2), §21 |
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
- **Generate.** Generate the structured Amharic report — single-branch (Type-1)
  or multi-branch (Type-2) — from the captured form metadata (header values)
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
The generated report matches the §6 format skeleton (Type-1 or Type-2),
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
review/correct → accept → export — works for a single-branch day (Type-1) and
for a multi-branch day (Type-2 with per-branch time ranges and `/`-joined
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
| F3 | Report workflow | Wizard-created report (Steps 1–5); one or more audio clips per report; upload as `multipart/form-data` (`clips` field); STT transcription via Addis AI with backend chunking; transcription review, edit, AI correction (typed or voice), re-transcription; AI report generation; report review/correction after generation (3 modes, per §1.4); accept → persisted (`latest` fixed, BR-11) | §52, §53, §32, §33, §54, §34, §35, §31, §21 |
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
| Goals (per §2) | Boss-ready structured report with minimal effort (G1); correct information; corrected report without full rewrite (G3); editable-after-generation (single-undo, BR-11), exportable, managed centrally (G4–G7). |
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
| A5 | Single-branch vs multi-branch | Both format types supported (§6 Type-1 / Type-2) with per-branch time ranges. |
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
- **BR-03 — Single- or multi-branch days (Type-1 / Type-2).** A day's
  report covers one branch (Type-1) or several branches (Type-2) with
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
  revision-history model (§1.4; decision 2026-08-09).
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
  the sweeper after the TTL window: **30 days / 2592000 s** from the
  archive anchor of the owning model (§62, §31) — no model stores a
  `deletedAt` (§18.3, §20.2, §21.2). No other path may hard-delete user
  data once archived — retention contracts in §62, constants in §11.
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
Amharic structure, the two format types (Type-1 — single branch, Type-2 —
multiple branches), the field rules, content routing, tone, and the
verbatim sample reports. §1.6 is a summary only and defers here; the
format defined in this section is what generation (§34), validation
(§31), correction (§35), review (§54), and export (§37, §58) all operate
against.

- **Verification gates.** §2.4 SC-2 (report matches the §6 format and
  tone) and SC-4 (full loop works for Type-1 and Type-2) are checked
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

In Type-2 the ስራ የገባሁበት ሰዓት line is replaced by one time-range
line per branch visit (see §6.4); every other line is identical.

### 6.3 Field definitions

| # | Label (Amharic) | Meaning | Value source | Cardinality | Format / notes |
| - | --------------- | ------- | ------------ | ----------- | -------------- |
| 1 | `ቀን` | Report date | Capture form (report date); fallback: reviewed transcription → blank | Single line | Ethiopian `DD-MM-YY` (e.g. `29-10-18`); never the system clock (§5 BR-01) |
| 2 | `ብራንች` | Branch (Type-1) or branches (Type-2) | Capture form (visits → branch names joined with ` / `); fallback: reviewed transcription → blank | Type-1: one name. Type-2: names joined with ` / ` | Text |
| 3 | `ስም` | Full supervisor name | User profile (§19); captured into the capture form | Single line | Text |
| 4 | `ስራ የገባሁበት ሰዓት` | Work-start time / per-branch time ranges | Capture form (visit times); fallback: reviewed transcription → blank | Type-1: one line. Type-2: one line per branch visit | 24h `HH:mm` (Type-1); `ከ[HH:mm] - [HH:mm] [branch] ብራንች` (Type-2) |
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

**Type-1 — single branch:**

- The working day covers exactly one branch.
- `ብራንች:` line contains one branch name.
- `ስራ የገባሁበት ሰዓት:` line contains a single work-start time (`HH:mm`).

**Type-2 — multiple visits:**

- The working day covers two or more visits.
- `ብራንች:` line lists all visited branches joined with ` / ` (e.g.
  `መድኃኒዓለም / ኤርፖርት`); a branch visited more than once is listed
  once in this header line.
- `ስራ የገባሁበት ሰዓት:` shows **one time-range line per branch visit**,
  ordered **chronologically by visit start time** (temporary decision;
  §14.2 status rule, §14.5 protocol):
  `ከ[HH:mm] - [HH:mm] [branch name] ብራንች` (e.g. `ከ02:30 - 07:40 መድኃኒዓለም ብራንች`).
- A branch visited twice appears as two separate lines with its own
  start/end times (see Sample 4).

The type is derived deterministically from the **number of visits**:
one visit → Type-1; two or more visits → Type-2 — the count of
visits governs, not the count of distinct branches, so a day visiting
one branch twice is a Type-2 day (§21.2).
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

**Sample 1 — Type-2, two branches (29-10-18)**

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

**Sample 2 — Type-2, three branches (26-10-18)**

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

**Sample 3 — Type-1, single branch (22-10-18)**

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

**Sample 4 — Type-2, branch revisited (09-11-18)**

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
- §2.4 SC-4: the full loop is exercised for both a Type-1 day and a Type-2
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
| 2 | The §6.2 skeleton with §6.3 fields; Type-1/Type-2 per §6.4 | §6, §34 |
| 3 | Tone per §6.6 and the §6.8 samples | §6.6, §31 |
| 4 | Source of truth is the transcription **after** review for body content; header metadata (the date, branch names, visit times) comes from the capture form (§6.1, §6.3) | §6.1, §6.3, §30, §34 |
| 5 | Same as §5 BR-19; no invented facts, blanks allowed | §6.1, §7.2 |
| 6 | Missing values render as blank or "not specified"; the chosen prompt rule is this default (temporary decision; §14.2 status rule, §14.5 protocol) | §6.1, §34 |
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
opinions, actions, and time ranges. Header values (the date, branch names,
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
| `MESSAGE_ROLES` | `['system', 'user', 'assistant']` | §24, §36 |

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
a named key before it is referenced (e.g. `NOT_EXTENDED` if not
already present — add it there, never a numeric literal).

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
    require a realtime component yet to be defined (owners §33, §66).
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
    `archivedAt` as the MongoDB-internal safety net (BR-15, §18,
    §62).
12. **English chrome, Amharic content.** The UI chrome — shell,
    navigation, labels, buttons, validation messages, helper text —
    is English per §7.6; Amharic is the language of the produced
    report and of user-entered content only (§6, §7.6).

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
     mounted in `routes/index.js` (§26); each route mounts its domain
     validator rule chain followed by the validation harness before
     its controller (§26, §29);
  3. **Validator layer** — every domain exposes an express-validator
     rule chain in `validators/<domain>.validator.js` (^7.3.2, §13.3);
     the shared harness `validators/validation.js` runs
     `validationResult(req)` — on failure it responds 422 with the §27
     validation-error shape; on success it attaches
     `req.validated = { body: matchedData(req, { locations: ['body'] }),
     params: matchedData(req, { locations: ['params'] }),
     query: matchedData(req, { locations: ['query'] }) }` and calls
     `next()` (§26, §29);
  4. **Controller layer** — one controller file per domain; handlers
     are wrapped with `express-async-handler`; controllers hold no
     validation or auth logic — they read `req.user._id` and
     destructure `req.validated` (§26, §28); write handlers use the
     transaction template (startSession → startTransaction → writes →
     commit/abort → endSession in finally); errors are always
     forwarded via `next(error)` — no catch block responds directly
     or swallows an error (§27);
  5. **Data layer** — Mongoose models (session-aware hooks and
methods), `mongoose-paginate-v2` on list endpoints (page 1, limit
      10, max 100), TTL indexes where declared (§18–§24).
- **Response contract:** every HTTP response is the envelope
  `{ success, message, data }` (paginated lists add
  `{ docs, page, limit, totalDocs, totalPages }`); error responses
  reuse the same envelope with `data: null` (§5, §27).
- **Errors:** `CustomError`; the global error handler logs via
  Winston; development returns the stack trace, production a generic
  message (§27).
- **Single error path (normative):** every request/response error —
  422 validation failures, controller and service throws, provider
  failures, unmatched 404s — converges on the one global error handler
  through `next(error)`; no layer responds to an error directly,
  rewrites it as a different status, or logs-and-continues.
  Background work (the sweeper) is logging-only (§27, §62).
- **User-readable messages (normative):** every `message` served to
  the frontend is plain end-user language — "Please login again",
  never "Authentication is required"; no technical terms, provider
  names, or internals reach the client; details stay in the logs and,
  development only, the stack trace (§27).
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
| 4 | Environment lookup chain: live process environment → pre-defined `.env` → `backend/.env` and `client/.env` → default → fail-fast (required) | §10.2–§10.4, §12.10 |
| 5 | Amharic STT is provided by Addis AI **exclusively**; Gemini and NVIDIA are text-generation providers only | §12.8, §16, §33 (ADR-001; index §14) |
| 6 | Every backend error path — 422 validation failures, controller and service throws, provider failures, unmatched 404s — converges on the single global error handler via `next(error)`; no layer responds directly or swallows errors; the sweeper remains logging-only | §12.5, §27, §62 |
| 7 | Every user-facing error `message` is plain end-user language ("Please login again"); technical terms never reach the client — internals stay in logs; the stack trace is development-only | §12.5, §27 |

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
| @fontsource/noto-serif-ethiopic | Ethiopic content face — report, transcription, and chat surfaces (§43) | client dependencies | theme phase in §66; §43 |
| NVIDIA multipart transport helper (named at install) | Conditional (§16.4): only if the installed runtime lacks reliable multipart forwarding to NVIDIA | backend dependencies | transport phase in §66; §16.4 rules stay in force |

Until these are installed, no section may assume their behavior; the
editor and its sanitization are introduced by the editor phase (§66),
and the transport helper — conditional by nature — is installed only
under the §16.4 condition, never proactively.

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
3. **Status is temporary by nature.** — Every row carries exactly one
   status: **Approved** (in force and implemented as of this writing),
   **Approved (temp; §14.4)** (approved for a phase, not secured
   permanently), or **Retired** (with the retirement date) — all
   changeable going forward through the §14.5 protocol. No status
   here claims permanence; a row changes only through the protocol,
   never by silent edit. The §12.11 register of cross-cutting
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
| 031 | Provider-neutral OAuth service architecture | Approved | §28, §37 |
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
   rows D4/D5 show the reversal/deferral precedent — D4 reverses
   ADR-036; D5 defers report translation and cites ADR-001 as
   supporting rationale only, never as a reversal).
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
  Owner column when they cite ADR numbers (§14.6).
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
|-- validators/
|   |-- validation.js               # validate() harness: validationResult + req.validated (§29)
|   `-- <domain>.validator.js       # express-validator rule chains, one per domain (§29, §30–§39)
|-- models/
|   `-- <entity>.model.js           # one schema file per entity, session-aware (§19–§24)
|-- services/                       # provider & pipeline work: STT, generation, correction,
|                                   # chat, exports, analytics, search — contents §33–§39
|-- jobs/
|   `-- sweeper                     # single in-process timer, two passes (§12.5, §62)
|-- mock/                           # seed and wipe scripts, session-safe (§40, ADR-037)
`-- uploads/
    |-- audio/                      (runtime; gitignored; created by multer — §32)
    `-- avatar/                     (runtime; gitignored; profile pictures — §19.2, §57)
```

The layer hierarchy follows §12.5 top to bottom: middleware chain →
mount registry/route modules → validators → controllers → services
(provider and
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
- `validators/` — declarative express-validator rule chains, one per
  domain; pure rules with no DB/HTTP/service access and no business
  logic; the shared `validation.js` harness runs `validationResult`
  and attaches `req.validated` for controllers (§29).
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
  documented helper package is approved — as a conditional planned
  dependency under §13.5 with the transport rules of this section
  remaining in force (§16.4).
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
  "chat_template_kwargs": {
    "thinking": true,
    "reasoning_effort": "<translated reasoning>"
  }
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
| Report — Audio | 1 — N clips | `{ report, visitId }` on Audio (exact keys) | BR-01/BR-02, §22 |
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

**Visit–audio–transcription binding (source side).** Each Audio row
carries `{ report, visitId }`, written once at upload: `report`
joins the report, `visitId` is the **exact key** of the visit this
clip belongs to (`visits[].visitId`, §21.2). A visit's source resolves
by exact-key query — `Audio.where({ report, visitId })`, then each
clip's 1:1 transcription ref (§33) — never by array position, clip
count, or ordering assumption. This is the future §22 contract: the
binding has a single write site; the report row keeps no audio or
transcription field; re-transcription replaces transcription rows
while keying stays stable; removing a visit (§35) detaches or cascades
its clips' documents in the same write session (§17.4, §18.5).

### 17.4 Cascade, lifecycle & integrity map

- **Hard delete** happens only via the service layer, inside
  sessions/transactions (§18): report delete cascades its
  audio documents, transcriptions, and conversations;
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
  (`restore`); the retention-window anchor is declared per owning
  model — for Branch (§20) `archivedAt` is the single anchor and no
  `deletedAt` marker exists; permanent
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
| `transcribed` | report + audio rows + transcription(s) with `raw` (and `latest`, both initialized equal); per-visit source resolved via the exact-key edges (`audio.{ report, visitId }` → 1:1 transcription, §17.3) — the presence check is the query, never a stored ref on the row |
| `reviewed` | transcription content locked by the review decision (accept/revert, BR-11) |
| `completed` | accepted content fixed at accept (BR-08, BR-11); report exported (§37) — the export is a deliverable, never a persisted artifact on any row (§21.5, §37/§58) |

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

---

## Part B — Data & Persistence (PDS)

## 18. Data Model Conventions (timestamps, transforms, indexes, TTL, sessions)

### 18.1 Purpose & scope

§18 is the shared convention skeleton of Part B (data structures,
§18–§25). It defines the Mongoose conventions every one of the six
models must obey — schema fundamentals, indexes and TTL declarations,
transforms, the model-side session contract, hooks, validation and
seed discipline, and schema evolution — exactly the
timestamps/transforms/indexes/TTL/sessions home promised by §12.9,
§15.6, and §17.1. Field-level schemas are never authored here.

- **Owned here (normative).** The universal schema options (§18.2);
  index and key policy, including the two TTL declarations (§18.3);
  toJSON/read conventions (§18.4); the model-side session contract
  (ADR-018, §18.5); hook rules (§18.6); the shared shape conventions
  (ownership `user`, snapshot, `raw`/`latest`, status, message
  metadata — §18.7); validation/seed discipline (§18.8); and schema
  evolution rules (§18.9).
- **Owned elsewhere — deliberately not repeated here.** Field-level
  schemas, per-model indexes, hooks, and transforms of each entity
  are authored by their model sections: User §19,
  Branch §20, Report §21, Audio §22, Transcription §23,
  ChatConversation §24. Status transitions and guards = §30–§31
  (invariants mirrored in §17.6). Field validators per domain = §29.
  Seeding and mock content = §25, §40. Retention arithmetic, the
  sweeper, and orphan sweep = §31, §62. Constants = §11. Storage and
  retention overview = §12.9. Cascade map/ERD view = §17.
- **Explicitly out of scope §18.** No endpoint or route design
  (§30–§39), no status-transition rule (§30–§31), no seed data, no
  timestamp arithmetic, no new constant (§11 unchanged), no new
  package (the mongoose family is manifest truth in §13.3 and follows
  the §13.7 dependency protocol), and no mock literals inside models.

### 18.2 Schema fundamentals (universal options)

- **`timestamps: true` on every collection.** Mongoose-managed
  `createdAt` and `updatedAt`, stored as UTC Dates. No second
  timestamp field per collection; display/local rendering (Ethiopian
  `DD-MM-YY` in domain data, §7.6) happens at the boundary, never in
  the schema.
- **Primary key.** `_id` is the only key field of every document;
  code never uses `id` (`report._id`, never `report.id`) per
  §12.11-3. No derived or surrogate keys are introduced.
- **Strict mode.** Mongoose `strict` (default) is retained for every
  schema — fields not listed in the schema are rejected, never
  silently persisted.
- **Virtuals.** A model section may declare virtuals (the User's
  `fullName`, §19.4); a virtual is a computed getter over the schema's
  own fields — never persisted, never indexed (§18.3), never
  queryable. `toJSON` and `toObject` run with `virtuals: true` so
  declared virtuals serialize alongside real fields; each model's
  transform still strips `id` and `__v` (§18.4, §19.5).
- **Names.** Field names are camelCase; collection names are the
  pluralized model name (Mongoose default); a collection name that
  collides with a MongoDB reserved name is never used.
- **Types.** All date/datetime fields are `Date` (UTC); all id
  references are `ObjectId` (see the edge keys of §17.3); enum-valued
  fields are restricted to the shared constants of §11 —
  `REPORT_STATUSES` (§11.4) — never literals (§11 freeze rule,
  §17.7 gates).

### 18.3 Indexes, keys & TTL declarations

- **Policy.** No schema field combines `unique: true` with a separate
  index; every compound, sparse, or TTL index is declared with
  `schema.index(..)` — the owning model section names its indexes,
  this section sets the rules and the TTL declarations.
- **Routing keys.** Every schema indexes `user` (ownership lookup,
  §3.2.3/BR-13) and the sort/query paths its owning section proves
  (§19–§24). `mongoose-paginate-v2` list queries (page 1, limit 10,
  max 100, §12.2) rely on indexes declared per owning model.
- **Uniqueness.** Declared only where the owning section proves it
  (e.g. the auth domain in §28 owns the email uniqueness decision);
  §18 does not pre-declare which fields are unique.
- **TTL declarations (the MongoDB-internal safety net).** Exactly two
  indexes are declared here, one per lifecycle:
  - **Report** (§21): TTL index on `archivedAt` with
    `expireAfterSeconds` = `ARCHIVED_TTL_SECONDS` (§11.3).
  - **Branch** (§20): TTL index on `archivedAt` with
    `expireAfterSeconds` = `ARCHIVED_TTL_SECONDS` (§11.3).
  Semantics belong to §17.4/§62 and BR-15, restated here only as
  contract: the index fires only when the sweeper missed a deadline;
  TTL deletion runs server-side, cannot cascade dependents, and
  cannot use a session — the single documented exception to
  transactional deletion (§12.2, §62); the orphan sweep cleans rows
  the TTL left behind; when both mechanisms race, the sweeper wins
  (§62). No other collection declares a TTL index; no index exists on
  `deletedAt` — the 30-day countdown from `deletedAt` (BR-15) is
  sweeper logic (§62), never an index.

### 18.4 Transforms & read conventions

- **Ownership of output.** Each schema owns a deterministic `toJSON`
  transform; `_id` stays `_id` (§12.11-3); fields are never renamed
  in transforms.
- **Leaks are forbidden.** Credential- and secret-bearing fields
  (auth secrets, tokens, provider keys) are excluded from output —
  the fields are marked `select: false` by the sections that own
  them (§28, §36); the envelope and DTOs consume only the transform
  output (§27, §42), never raw documents.
- **Read paths.** Read-only endpoints (get/list, §12.2) query with
  `.lean({ virtuals: true })` — declared virtuals (e.g. the User's
  `fullName`, §19.4) reproduce on plain projections — return plain
  objects through the same transforms, and never open sessions
  (§12.2, §18.5).
- **No mutation.** A transform never mutates the stored document;
  transient projection joins (e.g. branch snapshot name, §17.4) are
  read-side only.

### 18.5 Sessions & transactions (model-side contract)

- **Canonical write pattern.** Every write flow that spans more than
  one document runs in one MongoDB session and transaction:
  `startSession → startTransaction → writes → commitTransaction →
  catch → abortTransaction → finally → endSession` (ADR-018, §12.2,
  §27; the §17.4 cascades are the prime users and also conform to
  §62).
- **Model-side rule.** Mongoose hooks, instance methods, and static
  methods that write must accept a `{ session }` option and join the
  caller's transaction; they never open an implicit/hidden session,
  and they never run outside the transaction the controller (§27)
  creates for the write path.
- **Read endpoints.** get/list endpoints do not use transactions and
  do not require session support (§12.2).
- **Seed/mock writes.** Injection and wipe of mock data (§25, §40)
  support sessions so test setups commit atomically like any write.
- **Hooks must be awaitable.** All async middleware/hooks return a
  Promise (`@returns {Promise<void>}`) so transaction boundaries are
  never broken by fire-and-forget logic.

### 18.6 Hooks & middleware rules

- **No business logic in hooks.** Hooks validate shape and maintain
  mechanical invariants only (timestamps are automatic; unique-key
  conflicts are surfaced as errors), and must be assignable to the own
  model. Business state machines, notifications, analytics, and
  cascades live in the services (§30–§39, §62) and validators (§29),
  never in Mongoose middleware.
- **Session-aware.** All hooks that write accept `{ session }`
  (§18.5).
- **Async contract.** An async hook returns a Promise and awaits its
  DB calls (see §18.5); synchronous hooks contain no I/O.
- **Safety.** No hook performs filesystem work (audio binaries are
  out-of-DB, §12.9/§32), no hook writes logs (logging lives in §26),
  and no hook deletes dependents — deletions cascade in the service
  transaction (§17.4, §31).

### 18.7 Common shapes (the six-models contract)

- **Ownership.** Every collection except the User root (§19)
  carries a required `user` (`ObjectId`) — the single owner
  reference per BR-13/§3.2.3; the User document itself is the
  ownership root and carries no self-referential `user` field (its
  `_id` is the key every other row points at, §17.2); all
  user-scoped queries resolve the owner server-side; nothing is
  shared between users (except via the §17.4 tombstone rule).
- **Branch reference shape.** Wherever a model references branches it
  does so with the snapshot shape `branches[].{ branch, name }`:
  `branch` is the live `ObjectId` join key and `name` the immutable
  display snapshot copied at report creation (§3.2.3, BR-14). Reads
  through a deleted branch render the snapshot `name` and never treat
  the missing document as an error (§17.4).
- **Content shape (`raw`/`latest`, BR-11).** On every model that
  carries content, the content is stored in exactly two slots:
  `raw` (the original first-state content, written once and never
  touched) and `latest` (the single current content slot that every
  edit, correction, and acceptance update — §8.5.2, §35; no version
  chain exists, ADR-005 retired). The pattern is used by the
  Transcription model (§23) and the Report model (§21) per F5.
- **Status shape.** Report status is stored from `REPORT_STATUSES`
  (§11.4) — the constant value, never a literal string (§17.7 gates);
  the state machine itself is exclusively §30–§31.
- **Message metadata shape.** Every AI chat message sub-document
  carries `{ provider, model, reasoning }` matching §16.2 — persisted
  in ChatConversation (§24), whose message docs are child documents
  not separate collections (§17.2), re-merged in chronological order
  (BR-07, §6.4).

### 18.8 Validation & seed discipline

- **Schema-level validation is shape-only.** Mongoose validates
  types, requiredness, enum membership (against §11 constants), and
  reference `ObjectId` shape. Domain rules (business logic, form-wins
  capture rules of §6, transition guards) are enforced by §29
  validators and the services; a schema never rejects a value that
  §6/§31 allows.
- **No constants inside schemas.** Models reference the frozen §11
  constants (state strings, TTL windows, limits); literal values
  never appear in schema files (§11.4, §17.7 gates).
- **No seeds in models.** Mock data, development branches, or sample
  reports are never hard-coded into models — seeding and mock
  content are exclusively the §25/§40 mechanisms, and their writes
  are session-aware (§18.5). A report's creation data always comes
  from the user flow (§6, §52), never from defaults.

### 18.9 Schema evolution

- **Ownership of change.** Each of §19–§24 owns its schema; a change
  is made in its owning section, never collaterally in another
  section.
- **Additive only in-flight.** Schema changes on shipped surfaces
  are additive (new optional fields, new indexes), and any change
  touching a declared index, TTL, or shape contract of this section
  amends §18 text first and the register as per §14.5 (decision row
  and owner text move together).
- **No destructive in-place edits.** Renames, type changes, or
  destructive schema edits are not expressed as frozen migrations; a
  broken-shape environment is cleared and re-seeded through the
  §25/§40 wipe mechanism in development (§12.10), and production data
  never carries silent transforms (see §18.4).

### 18.10 Verification usage

- Grep gates: `REPORT_STATUSES` and `ARCHIVED_TTL_SECONDS` resolve to
  §11.4/§11.3 — never literals; the only TTL declarations in the spec
  are the two named in §18.3 (Report §21, Branch §20), and neither
  sits on `deletedAt`; the snapshot shape everywhere is
  `branches[].{ branch, name }`; content slots are exactly `raw` +
  `latest`; message metadata is exactly `{ provider, model,
  reasoning }` (§16.2); the six entities of §17.2 are the only
  entities.
- Cross-section checks: §18 asserts no fieldset, no endpoint, no
  transition, and no retention arithmetic — the models own fields
  (§19–§24), §30–§31 own transitions, §62 and §25/§40 own retention
  and seeds; session/transaction mechanics mirror §12.2 and
  ADR-018; TTL semantics mirror §17.4 exactly; no new article
  (constants §11, paths §15.4) is introduced.
- §18 introduces no signature, no package (§13.3 manifest unchanged),
  and no constant; it is standalone — it references only
  specification sections.

---

## 19. User Model

### 19.1 Purpose & scope

§19 is the model section for the User — the single actor of the
product (Area Supervisor, §3; no roles, ADR-036). It owns the User
document definition: the field set, keys and indexes, the
password-hashing hook, the instance/static methods used by the auth
flows, and the serialization exposure of the profile. It renders the
§17.2 User row ("user-scoped, key `_id`, single actor") as a schema
contract and follows the §18 conventions exactly like every model.

- **Owned here (normative).** Field registry and the derived-name
  rule (§19.2); keys and indexes (§19.3); hooks and methods (§19.4);
  transforms and exposure (§19.5); seed and mock position (§19.6);
  evolution (§19.7).
- **Owned elsewhere — deliberately not repeated here.** Registration,
  login/logout, the two JWT cookies, refresh rotation, and the
  Google OAuth **stub** (ADR-024; the real-vs-stub question stays
  open in §69) = §28; field validation rules = §29; the Profile page
  = §57; persona and single-user-type scope = §3 (ADR-036 row in
  §14.3); the auth lookup middleware that attaches `req.user` =
  §28 (`req.user._id.toString()` everywhere, §12.11-3).
- **Explicitly out of scope §19.** No endpoint, no token or cookie
  mechanics, no validation-error rules of its own, no seed users, no
  new constant — the salt-rounds constant is `BCRYPT_SALT_ROUNDS`
  (§11.3, owned by §28) — and no new package: the model uses
  `bcryptjs` (^3.0.3 in the §13.3 manifest) and nothing else.

### 19.2 Field registry & derived-name rule

| Field | Type | Required | Rule |
|---|---|---|---|
| `_id` | ObjectId | auto | the only key; never `id` (§12.11-3) |
| `email` | String | yes | unique (index §19.3); stored lowercase — normalized by the §29 validators (`normalizeEmail({ gmail_remove_dots: false })`), never composed in the schema |
| `password` | String | no | bcrypt hash only; `select: false`; present only for email-created accounts — Google-created accounts have no password (F1) |
| `firstName` | String | yes | set at creation from the derivation rule below; never collected on the register form (F1) |
| `lastName` | String | yes | same as `firstName` |
| `avatar` | String | no | optional profile picture — set later on the Profile page (§57) or provided by Google sign-in (F1); the picture is an uploaded file stored under `backend/uploads/avatar/` (gitignored, same binary discipline as `backend/uploads/audio/`, §12.9/§32) |
| `position` | String | no | optional profile data — the workplace position/title of the user (e.g. Area Supervisor); free string, display-only, never a permission or role (ADR-036); Profile page only (F1) |
| `createdAt` / `updatedAt` | Date | auto | §18.2 timestamps |

Derived-name rule (F1, §3.2.1): at creation the account's names are
extracted from the email local part (the part before `@`); §19 stores
the result, the §28 creation flow executes the extraction:

| Email local part | `firstName` | `lastName` |
|---|---|---|
| `beza` | `beza` | `beza` |
| `beza.ayalew` | `beza` | `ayalew` |

### 19.3 Keys, indexes & lifecycle

- **Unique email.** Declared with `schema.index({ email: 1 },
  { unique: true })` per §18.3 — no field-level `unique: true`
  combined with a separate index (the §18.3 rule). The uniqueness
  is proven by the auth domain (§28, §12.7) and declared here.
- **Auth read paths.** The lookups the auth flow uses are `_id`
  (the §28 `authenticate` lookup) and `email` (login and
  registration match) — indexes serve exactly those; nothing is
  indexed without proof (§18.3).
- **No lifecycle fields.** User declares no `isArchived`,
  `archivedAt`, or `deletedAt` and no TTL index — the only TTL
  declarations in the spec are the two of §18.3 (Report §21, Branch
  §20), and the retention rules (BR-15/BR-16, §62) never apply to a
  user row.

### 19.4 Hooks, methods & session contract

- **Hashing hook.** A `pre('save')` hook hashes `password` with
  `bcryptjs` at `BCRYPT_SALT_ROUNDS` (§11.3 — the section never
  writes the literal `12`, §17.7 gates). The hash runs only when the
  field is new or modified; an unchanged hash is never rehashed; a
  document without a password (Google-created account, F1) never
  enters the hashing branch.
- **`comparePassword(candidate)`.** Instance method using
  `bcrypt.compare`; returns a boolean. Plaintext passwords are never
  stored, compared, logged (§26), or returned; a document with no
  password returns `false`.
- **The one hash lookup.** The only query that loads the hash is the
  authentication lookup consumed by §28 (`select('+password')`).
  All other reads use `.lean()` and never select the field (§18.4).
- **`fullName` virtual.** `schema.virtual('fullName').get(...)`
  composes the two derived names as a single space-joined string
  (`${firstName} ${lastName}`); a pure getter over own fields — never
  persisted, never indexed (§18.3), never queried, and reproducible on
  lean reads (§18.4). Both source fields are required (§19.2), so the
  getter is total: it can never yield an empty or partial name.
- **Session contract (§18.5, ADR-018).** Write statics (creation,
  Google auto-creation) accept a `{ session }` option and run inside
  the caller's transaction; read-only lookups use `.lean()` and no
  session (§12.2).

### 19.5 Transforms & exposure

- **`toObject`/`toJSON` deletion contract.** Both transforms **delete
  the derived `id` virtual** and **the `__v` version key** from every
  serialized User — a serialized document carries `_id` and the stored
  fields (the never-bare-`id` rule of §12.11-3) and no Mongoose
  bookkeeping field.
- **`fullName` serializes.** With virtuals enabled (§18.2) the
  `fullName` virtual (§19.4) appears in every serialized User next to
  the stored fields; the transforms strip only `id` and `__v` —
  `fullName` is never stripped.
  The `versionKey` default of the schema is never relied on in
  output.
- **Secrets never serialize (§18.4).** `password` is `select: false`
  and excluded from every transform; no serialized profile contains
  the hash or any token-like value.
- **No mutation (§18.4).** Transforms never write back to the
  stored document and never rename fields.
- **One consumer path.** The response layer (§27 envelope/DTOs) and
  the Profile view (§57) consume the transform output only; no code
  path serializes a raw User document (§18.4).

### 19.6 Seeds & mocks

- The model contains no seed users, demo accounts, or development
  rows (§18.8); mock users are injected and wiped exclusively by the
  §25/§40 mechanisms, whose writes support sessions (§18.5).

### 19.7 Evolution

- A new User field (or a change to §19.2–§19.5 text) is made here
  first, per the §18.9 evolution rules.
- If the auth domain (§28) proves a stored token/rotation field, §28
  authors the proof and §19 is amended in the same change — through
  the §14.5 protocol whenever a register row is involved.

### 19.8 Verification usage

- Grep gates: `BCRYPT_SALT_ROUNDS` resolves to §11.3 — the literal
  `12` appears nowhere in §19; the only unique declaration is the
  email index of §19.3; the field set of §19.2 matches the F1
  contract exactly (no invented fields); `id` and `__v` are deleted
  in §19.5; `fullName` is declared once (§19.4) as a virtual — the
  §19.2 registry stores no `fullName` field; the User root carries no
  `user` field (§18.7, §17.2).
- Cross-section checks: §19 asserts no endpoint (§30–§39 own them
  never here), no transition rule (§30–§31), no token/cookie
  mechanics (§28), no validation-error rules (§29), no constant
  (§11/§28); hooks obey §18.6, transforms obey §18.4, sessions obey
  §18.5, uniqueness obeys §18.3.
- §19 introduces no constant, no package (§13.3 manifest unchanged —
  nothing to install); the only path it introduces is
  `backend/uploads/avatar/` (§15.4, profile pictures, §57); it is
  standalone — it references only specification sections.

---

## 20. Branch Model

### 20.1 Purpose & scope

§20 is the model section for the Branch — the place the supervisor
operates in (more than 14 branches, §3). It renders the §17.2 Branch
row ("user-scoped, key `_id`, created and owned by the registering
user; two-path lifecycle (BR-14, BR-16)") as a schema contract: the
field set, keys and the TTL declaration, the lifecycle fields and
document states, the snapshot source, and the transforms. It follows
the §18 conventions exactly like §19.

- **Owned here (normative).** Field registry (§20.2); keys, indexes
  and TTL (§20.3); lifecycle fields and document states (§20.4);
  snapshot and tombstone contract (§20.5); hooks and session contract
  (§20.6); transforms and exposure (§20.7); seeds and mocks (§20.8);
  evolution (§20.9).
- **Owned elsewhere — deliberately not repeated here.** Endpoint
  guards and the archive/restore controllers = §30 (F2's owner trio
  §20, §30, §62); retention windows and the sweeper = §62; the
  `branches[]` document fieldset on reports = §21; capture digest and
  branch header lines (Type-1 `branch: x`, Type-2 `x / y / z`) =
  §6.11/§21; pickers, Reports UI, and global search behavior = §54,
  §39, §56; the ownership guard = §3.2.3/BR-13.
- **Explicitly out of scope §20.** No endpoint, no transition or
  guard rule (§30–§31 own them), no retention arithmetic (§62), no
  new constant (§11 unchanged), no new package — the model layer is
  `mongoose` (^9.7.4 in the §13.3 manifest, nothing to install),
  and no seeds (§25/§40 own mocks).

### 20.2 Field registry

| Field | Type | Required | Rule |
|---|---|---|---|
| `_id` | ObjectId | auto | the only key; never `id` (§12.11-3) |
| `user` | ObjectId | yes | creator-owner — branches are created and owned by the registering user (BR-13, §3.2.3); the key of the ERD User — Branch edge (§17.3) |
| `name` | String | yes | free-form, Amharic-capable display identity; the single source of the snapshot `name`, of the report headers and visits digest (§6.11), and of pickers, Reports UI, and global search (F2); no format or encoding constraint |
| `location` | String | yes | free string — the name of the place where the branch exists; display/management only; never snapshotted into reports (§20.5) |
| `isArchived` | Boolean | yes (default `false`) | lifecycle flag; archived rows are hidden from default reads and appear only under explicit filters (F2, §17.4) |
| `archivedAt` | Date | no (null while active) | set when the branch is archived (the deletion-decision timestamp); cleared on restore; the retention-window anchor and the TTL index target (§20.3, §20.4) |
| `createdAt` / `updatedAt` | Date | auto | §18.2 timestamps |

No `deletedAt` exists by design: the archive timestamp is the single
retention anchor, so the "from `deletedAt` where applicable" clause of
BR-15 does not apply to Branch (the anchor is declared per owning
model, §17.4). No index carries uniqueness — nothing in the product
proves unique branch names per owner, so none is declared (§18.3).
No other field exists: no code, city, address, or region — nothing
outside this table is persisted.

### 20.3 Keys, indexes & TTL

- **Owner-scoped list index.** `schema.index({ user: 1, isArchived: 1,
  name: 1 })` serves the F2 read paths — branches listed active-only
  by default (`isArchived: false`), archived rows on explicit
  filter, ordered by `name`, always scoped to the owner (`user`,
  BR-13). Declared via `schema.index(..)` per §18.3; no field-level
  `unique: true` combined with a separate index (none is unique
  here).
- **TTL declaration.** Exactly the §18.3 declaration applies: an
  index on `archivedAt` with `expireAfterSeconds` =
  `ARCHIVED_TTL_SECONDS` (§11.3) as the MongoDB-internal safety net —
  the sweeper wins races, TTL runs server-side without cascade or
  session (§12.2, §62), and no other TTL index exists on the model.
- **No further indexes.** The join direction lives on the Report side
  (`branches[].branch`, §21); Branch lookups are owner-scoped (§30)
  through the composite above; nothing else is indexed without proof
  (§18.3).

### 20.4 Lifecycle fields & document states

The branch document has exactly three states; there is no
"deleted-but-timed" state and no user-triggered hard delete:

| State | `isArchived` | `archivedAt` | Behavior |
|---|---|---|---|
| active | `false` | `null` | the default for every read — pickers, Reports UI, global search (F2); create and update happen here (§30) |
| archived (prepare-to-delete) | `true` | set at archive | hidden from default reads (F2); the 30-day window (`ARCHIVED_TTL_SECONDS`, §11.3) opens the moment the branch is archived; **restore** is possible inside the window and only from this state — it sets `isArchived: false` and clears `archivedAt` (§17.4, §30) |
| permanently removed | — | — | window end: the row is physically removed by the sweeper (§62, BR-15) or, if the app missed the deadline, by the TTL safety net (§18.3); no document remains — only tombstone reads (§20.5) |

- Archive never breaks report history — the snapshot survives
  (BR-14, §17.4).
- No controller may hard-delete an archived row before the window:
  BR-15 ("no other path may hard-delete user data once archived");
  §30 implements the guard, §62 implements the window.
- §20 declares the fields and their values; the transitions and
  guards are exclusively §30–§31.

### 20.5 Snapshot & tombstone contract

- **The only Branch → Report coupling** is the embedded snapshot
  `branches[].{ branch, name }` (ERD §17.3): `branch` is the live
  `ObjectId` join key and `name` is the display string copied at
  report creation from this model's `name` (§3.2.3, BR-14).
- **Never rewritten.** Branch rename, archive, or delete never
  cascades into reports — there is no cascade Branch → Report
  (§17.4); renames affect only snapshots captured afterwards.
- **Tombstone rule.** After permanent removal, a `branch` lookup
  returns `null`; every report read path (list, detail, export,
  analytics, chat) renders the snapshot `name` and never treats the
  missing document as an error state (§17.4, §17.7).
- `location` never joins a snapshot or digest — it is the
  management/display surface only.

### 20.6 Hooks & session contract

- **No business-logic hooks (§18.6).** The schema holds no middleware
  that archives, restores, deletes, or cascades; hooks, where any
  exist, are mechanical only (timestamps are automatic).
- **Write contract (§18.5, ADR-018).** Archive and restore are
  endpoint flows (§30) running inside a session transaction
  (`startSession → startTransaction → writes → commit/abort →
  finally endSession`); write statics accept a `{ session }` option.
- **Read contract (§12.2).** Picker and search feeds load with
  `.lean()` and no session; the active-only filter is part of the
  query — the archive-state filter is never applied in a hook.

### 20.7 Transforms & exposure

- **`toObject`/`toJSON` deletion contract.** Both transforms delete
  the derived `id` virtual and the `__v` version key from every
  serialized Branch (uniform with §19.5) — a serialized document
  carries `_id` and the stored fields (§12.11-3) and no Mongoose
  bookkeeping.
- **No mutation (§18.4).** Transforms never write back to the stored
  document and never rename fields.
- **No secrets exist** on this model; the decision of which lifecycle
  fields appear in API responses (for example `archivedAt` for an
  "archived since" label) stays with the §27/§30 DTOs.

### 20.8 Seeds & mocks

- The model contains no seed branches, demo branches, or default
  rows (§18.8); mock branches arrive exclusively through the §25/§40
  injection and wipe mechanisms, whose writes support sessions
  (§18.5). Real branches always originate from the user's
  management flows (§30, F2).

### 20.9 Evolution

- Field or lifecycle changes are authored here first (§18.9);
  a change that touches a §14.3 register decision (BR-14, BR-15)
  or the §18.3 TTL declaration follows the §14.5 protocol — register
  row and owning text move together.
- New fields are additive; the snapshot shape
  `branches[].{ branch, name }` is never extended without §21/§6.11
  coordination, because report history depends on it (BR-14).

### 20.10 Verification usage

- Grep gates: `isArchived`/`archivedAt` appear as the lifecycle pair
  of §20 with **no `deletedAt`** anywhere in the section;
  `ARCHIVED_TTL_SECONDS` resolves to §11.3 — the literal `2592000`
  never appears; the snapshot shape everywhere is
  `branches[].{ branch, name }`; the field set of §20.2 equals the
  F2 branch contract — no invented fields (`code`, `city`, `address`
  never appear); no `user`-less read is described.
- Cross-section checks: §20 asserts no endpoint (§30–§39 own them),
  no transition or guard (§30–§31), no window arithmetic (§62), no
  digest or header composition (§6.11/§21); it mirrors §18
  (indexes §18.3, transforms §18.4, hooks §18.6, sessions §18.5,
  validation §18.8, evolution §18.9) and §17.2/§17.4 exactly.
- §20 introduces no constant, no path (§15.4 unchanged — `uploads/`
  and the git boundaries of line 6 already cover binaries), and no
  package (§13.3 manifest unchanged — nothing to install); it is
  standalone — it references only specification sections.

---

## 21. Report Model

### 21.1 Purpose & scope

§21 is the model section for the Report — the daily supervision report
of the single actor (§3), the core deliverable of the product. It
renders the §17.2 Report row ("user-scoped, key `_id` and the report
date field; five-status machine (`REPORT_STATUSES`, §11.4; BR-06)")
as a schema contract: the field set (including the capture metadata
stored at capture time, §6.1), the keys and the TTL declaration, the
status and presence contract, the acceptance model, the lifecycle
fields, the snapshot and tombstone consumption, the capture-visits
contract, and the transforms. It follows the §18 conventions exactly
like §19 and §20.

- **Owned here (normative).** Field registry and report identity
  (§21.2); keys, indexes and TTL (§21.3); status and content
  presence (§21.4); the acceptance and single-undo contract (§21.5);
  lifecycle fields and document states (§21.6); capture metadata,
  visits and tombstone contract (§21.7); hooks and session contract
  (§21.8); transforms and exposure (§21.9); seeds and mocks (§21.10);
  evolution (§21.11).
- **Owned elsewhere — deliberately not repeated here.** Status
  transitions and their guards, the archive/restore/delete flows,
  and the report delete cascade = §31; the capture & attribution
  contract (per-visit recording tabs, the attribution priority
  chain, the per-branch content status vocabulary, the branch digest
  used by filtering, the unassigned-accept gate) = §6.10/§6.11
  (reserved anchors, §6.9); audio documents, upload and removal
  material and bindings = §22/§32; transcription rows = §23; chat
  conversations = §24/§36; content generation and correction writes
  to the content slots = §34/§35; export fidelity = §37/§58; the
  sweeper and windows = §62; field validators = §29; wizard steps
  and Reports UI = §52, §50–§54; search = §39; analytics = §56; the
  ownership guard = §3.2.3/BR-13; the retention constants = §11.
- **Explicitly out of scope §21.** No endpoint, no transition or
  guard rule (§30–§31 own them), no retention arithmetic (§62), no
  digest or attribution artifact (§6.10/§6.11), no capture-contract
  rules (§6.10, §52), no new constant (§11 unchanged), no new package
  — the model layer is `mongoose` (^9.7.4 in the §13.3 manifest,
  nothing to install), and no seed data (§18.8, §25, §40).

### 21.2 Field registry & report identity

| Field | Type | Required | Rule |
|---|---|---|---|
| `_id` | ObjectId | auto | the only key; never `id` (§12.11-3) |
| `user` | ObjectId | yes | creator-owner — reports are private to the authenticated user (BR-13, §3.2.3); the key of the ERD User — Report edge (§17.3) |
| `reportDate` | Date | no (null while not captured) | the report date field of §17.2 — the `ቀን` metadata value (the form's report date, §6.3); captured at capture time, never derived from the system clock (BR-01, §6.1, §6.3); fallback from the reviewed transcription, missing stays blank, never invented (BR-19); stored as a UTC `Date` (§18.2) and displayed as Ethiopian `DD-MM-YY` at the boundary (§6.5, §7.6) |
| `supervisorName` | String | yes | the `ስም` header value — the user's `fullName` virtual (§19.4) captured into the capture form at capture time (§6.3 field 3); the captured value wins: a later profile rename never rewrites report history; generation prints this stored value |
| `status` | String | yes (default `draft`) | member of `REPORT_STATUSES` (§11.4, BR-06, §17.2); the value always comes from the constants file, never a literal (§17.7 gates); reports enter the machine at `draft` because the wizard is the only creation path (BR-05) |
| `branches` | Array | yes (default `[]`) | the relationship block — the §18.7 snapshot: each entry is `{ branch: ObjectId (ref Branch, required), name: String (required) }`, the live join key and the immutable display snapshot copied at capture time (§3.2.3, BR-14); drives pickers, branch filters, and tombstone rendering (§17.3, §17.4); Type-1 days hold one member, Type-2 hold several (BR-03, ADR-010); the shape is never extended without §21/§6.11 coordination (§20.9) |
| `visits` | Array | yes (default `[]`) | the capture block — each entry is `{ visitId: Number (required, sequential within the report), branchName: String (required), clockIn: String or null — OQ-002 open, clockOut: String or null — OQ-002 open }`; stored in chronological capture order (§6.4); Type-1 days hold one entry, Type-2 two or more (BR-03); a branch visited twice appears as two entries while the snapshot holds one member (§6.4); `branchName` copies the same `Branch.name` as the matching snapshot member, at the same capture moment, so equality holds by construction and the two blocks are never edited independently; time values follow the `HH:mm` zero-padded format of §6.5 (validated by the §29 validators, never composed in the schema) |
| `raw` | String | no (null until first generation) | the original generated content, written once at first generation and never rewritten (BR-11, §18.7); no version chain exists beside it (ADR-005 retired, §14.3) |
| `latest` | String | no (null until first generation) | the single current-content slot, initialized to `raw` at first generation; every edit, correction, and revert overwrites it (BR-11); accepted content is this slot fixed at accept (§21.5) |
| `isArchived` | Boolean | yes (default `false`) | lifecycle flag (BR-16, F4); archived rows are hidden from default reads and appear only under explicit filters (§17.4) |
| `archivedAt` | Date | no (null while active) | set when the report is archived; cleared on restore; the retention-window anchor and the TTL index target (§21.3, §21.6) |
| `createdAt` / `updatedAt` | Date | auto | §18.2 timestamps |

No `deletedAt` exists by design: the archive timestamp is the single
retention anchor, so the "from `deletedAt` where applicable" clause
of BR-15 does not apply to Report (the anchor is declared per owning
model, §17.4). The header line, the per-visit day start/exit values,
and the type (Type-1/Type-2) are derived deterministically from
`visits` per §6.4 — they are never stored as copies. No audio,
transcription, or conversation references exist on the report row:
the edges of §17.3 are served from the child side — each Audio row
carries `{ report, visitId }`, so a visit's clips and their
transcriptions resolve by exact-key query over the edges, never by
array position or implicit ordering (§17.3; future §22 contract); the
ChatConversation row carries the report ref (§24). No branch-digest or
per-item content field exists (that artifact belongs to §6.10/§6.11);
no `acceptedAt` and no `exportedAt` field exists — acceptance writes
no timestamp (§21.5) and export artifacts live outside the system of
record (§37/§58). No other field exists: nothing outside this table
is persisted.

**Open items (per the §69 open-question rule).**

- **OQ-007 (open, registered here — `TODO(open)`).** The storage
  format of `raw`/`latest` is open: plain text vs rich-text HTML.
  Sanitize-on-store and the HTML contract are owned by the editor
  phase — the ADR-038 owner sections (§46/§51/§54/§61) — and §21 does
  not pre-decide them; both slots stay plain `String` until that
  decision lands.
- **OQ-001 (closed by amendment, recorded here).** The version-history
  question was closed by the ADR-005 retirement amendment
  (2026-08-09, §14.3/§14.5): no version chain — the `raw`/`latest`
  single-undo model is the content model (BR-11).

### 21.3 Keys, indexes & TTL

- **Owner-scoped list index.** `schema.index({ user: 1, isArchived:
  1, reportDate: -1, createdAt: -1 })` serves the reports list read
  paths (Reports UI, §50–§54): active rows by default, archived rows
  on explicit filter, most recent working day first, always scoped to
  the owner (`user`, BR-13); reports without a `reportDate` yet
  resolve deterministically through the `createdAt` tiebreak.
  Declared via `schema.index(..)` per §18.3; no field-level
  `unique: true` combined with a separate index (nothing is unique
  here).
- **Branch-filter index.** `schema.index({ user: 1,
  'branches.branch': 1 })` serves the reports-of-a-branch lists —
  reports filtered by a live branch's snapshot reference (branch
  filters and pickers of §17.3, Reports UI §54); multikey on the
  embedded snapshot, owner-scoped.
- **TTL declaration.** Exactly the §18.3 declaration applies: an
  index on `archivedAt` with `expireAfterSeconds` =
  `ARCHIVED_TTL_SECONDS` (§11.3) as the MongoDB-internal safety net —
  the sweeper wins races, TTL runs server-side without cascade or
  session (§12.2, §62), and no other TTL index exists on the model.
- **No further indexes.** The join directions live on the child side
  (Audio, ChatConversation) and in the embedded snapshot above; the
  search strategy over report content and snapshot names is decided
  by §39, which will prove any text index it needs; nothing else is
  indexed without proof (§18.3).

### 21.4 Status & content presence contract

The five statuses are `REPORT_STATUSES` (BR-06, §11.4). The table
below is the mirror of the §17.6 presence map — it states which
artifacts exist at each status; the transitions and their guards live
exclusively in §30/§31, so this table is never the rule book:

| Status | Required persisted artifacts (mirror of §17.6) |
|---|---|
| `draft` | report row only (no audio required); capture metadata holds whatever the wizard captured so far (BR-05) |
| `audio_attached` | report + at least one `Audio` row |
| `transcribed` | report + audio rows + transcription(s) with `raw` (and `latest`, both initialized equal) |
| `reviewed` | transcription content locked by the review decision (accept/revert, BR-11) |
| `completed` | accepted content fixed at accept (BR-08, BR-11); report exported (§37) |

- `raw` and `latest` are both null until the first generation; the
  first generation writes both, initialized equal (BR-11, §18.7), and
  every later content operation updates only `latest` (§21.5).
- Content and capture edits never change this table (BR-11); the only
  status movement caused by material changes is the explicit
  last-audio rewind of §17.4 (ADR-003), declared in §31 — never
  restated as a transition here.
- An invariant across every status: the report's `user` equals the
  session owner and the §17.4/§17.6 artifacts are present — a row
  that violates the map is a data-integrity violation (§30).

### 21.5 Acceptance & single-undo contract

The acceptance model is owned here, per BR-08/BR-11 and §5.7:

- **Accept fixes `latest`.** Acceptance is the checkpoint that fixes
  `latest` as the accepted content (BR-08, §5.3, §12.4 stage 7); the
  transition to `completed` and its guards are §31's.
- **Acceptance writes no new field.** No content snapshot, no
  duplicate slot, no `acceptedAt` timestamp, and no capture-metadata
  rewrite exist — `latest` remains the single content slot after
  acceptance exactly as before (BR-11, ADR-005 retired).
- **Edits continue at `completed`.** BR-10 keeps generated content
  editable after acceptance: a Mode 1/2/3 correction overwrites the
  same `latest` slot; `raw` stays the original; the one-click revert
  copies `raw` into `latest` while they differ (single undo, §1.4).
- **Verification ends at accept.** Re-transcription is available
  until the report is accepted/completed (BR-12).
- **Exports reproduce the current content.** Export fidelity is the
  current `latest` (BR-18); the "report exported" reference of the
  §17.6 `completed` row materializes outside the six collections —
  a client-side file or the user's Google Drive document (§37, §58) —
  never as a row field.

### 21.6 Lifecycle fields & document states

The report document has exactly three states; there is no
"deleted-but-timed" state and no user-triggered hard delete (BR-16):

| State | `isArchived` | `archivedAt` | Behavior |
|---|---|---|---|
| active | `false` | `null` | the default for every read — pickers and Reports UI (F4); create, edit, and status flows happen here (§31, §52) |
| archived (prepare-to-delete) | `true` | set at archive | hidden from default reads (F4); the 30-day window (`ARCHIVED_TTL_SECONDS`, §11.3) opens the moment the report is archived; **restore** is possible inside the window and only from this state — it sets `isArchived: false` and clears `archivedAt` (§17.4, BR-16, §31) |
| permanently removed | — | — | window end: the row and its artifacts (audio documents, transcriptions, conversations — §17.4) are physically removed by the sweeper (§62, BR-15) or, if the app missed the deadline, by the TTL safety net (§18.3) |

- Archiving never breaks branch history — the snapshot and the
  capture names survive (BR-14, §17.4).
- No controller may hard-delete an archived row before the window:
  BR-15 ("no other path may hard-delete user data once archived");
  §31 implements the guard, §62 implements the window.
- §21 declares the fields and their values; the transitions and
  guards are exclusively §30–§31.

### 21.7 Capture metadata, visits & tombstone contract

- **Stored metadata.** The values the report header prints from —
  date, branch names, visit times, day start/exit — are captured and
  stored on this row at capture time (the capture form, §6.1); the
  reviewed transcription is the fallback when a capture value is
  missing, and a missing value stays blank, never invented (§6.1,
  BR-19). Of those values the row stores `reportDate`,
  `supervisorName`, and `visits`; the header line, the day start/end,
  and the type are derived from `visits` per the locked §6.4 rules
  (chronological visit-start order; Type-2 names joined with ` / `
  where a branch visited more than once is listed once in the header
  while its visits keep separate time-range lines; the day's exit
  equals the end of the last visit).
- **Two blocks, one source.** `branches` (the §18.7 relationship
  snapshot) and `visits` (the capture block) are written from the
  same `Branch.name` at the same capture moment — equality by
construction (data-consistent: the join key stays the live
   `ObjectId`, the display strings stay text, so tombstone reads and
   text matching both work). Any capture edit before generation
  (wizard flow, §52) and any correction that adds or removes a visit
  (§35) updates both blocks together inside the same write — the
  coupling is data-level here; the flows own execution, hooks never
  recompute either block (§21.8).
- **OQ-002 (open, registered here — `TODO(open)`).** Whether `clockIn`/`clockOut`
  are required per visit is an open question (§5.7, §69). It is not
  half-decided here: the schema declares both fields nullable, and
  the requiredness answer belongs to the capture contract
  (§6.10, §52), the validators (§29), and §69.
- **Tombstone rule.** After a referenced branch is permanently
  removed (sweeper or TTL index, `ARCHIVED_TTL_SECONDS`), the
  `branches[].branch` lookup returns `null`; every report read path
  (list, detail, export, analytics, chat) renders the snapshot `name`
  and the capture `branchName` text, and never treats the missing
  document as an error state (§17.4). A tombstone is never rewritten,
  never re-attached, and never an error; the orphan sweep never
  deletes a report because its branch is gone (§12.9, §62).

### 21.8 Hooks, methods & session contract

- **No business-logic hooks (§18.6).** The schema holds no middleware
  that computes status, derives header values, archives, restores,
  deletes, cascades, or edits the capture blocks; hooks, where any
  exist, are mechanical only (timestamps are automatic).
- **Write contract (§18.5, ADR-018).** Every write flow — wizard
  creation (§52/§31), content writes (§34/§35), accept (§31), archive
  and restore (§31), the report delete cascade (§17.4, §31) — runs
  inside a session transaction
  (`startSession → startTransaction → writes → commit/abort →
  finally endSession`); write statics accept a `{ session }` option.
- **Read contract (§12.2, §18.4).** List, detail, and export reads
  load with `.lean({ virtuals: true })` and no session; the
  active-by-default filter is part of the query — the archive-state
  filter is never applied in a hook.

### 21.9 Transforms & exposure

- **`toObject`/`toJSON` deletion contract.** Both transforms delete
  the derived `id` virtual and the `__v` version key from every
  serialized Report (uniform with §19.5/§20.7) — a serialized
  document carries `_id` and the stored fields (§12.11-3) and no
  Mongoose bookkeeping.
- **No mutation (§18.4).** Transforms never write back to the stored
  document and never rename fields; nothing is recomputed or
  re-derived inside a transform.
- **No secrets exist** on this model; which lifecycle and capture
  fields appear in API responses (for example `archivedAt` for an
  "archived since" label, or `visits` for the wizard's review step)
  stays with the §27/§31 DTOs.

### 21.10 Seeds & mocks

- The model contains no seed reports, demo reports, or default rows
  (§18.8); mock reports arrive exclusively through the §25/§40
  injection and wipe mechanisms, whose writes support sessions
  (§18.5). A report's creation data always comes from the wizard
  flow (BR-05, §52), never from defaults.

### 21.11 Evolution

- Field, capture, or content changes are authored here first (§18.9);
  a change that touches a §14.3 register decision (ADR-003,
  ADR-005, ADR-010, BR-15/BR-16) or the §18.3 TTL declaration
  follows the §14.5 protocol — register row and owning text move
  together.
- New fields are additive; the snapshot shape
  `branches[].{ branch, name }` and the capture `visits` shape are
  never extended without §21/§6.11 coordination, because report
  history and the capture contract depend on them (§20.9, §18.7).

### 21.12 Verification usage

- Grep gates: `status` values always resolve to `REPORT_STATUSES`
  (§11.4) — no literal status strings anywhere in §21;
  `ARCHIVED_TTL_SECONDS` resolves to §11.3 — the literal `2592000`
  never appears; `isArchived`/`archivedAt` appear as the lifecycle
  pair with **no `deletedAt`** anywhere in the section; the snapshot
  shape everywhere is `branches[].{ branch, name }`; the content
  slots are exactly `raw` + `latest` (null until first generation);
  `clockIn`/`clockOut` appear only in the `visits` block under the
  OQ-002-open rule; no per-item content vocabulary, no attribution
  basis, no rating, no unassigned-items structure, and no branch
  digest appear here (that contract is §6.10/§6.11, reserved
  anchors — §6.9); the stored capture fields are exactly
  `reportDate`, `supervisorName`, and `visits` — `headerBranch`,
  `dayClockIn`, `dayClockOut`, and `type` never appear as fields
  (§6.4 derivation); no `acceptedAt`/`exportedAt`; no version
  wording; no §6.8 sample branch or person names; the field set
  matches §17.2, F3–F5, G4–G5, and §6.1/§6.3 — no invented fields.
- Cross-section checks: §21 asserts no endpoint (§30–§39 own them),
  no transition or guard (§30–§31), no window arithmetic (§62), no
  capture-contract rule (§6.10/§52), no digest composition (§6.11),
  no audio/upload material (§22/§32), no conversation material (§24),
  no export mechanics (§37/§58); it mirrors §18 (indexes §18.3,
  transforms §18.4, hooks §18.6, sessions §18.5, validation §18.8,
  evolution §18.9) and §17.2/§17.4/§17.6 exactly.
- §21 introduces no constant, no path (§15.4 unchanged),
  and no package (§13.3 manifest unchanged — nothing to install);
  it is standalone — it references only specification sections.

---

## 22. Audio Model

### 22.1 Purpose & scope

This section authors the Audio row — the metadata-only document that
represents one recorded audio clip (the binary itself lives on the
backend local filesystem, §12.9). The section owns the Audio schema,
its keys and indexes, its lifecycle fields, and the binary/metadata
contract. It does **not** own: upload mechanics, multer usage, and
temp-cleanup execution (§32); chunking, ffmpeg/WAV preparation, and
the STT call sequence (§33); cascade execution and status transitions
(§31); request validation and error shaping (§29, §27); provider
contracts (§16); or the captured-visits contract (§6.10, §52).

Audio rows are user-scoped (BR-13, §3.2.3): every row binds to the
authenticated, server-assigned user (`req.user._id.toString()`,
§17.2). The row is the **child-side join key holder** of the
Report—Audio edge (§17.3): it carries `{ report, visitId }`, written
once at upload, and a nullable 1:1 `transcription` ref — the exact-key
source binding of §17.3. The report row keeps no audio or
transcription field (§21.2); nothing in this section re-introduces it.

The six persistent entities are User, Branch, Report, Audio,
Transcription, and ChatConversation (§17.2). The complete persisted
system of record is those six collections only (§17.3); the Audio
document itself contains **metadata only** — binary audio never enters
MongoDB, GridFS is excluded (§13.6), and the physical file path is the
only binary contact point (§12.9, §12.10).

### 22.2 Field registry

| Field | Type | Required | Rule |
|---|---|---|---|
| `_id` | ObjectId | auto | the only key; never `id` (§12.11-3) |
| `user` | ObjectId | yes | owner-scoping (BR-13, §3.2.3, §18.7); all queries throughout §30–§39 resolve the owning user server-side |
| `report` | ObjectId | yes | the owning report — child-side join key of the Report—Audio edge (§17.3); document reference fields carry the plain model name — no `Id` suffix (§9.3); set once at upload inside the §32 session, never moved between reports |
| `visitId` | Number | yes | the exact visit key this clip belongs to — equals a member of `visits[].visitId` of the owning report at the upload moment (§21.2, §17.3); written once at insert, together with `report`, in the same session (single write site per §17.3); a report's visit removal detaches or cascades the visit's clips in the same write session (§17.4, §18.5) |
| `transcription` | ObjectId | no (null until transcribed) | the 1:1 Audio—Transcription edge (§17.3); set in the same session that creates the transcription (STT completion, §33) and re-pointed by re-transcription in the same session (§23.4, ADR-030); deleted with this row when the audio is removed (§17.4) |
| `filePath` | String | yes | server-internal absolute-ish path under `backend/uploads/audio/` (§12.9, §15.4) — gitignored (§12.9, §32); never exposed by any transform (§22.7) and never logged (§9.5); the physical file is unlinked after commit, non-transactionally, with failures retried by the orphan sweep (§17.4, §31, §62) |
| `mimeType` | String | yes | member of `AUDIO_ALLOWED_MIME_TYPES` (§11.3) — the recorded browser MIME per the client recording priority (§53); schema enum constrained to the constant (§18.2); never `audio/webm` for STT chunks (chunk MIME is the §33 pipeline's own rule) |
| `sizeBytes` | Number | yes | the uploaded byte size; the `AUDIO_MAX_SIZE_BYTES` (50 MB) cap is enforced by the §29/§32 validators — schema validation is shape-only (§18.8) |
| `durationSec` | Number | yes | recorded duration in seconds — informational metadata only, never used in pipeline math; validated server-side via ffprobe by §32 |
| `createdAt` / `updatedAt` | Date | auto | §18.2 timestamps |

No `status` field exists: audio presence is expressed exclusively
through the report machine (`audio_attached`, §17.6) and the
transcription rows — a clip is either uploaded (row exists) or not.
No `isArchived`/`archivedAt` exists: only Report and Branch are
archivable (§20.4, §21.6); no archivable model may evade the §20/§21
rule list. No `deletedAt` exists (BR-15, §18.3). No ordering field
exists: within a visit the clips' chronological order is
`createdAt`, and the §17.3 contract forbids any array-position or
ordering assumption as a *binding* — `Audio.where({ report, visitId })`
is exact-key.

### 22.3 Keys, indexes & TTL

- **Owner scope.** `schema.index({ user: 1 })` — the mandatory
  owner-scoping index (§18.3, BR-13); every clip query resolves the
  owning user first.
- **Exact-key source query.** `schema.index({ user: 1, report: 1,
  visitId: 1 })` — serves the §17.3 per-visit source resolution and
  the clip group reads of the review UI (§54); declared via
  `schema.index(..)` (§18.3), no field-level `unique: true` (a visit
  legitimately holds several clips).
- **1:1 transcription edge.** `schema.index({ transcription: 1 },
  { unique: true, sparse: true })` — the proven uniqueness of the
  Audio—Transcription 1:1 (§17.3, §33): every transcription belongs
  to exactly one audio row; sparse accommodates the pre-transcribed
  null. Uniqueness is declared only because the owning edge proves it
  (§18.3).
- **No TTL.** The spec declares exactly two TTL indexes — Report and
  Branch on `archivedAt` (§18.3, §21.3, §20.3). Audio declares none;
  the expiry of a finished report's clips is governed by the owning
  report's retention anchor, never by an index on this model.
- **No further indexes.** Anything else is indexed only under the
  §18.3 proof rule.

### 22.4 Lifecycle fields & document states

The Audio row has **no document states** — it exists from upload until
cascade removal, and the report machine (`REPORT_STATUSES`, §17.6)
observes it through presence queries, never through a state stored on
this row.

- **Creation.** Insert happens inside the §32 upload session: the
  `report`/`visitId` bindings are written at insert (the single write
  site, §17.3) and the owning report is validated as existing and
  owned by the session user in the same transaction (BR-13, §17.4).
  The physical binary write follows the session commit; a failure is
  retried by the orphan sweep (§17.4, §31, §62) — the document and the
  file never form a two-phase promise inside a hook (§18.6).
- **Removal.** Deleting one audio always cascades its transcription
  (§17.4); deleting the **last** audio of the report rewinds
  `audio_attached` → `draft` and `transcribed`/`reviewed` →
  `audio_attached` — the single explicit backward transition (ADR-003,
  declared in §31). A `completed` report never rewinds; clip deletion
  there is storage hygiene only (§17.4, BR-11).
- **Addition at any status** never rewinds; new clips attach as new
  rows with their own bindings (§17.4, BR-10).
- **Report cascade.** Report hard-delete removes the audio documents
  and their physical files in one transaction-pair: documents in the
  session, `fs.unlink` after commit, failures retried by the orphan
  sweep (§17.4, app-level sweeper §62).

### 22.5 Binary & metadata contract

- Binary audio lives at `backend/uploads/audio/` (gitignored); the
  collection stores metadata only (§12.9). No GridFS, no S3/object
  store — that class of storage is excluded (§13.6).
- The Audio document never contains audio bytes; the transform layer
  never forwards `filePath` to the client (§22.7) — consumers reach
  binaries exclusively through the §30–§39 audio endpoints.
- Retention is inherited from the owning report's lifecycle: the
  30-day window (BR-15, `ARCHIVED_TTL_SECONDS` §11.3) binds the report
  row; this model stores no window anchor of its own.
- Logs never include audio content, raw file bytes, or full
  transcription texts (§9.5, §16.3); provider keys never appear on any
  client surface or log (§16.3).

### 22.6 Hooks & session contract

- **No business-logic hooks** — nothing that computes status, derives
  bindings, deletes, cascades, or touches the filesystem runs in a
  hook (§18.6): audio binaries are out-of-DB and out-of-hook platform
  (§18.6, §12.9). Hooks are awaitable and session-aware when present
  (§18.6).
- **Write contract.** All write statics/methods accept `{ session }`
  and are invoked from a caller-owned session (ADR-018, §18.5); a
  statics method never opens a hidden session (§18.5). Read endpoints
  use no transactions (§18.5).
- **Read contract.** Reads use `.lean({ virtuals: true })` (§18.4);
  no transform mutates the document (§18.4).

### 22.7 Transforms & exposure

- `toJSON`/`toObject` with `virtuals: true`; delete `id` and `__v`
  (§18.4, §18.2).
- `filePath` is stripped from every serialized output — it is a
  server-internal value (§22.5); the DTO exposes the metadata surface
  only (`_id`, `report`, `visitId`, `mimeType`, `sizeBytes`,
  `durationSec`, timestamps).
- Exposed refs keep the §9.3 plain-name doctrine; route parameters
  keep the `Id` suffix (`:audioId`, §12.11-1) — the two namespaces
  never collide.

### 22.8 Seeds & mocks

Audio seeds are **metadata-only** clips — real binaries are never
written by seeding (ADR-037, §25). Seeded rows carry valid
`report`/`visitId`/`mimeType`/`sizeBytes`/`durationSec` values that
satisfy §17.6 presence and the §22 registry; injection and wipe are
session-aware (§18.5) and arrive exclusively through the §25/§40
mechanisms — never hard-coded in the model (§18.8).

### 22.9 Evolution

Changes are additive-only (§18.9, §14.5); a documented destructive
schema change is applied through the §25/§40 wipe mechanism in
development (§12.10). The binding fields (`report`, `visitId`,
`transcription`) are load-bearing for the §17.3 source contract; a
change to their shape requires §17.3/§21.2 coordination (§18.9) and
an amendment record (§14.5).

### 22.10 Verification usage

- Grep gates: no `status`, no `isArchived`, no `archivedAt`, no
  `deletedAt` on this model; no TTL declaration beyond §18.3's two;
  `mimeType` values always resolve to `AUDIO_ALLOWED_MIME_TYPES`; the
  binding fields are exactly `report` + `visitId` (no `reportId`
  anywhere — §9.3); `transcription` appears only as the nullable 1:1
  ref; no array-position or ordering vocabulary as a binding (§17.3).
- Cross-section checks: mirrors §17.2/§17.3 (exact-key edges, child
  side), §17.4 (cascades, rewind, unlink + orphan sweep), §17.6
  (presence rows), §18 (indexes, sessions, hooks, transforms,
  evolution), §12.9/§32 (paths, gitignore, metadata-only), §16
  (proxy, keys, contracts), §9.5 (log bans). Endpoints, multer
  mechanics, chunking, and STT calls are owned by §32/§33/§30–§31 —
  this section asserts none.
- §22 introduces no constant, no path (§15.4 unchanged —
  `audio.model.js` is the §15.4 `<entity>.model.js` file), and no
  package (§13.3 manifest unchanged — nothing to install); it is
  standalone — it references only specification sections.

---

## 23. Transcription Model

### 23.1 Purpose & scope

This section authors the Transcription row — the STT output document
derived from exactly one audio clip (Audio—Transcription 1:1, §17.3).
The section owns the Transcription schema, its keys and lifecycle,
the `raw`/`latest` content contract (F5, BR-11, §18.7), and the
re-transcription persistence semantics (ADR-030). It does **not**
own: the chunked STT pipeline, ffmpeg/WAV preparation, retry/backoff,
and the Addis AI call sequence (§33); report status transitions and
guards (§31); the review/edit user flows and correction modes
(§54, §35); provider contracts and error mapping (§16); request
validation (§29); or the clip-level review vocabulary of the capture
digest (reported → in_progress → completed — §6.10/§6.11 domain).

Transcription rows are user-scoped (BR-13, §3.2.3). The transcription
is *raw material*: it is the Amharic text version of the recorded
conversation — informal, possibly unordered — and is never treated as
the final report (§8.2, §8.4); the report's body content is generated
from the **reviewed** transcription (§6.1 rule 4, §8.5.1). This model
is one of exactly two content-bearing models (the second is Report,
§21.2) and implements the shared `raw`/`latest` shape (§18.7).

### 23.2 Field registry & content contract

| Field | Type | Required | Rule |
|---|---|---|---|
| `_id` | ObjectId | auto | the only key; never `id` (§12.11-3) |
| `user` | ObjectId | yes | owner-scoping (BR-13, §3.2.3, §18.7) |
| `audio` | ObjectId | yes | the owning audio — plain-model-name reference field (§9.3); unique + sparse: the proven 1:1 edge (§17.3, §22.2/§22.3) |
| `raw` | String | yes (null until transcription completes) | the original STT result, written once at transcription completion and **never rewritten** (BR-11, §18.7, §21.2 pattern); the §16.4 `data.transcription` value lands here (§12.4 stage 3) |
| `latest` | String | yes (null until transcription completes) | the single current-content slot, initialized equal to `raw` at creation (§18.7); review edits overwrite it (§54), re-transcription rewrites both (§23.4), and one-click restore copies `raw` into it — single-undo, no version chain (ADR-005 retired, §14.3) |
| `language` | String | yes (default `am`) | the STT language of the transcription — member of `LANGUAGE_CODES` (§11.4); `am` active, `om`/`ti` reserved and not activated (§7.7); the §16.4 `request_data.language_code` echoed here |
| `stt.requestId` | String | no (null if unknown) | the Addis AI request correlation id from `usage_metadata.requestId` (§16.4) — persisted per the §16.4 permission (ADR-019 audit); provider request ids may be logged (never secrets) |
| `stt.model` | String | no (null if unknown) | the Addis voice model actually used (e.g. `አሌፍ-Audio-AM`) — a free provider-native string: the `AI_MODELS` registry (§11.4, §16.2) is the **text-generation** registry only; STT model choice is the §33 pipeline's own, stored here as audit metadata |
| `createdAt` / `updatedAt` | Date | auto | §18.2 timestamps |

No `status` field exists, by design: transcription presence and the
review lock are expressed exclusively through `REPORT_STATUSES`
(`transcribed`, `reviewed` — §17.6, §21.4); the clip-level
`reported → in_progress → completed` vocabulary is review/capture UI
state owned by §6.10/§6.11, not a document field, and introducing a
`TRANSCRIPTION_STATUSES` enum would fork the state machine of §31
against §17.6. No `isArchived`/`archivedAt` (only Report and Branch
are archivable, §20.4), no `deletedAt` (BR-15, §18.3), no version or
history fields of any kind (ADR-005 retired), and no
`aiCorrectedText` or equivalent — corrections write `latest`
(§8.5.2). Token/usage accounting beyond `stt.requestId` is not
persisted here: per-message usage metadata is the §36 conversation
domain (§16.1).

### 23.3 Keys, indexes & TTL

- **Owner scope.** `schema.index({ user: 1 })` (§18.3, BR-13).
- **1:1 edge.** `schema.index({ audio: 1 }, { unique: true,
  sparse: true })` — one transcription per audio (§17.3, ADR-030);
  sparse accommodates nothing here (the ref is required) but is
  declared for index symmetry with the §22 sparse counterpart.
- **No TTL.** Exactly two TTL indexes exist in the spec — Report and
  Branch on `archivedAt` (§18.3). Transcription declares none; its
  lifetime is bounded by the owning report's lifecycle and cascades
  (§17.4).
- **No further indexes** without the §18.3 proof rule.

### 23.4 Lifecycle, re-transcription & content contract

- **Creation.** The row is created at STT completion inside the §33
  pipeline session: `raw` set from the STT result, `latest`
  initialized to it, `language` from the request, `stt` metadata
  filled, and `audio.transcription` pointed at the new row — all in
  the same write session (§12.4 stage 3, ADR-018). A row never exists
  before its audio (the chain of §17.3 is enforced by the pipeline's
  write path, never by a hook — §18.6).
- **Review contract.** During the review step (§1.4, §54) `latest` is
  the editable slot; `raw` stays untouched (BR-11); the four review
  paths — direct edit (Mode 1), typed instruction (Mode 2), voice
  instruction (Mode 3), re-transcription — all persist through the
  same review write path (§12.4 stage 4).
- **Re-transcription (ADR-030).** Re-transcription replaces the
  row: delete the old transcription and insert the new one (fresh
  `raw` = new STT result, `latest` = same) atomically in one session,
  re-pointing `audio.transcription` to the replacement — the §17.3
  keying stays stable across replacement. Allowed at every report
  status **except `completed`**; at `reviewed` the re-transcription
  invalidates the review lock and the report returns to `transcribed`
  (the transition rule itself is declared by §31 per §17.6 — this
  section records the presence consequence, not the rule book). The
  rewind rules of §17.4 apply to audio removal, not to
  re-transcription: no audio is removed here.
- **Cascade.** Audio deletion cascades its transcription in the same
  session (§17.4); report deletion cascades all transcriptions of its
  audio rows (§17.4). Orphan transcriptions left by sweeper races are
  removed by the orphan sweep (§31, §62).
- **Presence.** `transcribed` requires every visit's source resolved
  through the exact-key edges with a transcription whose `raw` (and
  `latest`, equal) exist; `reviewed` locks that content (§17.6) — the
  checks are queries, never stored flags on this row.

### 23.5 Snapshot, tombstone & single-undo contract

- No snapshot fields exist: the transcription carries no branch or
  visit names (those live in the report's `visits`/`branches[]`
  blocks, §21.2/§21.7) and no report-derived values — tombstone reads
  of a deleted branch render through the report's snapshot (§17.4).
- The content slots are exactly `raw` + `latest` (single-undo,
  BR-11, §21.5 pattern): `raw` immutable, `latest` current; restore =
  copy `raw` over `latest`; no version chain exists beside them.

### 23.6 Hooks & session contract

- **No business-logic hooks** (§18.6): nothing computes statuses,
  touches files, calls STT, or enforces the §17.3 chain from a hook.
- **Write contract:** statics/methods accept `{ session }`; never
  open hidden sessions (§18.5); caller-owned sessions for the §33
  write and all correction writes (ADR-018).
- **Read contract:** `.lean({ virtuals: true })` (§18.4); reads take
  no transactions (§18.5).

### 23.7 Transforms & exposure

- `toJSON`/`toObject` with `virtuals: true`; delete `id` and `__v`
  (§18.4).
- Exposed surface: `_id`, `audio`, `language`, `raw`, `latest`,
  `stt.requestId`, `stt.model`, timestamps. Full transcription texts
  are **never logged** (§9.5) and never enter analytics payloads; the
  transform layer adds no derived text fields.
- Margin: the §16.4 `confidence` value is STT-call information, not a
  document field — it is not persisted here (§16.4 permission covers
  `requestId` only).

### 23.8 Seeds & mocks

Mock transcriptions are written directly as documents (valid `raw` =
`latest`, `language: am`, matching `audio` ref) through the §25/§40
mechanism — seeding never invokes STT, writes no physical audio
(ADR-037, §25), and stays session-aware (§18.5). No seed content is
hard-coded in the model (§18.8).

### 23.9 Evolution

Additive-only (§18.9, §14.5); destructive changes flow through the
§25/§40 wipe in development (§12.10). The `raw`/`latest` contract and
the `audio` 1:1 ref are load-bearing for §17.3/§17.6/§21.2 — shape
changes require coordinated amendments (§18.9).

### 23.10 Verification usage

- Grep gates: no `status`, no `isArchived`, no `archivedAt`, no
  `deletedAt`; no version/history vocabulary; no `aiCorrectedText`;
  no `TRANSCRIPTION_STATUSES`; content slots exactly `raw` + `latest`;
  `language` members resolve to `LANGUAGE_CODES`; `stt.requestId`
  only as provider correlation (§16.4); no invention of STT
  response fields beyond §16.4's contract.
- Cross-section checks: mirrors §12.4 stage 3/4 (write site), §16.4
  (STT contract, permission), §17.2/§17.3 (1:1 child-side edge),
  §17.4 (cascades, orphan sweep), §17.6 (presence rows), §18.7
  (`raw`/`latest` shape, F5), §21.2/§21.5 (report mirrors the same
  content pattern), §8.5/§54 (review paths — owned there), §6.1/§6.3
  (reviewed transcription is source-of-truth fallback). Endpoints,
  pipeline mechanics, and transitions are owned by §33/§31/§30 — this
  section asserts none.
- §23 introduces no constant, no path (§15.4 unchanged —
  `transcription.model.js` is the §15.4 `<entity>.model.js` file), and
  no package (§13.3 manifest unchanged — nothing to install); it is
  standalone — it references only specification sections.

---

## 24. ChatConversation Model

### 24.1 Purpose & scope

This section authors the ChatConversation row — the persistent AI
chat history of a report (F7, §12.8, §36, §55). The section owns the
conversation document shape, its one-per-report keying, and the
embedded message-document contract including the per-message
`{ provider, model, reasoning }` triple (ADR-014, §16.2, §18.7). It
does **not** own: the chat service, conversation API endpoints, and
the message-append business flow (§36); the MUI X Chat correction
interface and rendering (§55); usage-token accounting and what
additional per-message metadata is persisted (§16.1 assigns that
decision to §36); provider request/response contracts and the
conversation_history formation rules (§16.4); rate limiting (§27) or
validation (§29).

There is exactly **one** conversation per report (§17.2, §17.3 —
Report—ChatConversation 1—N exactly, i.e. a single conversation
document owned by each report). Messages are **embedded child
documents** of the conversation — they are not a separate collection
(§17.2). Rows are user-scoped (BR-13, §3.2.3). Conversation turns are
saved for display (§12.8) and are also the `conversation_history`
source used by §16.4's regeneration contract. The conversation may be
in Amharic, English, or mixed (content surface, §7.6); translation is
never invoked by any chat path (§7.7).

### 24.2 Field registry & message contract

| Field | Type | Required | Rule |
|---|---|---|---|
| `_id` | ObjectId | auto | the only key; never `id` (§12.11-3) |
| `user` | ObjectId | yes | owner-scoping (BR-13, §3.2.3, §18.7) |
| `report` | ObjectId | yes | the owning report — plain-model-name reference field (§9.3); **unique + sparse: one conversation per report** (§17.2) |
| `messages` | Array | yes (default `[]`) | the embedded message-document list — each entry is `{ role, content, provider, model, reasoning, createdAt }` (§18.7); empty until the first saved turn (§36) |
| `messages[].role` | String | yes | member of `MESSAGE_ROLES` (`system` \| `user` \| `assistant`, §11.4) — schema enum constrained to the constant (§18.2); the §16.4 `conversation_history` projection passes only `user`/`assistant` entries (§16.4) |
| `messages[].content` | String | yes | the message text — Amharic, English, or mixed (content surface, §7.6); never logged verbatim (§9.5) |
| `messages[].provider` | String | yes | member of `AI_PROVIDERS` (§11.4) — the provider that produced this turn (§16.2); different providers may serve different turns (initial generation vs corrections, ADR-014, §16.2) |
| `messages[].model` | String | yes | a registry member id of `AI_MODELS` for the text-generation provider in use (§11.4, §16.2); validated against the registry by §36/§29 — a non-member is rejected 422, never stored |
| `messages[].reasoning` | String | yes | member of `AI_REASONING_EFFORTS` (§11.4, §16.2, §16.4) — the effort governing this turn; the Gemini/NVIDIA mapping and the Addis ignore-rule are §16.4's |
| `messages[].createdAt` | Date | auto (subdoc) | per-message timestamp; reads re-merge chronologically (§18.7, §16.4) |
| `createdAt` / `updatedAt` | Date | auto | §18.2 timestamps |

Explicitly absent: `reasoning_content` (or any reasoning text) is
**never stored** (§16.4 — provider reasoning output is not surfaced to
the client and not persisted); token/usage statistics are not declared
here — §36 decides what usage metadata beyond the §18.7 triple is
persisted (§16.1); no `isArchived`/`archivedAt` (only Report and
Branch are archivable, §20.4); no `deletedAt` (BR-15, §18.3); no
conversation-typed status or lifecycle enum — a conversation exists
from first turn to cascade.

### 24.3 Keys, indexes & TTL

- **Owner scope.** `schema.index({ user: 1 })` (§18.3, BR-13).
- **One-per-report edge.** `schema.index({ report: 1 },
  { unique: true, sparse: true })` — the proven §17.2/§17.3
  one-conversation-per-report key. The same index serves the
  per-report conversation read used by §36/§55.
- **Chronology.** `schema.index({ report: 1,
  'messages.createdAt': 1 })` covers ordered message reads; the
  chronological re-merge rule is a read convention (§18.7), not a
  stored order field.
- **No TTL.** Exactly two TTL indexes exist in the spec (§18.3);
  the conversation's lifetime is the owning report's — cascade (§17.4)
  and sweeper (§62), never an index.

### 24.4 Lifecycle fields & document states

- **Creation.** The conversation document is created lazily on the
  first saved turn — the creation timing and the append business flow
  are §36's; this section fixes the container contract they write
  into: one row per report (unique key), messages embedded, appended
  in-order inside the write session (ADR-018).
- **Append.** Each saved turn `$push`es one message document inside
  the §36 write session; the triple is validated against §11.4
  registers before append (§16.2); chronological order is guaranteed
  by per-message `createdAt` (never by array index as a key — arrays
  re-sort on read, §18.7).
- **Cascade.** Report hard-delete removes the conversation document
  in the same session (§17.4); orphans left by sweeper races are
  removed by the orphan sweep (§31, §62). There is no other removal
  path — conversations are never individually archivable or deletable
  outside their report's lifecycle.
- **Read paths.** Every report read path that renders conversation
  material (detail, export, chat) is a report-scoped read (§21.7
  tombstone rule: deleted-branch snapshots render via the report's
  `branches[]`, never via the conversation).

### 24.5 Snapshot & tombstone contract

The conversation owns no snapshot: it never stores branch names,
person names, or header values (those live in the report's own
snapshot blocks, §21.2/§21.7) — a tombstoned branch's name renders
through the report's snapshot on every chat read path (§17.4,
§21.7). No foreign display value is duplicated into messages.

### 24.6 Hooks & session contract

- **No business-logic hooks** (§18.6) — nothing triggers provider
  calls, computes anything, or cascades from a hook.
- **Write contract:** the §36 flow owns a session and the
  conversation's write statics accept `{ session }`; never a hidden
  session (§18.5).
- **Read contract:** `.lean({ virtuals: true })`, no transactions on
  reads (§18.4, §18.5).

### 24.7 Transforms & exposure

- `toJSON`/`toObject` with `virtuals: true`; delete `id` and `__v`
  (§18.4); embedded messages serialize as plain objects in
  chronological order.
- The exposed message surface is exactly `role`, `content`,
  `provider`, `model`, `reasoning`, `createdAt` — no provider-native
  wire keys (those are §16.4's transport concern, not persisted
  names), no usage fields until §36 declares them, and no reasoning
  text of any kind (§16.4).
- Content is a UI surface: full conversation texts never appear in
  logs (§9.5) and never enter analytics payloads (§36).

### 24.8 Seeds & mocks

Mock conversations are seeded as valid documents (one per mock
report, messages schema-valid with registered provider/model/reasoning
members) through the §25/§40 mechanism — session-aware (§18.5),
never hard-coded in the model (§18.8). Mock messages may reuse the
§6.8 sample voices for realism but remain schema-valid (§25).

### 24.9 Evolution

Additive-only (§18.9, §14.5); the `report` unique key and the
message-document shape are load-bearing for §17.2/§17.3/§36/§16.4 —
shape changes require coordinated amendments (§18.9). Any future
per-message metadata field is introduced by §36, not here (§16.1).

### 24.10 Verification usage

- Grep gates: `role` values always resolve to `MESSAGE_ROLES`; the
  triple `provider`/`model`/`reasoning` always resolves to
  `AI_PROVIDERS`/`AI_MODELS`/`AI_REASONING_EFFORTS`; no
  `reasoning_content`, no token/usage fields, no `status`, no
  `isArchived`, no `archivedAt`, no `deletedAt`; one `report` ref with
  unique keying (§17.2); no snapshot/denormalized display values.
- Cross-section checks: mirrors §17.2/§17.3 (one-per-report message
  child docs), §18.7 (message triple shape), §16.2/§16.4 (registry
  membership, conversation_history projection, reasoning never
  stored), §12.8 (chat saved for display), §36/§55 (service and UI —
  owned there), §21.7 (tombstone rule), §9.5 (log ban). Endpoints,
  append flows, and usage accounting are owned by §36 — this section
  asserts none.
- §24 introduces exactly one constant — `MESSAGE_ROLES`, registered
  in §11.4 (domain constants — the only §11 change of this section);
  it introduces no path (§15.4 unchanged — `conversation.model.js` is
  the §15.4 `<entity>.model.js` file) and no package (§13.3 and §13.4
  manifests unchanged — nothing to install: the MUI X Chat dependency
  of §55 is already registered); it is standalone — it references
  only specification sections.

---

## 25. Mock Content & Seeding

### 25.1 Purpose & scope

This section authors the **mock-content rules** — the policy every
seed fixture must obey (§12.9, §17.1, §17.5). It owns: the mock
discipline (no seeds in models), the fixture inventory, the
session-aware injection and wipe contract (ADR-037, §18.5), and the
development-only boundary. It does **not** own: the seed endpoints
and their routes (§40), validators (§29 — all validation rule books
live there, so nothing called "validation rules" belongs here),
schema shapes (§19–§24), or environment boot (§26).

The spec's seeding story is a two-section split: **§25 = the rules**,
§40 = the endpoints that execute them (§17.1, §17.5, §12.9). Mock
data flows only through §25 rules and the §40 endpoints — never
hard-coded into models (§18.8, §19.6, §20.8, §21.10, §22.8, §23.8,
§24.8). Mock-content work supports sessions, like any write (§18.5),
and exists for development only (§12.10).

### 25.2 Mock-content rules

1. **No seeds in models.** None of the six models (§17.2) contains
   default users, branches, reports, audio, transcriptions, or
   conversations (§18.8; each of §19.6/§20.8/§21.10/§22.8/§23.8/§24.8
   repeats this). A report's creation data always comes from the user
   flow, never from defaults (§21.10).
2. **Metadata-only audio (ADR-037).** Seeded Audio rows carry valid
   metadata without any physical binary — no file is written to
   `backend/uploads/audio/` by seeding, and `filePath` values of seeds
   are synthetic but schema-valid (never pointing at real files).
3. **Schema-valid transcriptions.** Mock transcriptions carry
   `raw` = `latest` (equal), `language: am`, and a matching `audio`
   ref — the §17.6 `transcribed` presence rows stay satisfiable.
4. **§17.6-presence-valid state.** Every seeded report sits in a
   report status whose §17.6 artifact requirements hold (e.g. a mock
   `audio_attached` report has at least one audio row; a mock
   `transcribed` report's visits resolve to transcriptions through the
   exact-key edges; a mock `reviewed` report's content is review
   locked). A `completed` mock report never carries an export artifact
   — export deliverables are never persisted on any row (§17.6,
   §21.5, §37).
5. **Content-language boundary.** Mock Amharic content fills the
   content surfaces (reports, transcriptions, conversations) and
   English copy fills the chrome surfaces (§7.9) — the §7.6 boundary
   applies to fixtures exactly as to real data.
6. **No privacy data.** Fixtures use the sample persona of §6.8/§3
   (ቤዛ አያሌው) and the sample branch names of §6.8 (መድኃኒዓለም, ኤርፖርት,
   ቡልቡላ, ጎላጉል, ብስራተ ገብርኤል) — never real persons, real places, or
   real recordings; sample report bodies come verbatim from §6.8
   samples, never from invented content.
7. **Seeded-state consistency.** All fixtures together satisfy the
   §17.2/§17.6 maps, the §21.2 registry, and the §22–§24 registries;
   a fixture that breaks a presence row is invalid (§17.6).

### 25.3 Fixture inventory

The canonical development fixture set (versioned with the §40 seed
scripts):

- **Users** — one mock supervisor persona (`ቤዛ አያሌው`, profile name
  per §6.8 — persona §3.3.1) with a schema-valid account (§19
  registry), and a second user so ownership scoping (BR-13) is
  exercisable; no mock user carries a real email or password material
  — password material follows the §28 account-creation contract.
- **Branches** — the §6.8 branch names as branch rows (§20 registry)
  covering Type-1 and Type-2 combinations (single-branch rows and
  multi-branch days).
- **Reports** — one of each status of `REPORT_STATUSES` (draft,
  audio_attached, transcribed, reviewed, completed); bodies follow the
  §6.8 samples (Sample 3 for the Type-1 day; Samples 1, 2, 4 for the
  Type-2 days) with `reportDate`, `supervisorName`, `branches[]`
  snapshot, and `visits[]` per §21.2 (OQ-002's nullable clock fields
  used as null in at least one fixture).
- **Audio** — metadata-only rows bound to the reports (valid
  `report`/`visitId`/`mimeType`/`sizeBytes`/`durationSec`; no
  `transcription` ref on the `audio_attached` fixture, refs set on the
  transcribed+ fixtures).
- **Transcriptions** — `raw` = `latest` rows for the transcribed,
  reviewed, and completed fixtures (1:1 with their audio).
- **Conversations** — one per mock report with at least one seeded
  report; messages valid against `MESSAGE_ROLES`/`AI_PROVIDERS`/
  `AI_MODELS`/`AI_REASONING_EFFORTS`, mirroring the §6.8 sample voice
  where natural.

### 25.4 Injection & wipe contract

- **Session-aware.** Injection and wipe run in Mongoose sessions
  (ADR-018, §18.5) and commit atomically like any write — a partially
  injected fixture set is a violation, never a state.
- **Idempotence.** Re-running injection against an already-seeded
  state is a defined §40 behavior (re-seed replaces the seeded scope
  after wipe, or no-ops per the §40 endpoint contract) — §25 fixes
  that the result state equals the canonical fixture set either way.
- **Wipe = full reset.** Wiping removes the entire seeded scope
  (all seeded users, branches, reports, audio, transcriptions,
  conversations) and leaves the environment empty of mock data; wipe
  and destructive dev resets use this mechanism (§18.9, §12.10) —
  never manual collection droppings.
- **Development-only.** Seeding, re-seeding, and wipe are
  development-instrumented operations (§12.10); production never runs
  them — the guard lives with the §40 endpoints and the §10.4 env
  chain (§10.2: the configuration object is the single source of
  truth). No seeded value may leak into production behavior.
- **Order.** Fixtures are injected in dependency order (users →
  branches → reports → audio → transcriptions → conversations) so the
  §17.3 refs resolve; wipe runs in reverse.

### 25.5 Verification usage

- Grep gates: the six authored model sections (§19.6, §20.8, §21.10,
  §22.8, §23.8, §24.8) contain no seed data — everything routes here;
  "validation rules" vocabulary does not appear (validators = §29);
  no plan-file names or paths appear (§25 is standalone); no constant
  and no path is introduced beyond §15.4's existing `mock/` folder
  and its §40 responsibility.
- Cross-section checks: mirrors §12.9/§12.10/§17.1/§17.5 (storage and
  seeding map), §18.5 (session-aware writes), §18.8 (seed
  discipline), §7.9 (content-language boundary), §6.8 (verbatim
  samples), §17.6 (presence validity), and §19–§24 (registries).
  Endpoints, route guards, and wipe execution are owned by §40 — this
  section asserts none.
- §25 introduces no constant, no path (§15.4 unchanged), and no
  package (§13.3 manifest unchanged — nothing to install); it is
  standalone — it references only specification sections.

---

## Part D — Frontend (HLD/LLD)

## 41. Frontend Foundation

### 41.1 Purpose & scope

§41 is the foundation of Part D (frontend internals, §41–§59 per
§12.1). It owns the client entry composition — `main.jsx` and
`App.jsx` (§15.5) — the flat route map with its guards (ADR-025),
the Redux store layout (ADR-026, §15.5/§15.6), and the Part D
locked-decisions table (§41.2). It does **not** own: the network
layer (`apiSlice.js`, §42), the theme files (§43–§44), the
responsive system (§45), the reusable component library (§46), the
layout shells (§47), or any page behavior (§48–§59).

The scaffold facts this section builds on: `client/` is a Vite 8
single-page application with the file tree of §15.5; the theme files
exist in the scaffold but are **not yet mounted** — mounting is
prescribed here (§41.3) so every page renders through the design
system (§43) and the error/toast surfaces (§60).

- **Owned here (normative).** The client entry composition and the
  provider order (§41.3); the root-layout responsibility of
  `App.jsx` (§41.4); the guard pair and every redirect rule (§41.5);
  the store, slice, and endpoint-injection layout (§41.6); the
  client module-boundary rules restated for Part D (§41.7); and the
  Part D locked-decisions table (§41.2).
- **Owned elsewhere — deliberately not repeated here.** Route
  parameters and their `Id` suffixes = §9.3/§12.11-1 (applied in
  §49–§54); the session/auth contract that guards consume = §28
  (Part C); reauth and error normalization = §42; shared loading,
  empty, error, and success behavior = §60; the page set and its
  per-page behavior = §48–§59; the route definitions of the backend
  API = §30–§39.
- **Explicitly out of scope §41.** No endpoint address, no auth
  token handling, no data fetch beyond wiring the API layer, no new
  constant (§11 unchanged — §41 introduces none), no new path
  (§15.5 unchanged — every file named here is already in the tree),
  no new package (§13.4/§13.5 unchanged — nothing to install).

### 41.2 Locked decisions (Part D, normative)

The decisions below are stated once here and applied by the sections
that reference them. They extend the §12.11 table — those rows stay
in force (§12.11 rows 1–3, 6–7 bind every Part D section).

| # | Decision | Applied in |
| - | --- | --- |
| 1 | The client is a Vite SPA with one entry (`main.jsx`): React 19, MUI 9 community, no SSR, no TypeScript, no Tailwind — per §12.2, §13.6 | §41.3, §42–§59 |
| 2 | Routes are a **flat array** owned by `main.jsx` via `createBrowserRouter` (ADR-025); every route uses the lazy `Component` form — `element` is never used; no separate routes file unless `main.jsx` becomes unmanageable (§15.5) | §41.3 |
| 3 | `App.jsx` is the root layout: `AppTheme` + `CssBaseline` + error boundary + toast container + `<Outlet/>` — components render only inside it, never beside it | §41.4 |
| 4 | Guards: `ProtectedRoute` shows a spinner while auth is initializing, redirects unauthenticated users to `/login` with `state={{ from: location }}`; `PublicRoute` is the inverse and redirects authenticated users to `/dashboard` | §41.5 |
| 5 | The store lives at `redux/app/store.js`; one slice per domain under `redux/features/`; `features/apiSlice.js` is the single RTK Query descriptor using `injectEndpoints` (ADR-026) | §41.6, §42 |
| 6 | Cached entities are keyed by `_id` (`selectId: (entity) => entity._id`) — the §9.3/§12.11-3 doctrine | §41.6, §42 |
| 7 | All server calls carry `credentials: 'include'` (cookie sessions, §28); the browser never holds provider keys or credentials (SC-7, §12.8) | §42 |
| 8 | Backend errors — including 422 field errors — are surfaced through **toasts**; `setError` is used for client-side rule failures only (react-hook-form), never for server errors (ADR-033, §9.6, §60) | §42, §48–§59 |
| 9 | Successful registration redirects to `/login` with a success toast ("Account created — please log in"); a created account never auto-enters the app | §48.4 |
| 10 | Post-login navigation goes to `state.from` when present, else `/dashboard`; the logo navigates to `/dashboard` when authenticated, else `/` | §41.5, §47 |
| 11 | The registration form collects only `email` and `password`; no name field — `firstName`/`lastName` are extracted by the backend (§19.2, §28) | §48.4 |
| 12 | Every input element carries a start adornment (§46); submit buttons are `size="small"`, use the MUI `loading` state, and never shrink on flex (§9.6) | §46, §48–§57 |

### 41.3 Entry composition (`main.jsx`)

`main.jsx` is the only module that mounts the application. Order of
composition (top to bottom, normative):

1. `@fontsource/inter` weight imports (300/400/500/600/700) — the
   chrome face (§43.5).
2. `createRoot(document.getElementById('root'))` with React
   `StrictMode` (§12.3).
3. Inside the root, outermost to innermost: Redux `Provider`
   (store from `redux/app/store.js`, §41.6) → `LocalizationProvider`
   with `AdapterDayjs` (§13.4, §46.6) → `RouterProvider` with the
   `createBrowserRouter` result (ADR-025).

The route map is a flat array (locked decision 2). The two layout
branches are `PublicRoute`-wrapped `PublicLayout` children and
`ProtectedRoute`-wrapped `AppShell` children (§47); the `*` route
renders the 404 page (§59). Every page module is loaded via
React Router's lazy form (`Component` + `lazy`); the guard wrappers
(`PublicRoute`, `ProtectedRoute`) are loaded the same way.

The route set is decided here and detailed by the page sections:

| Path | Component | Guard | Section |
| --- | --- | --- | --- |
| `/` | Landing page | Public | §48.2 |
| `/login` | Login page | Public | §48.3 |
| `/register` | Register page | Public | §48.4 |
| `/dashboard` | Dashboard page | Protected | §49 |
| `/reports` | Reports page (list/grid toggle) | Protected | §50 |
| `/reports/new` | Report Creation Wizard | Protected | §52 |
| `/reports/:reportId` | Report Details page | Protected | §51 |
| `/branches` | Branches page | Protected | §56 |
| `/profile` | Profile page | Protected | §57 |
| `*` | 404 page | Public | §59 |

Routes are kebab-case (§9.3); the only route parameter is
`:reportId` (§9.3 — a bare `:id` is never used). This table is the
complete page set: AI chat (§55), audio recording (§53),
transcription review (§54), export flows (§58), and global search
(§59) are **embedded surfaces** of the pages above — they are never
routes. The rationale for each page's existence, and for those
non-pages, is authored in the owning sections.

### 41.4 Root layout (`App.jsx`)

`App.jsx` is the React Router root layout and renders nothing but
the fixed shell chrome:

1. `AppTheme` (theme definition, §43.3) wrapping the whole tree.
2. `CssBaseline` — mounted here, once; the only global CSS reset in
   the application (§43).
3. `AppErrorBoundary` (react-error-boundary, §13.4) — the render-
   error surface of §60; its fallback is distinct from the 404 page
   (§59).
4. `AppToastContainer` (react-toastify, §13.4) — the single toast
   surface of §60.
5. `<Outlet/>` — the routed view.

No page, component, or layout renders its own copy of any of these
(locked decision 3). The router's `ErrorBoundary` slots the
`AppErrorPage` component (ADR-025) — the router-level error surface
of §60 — never a page.

### 41.5 Guards & redirects

Two guard components in `components/layout/` (§47) wrap the two
route branches. Their contract:

- **`ProtectedRoute`.** While the auth state is `initializing`
  (populated by the §28 session contract through the §42 network
  layer), renders `LoadingSpinner` full-page (§46.14). When
  unauthenticated, renders `<Navigate to="/login" replace
  state={{ from: location }} />` (locked decision 4) — the login
  page reads `state.from` for post-login navigation (§48.3). When
  authenticated, renders `<Outlet/>`.
- **`PublicRoute`.** The inverse: authenticated → `<Navigate
  to="/dashboard" replace />`; unauthenticated → `<Outlet/>`.
  Landing, Login, and Register are public by lock (decision 4).

Redirect targets are fixed strings — `/login`, `/dashboard` —
defined in the route map, never recomposed by callers. The 401
expiry path that *lands* on login is the §42 reauth chain's
responsibility, not a guard's.

### 41.6 Store, slices & endpoint injection

- **Store creation** — `redux/app/store.js`: `configureStore` with
  the `apiSlice` middleware and, when present, the domain slices.
  Slices do not own API state: every server call is RTK Query
  (fetchBaseQuery, §42) so each domain slice holds only domain UI
  state (ADR-026, §12.6).
- **API layer** — `redux/features/apiSlice.js` is the **single**
  descriptor: `createApi` with `fetchBaseQuery`
  (`VITE_API_BASE_URL`, `credentials: 'include'`, §42.2) — one
  `reducerPath` (`'api'`) — and the `baseQueryWithReauth` wrapper
  (§42.3). Domain endpoint sets are added with `injectEndpoints`
  from the domain pages that consume them (ADR-026, §12.6).
- **Entity keys** — every injected list/detail query declares
  `selectId: (entity) => entity._id` (locked decision 6, §12.11-3);
  invalidation tags are declared per domain (`Reports`, `Branches`,
  `Audio`, `Transcription`, `Conversation`, `Me`) and the owning
  page sections pin the mutation-tag pairs (§50–§57).
- **Server-as-source-of-record** — the browser holds only ephemeral
  UI state and a possibly-stale RTK Query cache; anything stale is
  re-fetched via tag invalidation — the browser never mutates server
  truth locally (§12.2-10).
- **Selector naming** — slices export named selector functions
  (camelCase, §9.3); components consume selectors, never raw store
  paths.

### 41.7 Module boundaries (Part D restatement)

The §15.2 conventions bind every Part D module: imports only within
`client/src/`; the network layer is the only place an HTTP call
leaves the SPA (§12.6, §42); reusable components in
`components/reusable/` (§46), layout shells in `components/layout/`
(§47), MuiDataGrid column sets in `components/columns/` (§50, §56),
every other component in `components/<domain>/` (e.g. `login/`,
`landing/`, `report/`), pages in `pages/`, shared UI-state logic in
`hooks/` (§53), and store/API modules in `redux/` (§41.6). Page
files own no leaf UI outside page-level composition (§15.5).

### 41.8 Verification usage

- Grep gates: `element` never appears in the route map (locked
  decision 2); no page file outside `pages/`; no `id` used as a
  document key (only `_id`, §12.11-3); route parameters always carry
  the `Id` suffix (`:reportId`); guard redirects match §41.5
  verbatim; no `fetch`/`axios` outside `features/apiSlice.js`
  (§12.6, §42).
- Cross-section checks: mirrors §12.6 (frontend HLD), §15.5/§15.6
  (tree and folder responsibilities), §12.11 (locked decisions),
  §13.4 (client manifest), §60 (toast and error surfaces), §28
  (session contract, Part C). Route-to-section ownership matches the
  §3.1.2 F6/F9 maps; no route exists that a page section does not
  author.
- §41 introduces no constant (§11 unchanged), no path (§15.5
  unchanged — every file named here already exists), and no package
  (§13.4 manifest unchanged); it is standalone — it references only
  specification sections.

---

## 42. Frontend Network Layer

### 42.1 Purpose & scope

§42 owns the client's single API layer — `redux/features/apiSlice.js`
(§15.5, §41.6): the `createApi` descriptor, the `fetchBaseQuery`
base, the `baseQueryWithReauth` reauth chain, the envelope unwrap,
and the error normalization that feeds the §60 toast protocol
(§12.6, §9.6). It is the **only** owner of HTTP on the client: every
server call — public and protected — goes through it (locked
decision 7, §12.6), so the §12.11-3 `_id` keying and the §12.11-2
toast discipline are enforced in exactly one place.

- **Owned here (normative).** The descriptor shape (§42.2); the
  reauth chain and the 401 rule (§42.3); the envelope unwrap and
  error normalization contract (§42.4); timeouts, abort and session
  rules (§42.5); tags and endpoint registration (§42.6).
- **Owned elsewhere — deliberately not repeated here.** Session
  issuance, cookies, and refresh tokens = §28 (Part C); token
  lifetimes = §28; backend envelope shape and pagination payloads =
  §5/§27; backend error shapes, including the 422 field-error shape
  and the `message` language rule = §27/§12.5; loading/empty/error/
  success presentation = §60 and the page sections.
- **Explicitly out of scope §42.** No endpoint path is invented
  here: endpoints are named by their §30–§39 owners and referenced
  by contract (§42.6 lists the §28 session calls only). No constant
  is added (§11 unchanged — `PAGINATION_*`, `AUDIO_*` and the §11.5
  mirrors are consumed, never redefined). No new package: the client
  has no axios (§13.4) and §42 adds none.

### 42.2 API descriptor

`features/apiSlice.js` defines exactly one `createApi`:

- `baseQuery` = a wrapper over `fetchBaseQuery({ baseUrl:
  VITE_API_BASE_URL, credentials: 'include' })` that adds the reauth
  chain (§42.3) and the normalization pass (§42.4).
- `credentials: 'include'` on every call — including public pages —
  because the session lives in httpOnly cookies (§28, app-info
  contract, §12.7).
- No `extraOptions` beside the §42.3 retry marker; no custom fetch
  (browser `fetch` only, via `fetchBaseQuery`).
- Domain endpoints are **injected** by the modules that consume
  them with `injectEndpoints({ overrideExisting: false })`
  (ADR-026): `auth` (references the §28 session contract), plus the
  domain endpoint sets registered in §50–§59. A domain endpoint set
  may be injected exactly once; re-injection with the same name is a
  review error.
- Every mutation succeeds into the cache through the owning domain's
  tags (§42.6) — the UI never refetches manually after a mutation
  (§12.2-10).

### 42.3 Reauth chain (`baseQueryWithReauth`) & the 401 rule

The chain is the single owner of session expiry on the client
(§12.7). Behavior is ordered and normative:

1. Execute the request.
2. On **non-401** responses, pass through (§42.4 normalizes).
3. On **401**: if the request is the refresh call itself, fail
   through (§30/§28 define the server's own semantics) — no retry.
   Otherwise, exactly **one** refresh attempt: `POST /auth/refresh`
   (the §28 refresh endpoint, referenced — never re-implemented).
4. If refresh succeeds, retry the **original** request once. If the
   retry succeeds, return its result; if the retry 401s again, fail
   through as expiration.
5. If refresh fails, the session is expired: clear auth state
   (`authSlice`), redirect to `/login` (§41.5), and fail the
   original request without a toast.
6. **401s are never toasted** — expiry is a silent redirect flow
   (§12.11-2, §9.6). Only non-401 errors surface as toasts (§42.4).

Concurrency rule: if several requests 401 concurrently, the refresh
is dispatched once and the queued requests resume on its resolution;
a second refresh never starts while one is in flight. The refresh
call itself never triggers another refresh (step 3).

### 42.4 Envelope unwrap & error normalization

- **Success:** the envelope `{ success, message, data }` (§5) is
  unwrapped in the network layer — page-level hooks and components
  receive `data` (or the paginated `data.docs` surface of §27)
  directly; the wrapper never leaks `success`/`message` into page
  state (§12.6).
- **Errors:** every non-401 error is normalized into the toast-ready
  shape consumed by §60: `{ message, fieldErrors }` where `message`
  is the server-provided plain end-user language (§27, §12.5 —
  technical terms and provider names never reach the client) and
  `fieldErrors` (only for 422 responses) maps field names to their
  validation messages. The normalized shape is keyed by
  `error.data` per the §27 envelope; if `fieldErrors` is empty, the
  toast carries `message` alone (§9.6, §12.11-2).
- **Never `setError`:** page forms do not receive server errors
  through react-hook-form `setError`; the 422 field-error surface
  routes through the same toast protocol (§60) per §9.6. `setError`
  remains reserved for client-side rule failures authored in the
  page sections (§48–§57).
- Internals — the technical cause, the provider names, the stack
  trace — stay in the network layer's logging surface (development
  only, §12.5); the client log never prints cookies, tokens, or
  transcription/report text (§9.5).

### 42.5 Timeouts, abort & request lifecycle

- The browser's native `fetch` timeout semantics apply; §42 defines
  no custom timeout constant (§11 unchanged). A hung request is
  surfaced by the RTK Query lifecycle (pending → error) through the
  §60 error state of the calling section — never by a page timeout
  heuristic.
- Requests are bound to their RTK Query lifecycle: navigation away
  from a page unsubscribes its listeners and aborts in-flight
  queries through the standard RTK Query mechanism; no page-level
  abort code exists (§41.6).
- Uploads (multipart `clips`, §53) and long-running pipeline calls
  (generation, §52; correction, §54; STT-triggering actions) use the
  same descriptor with `formData` where the §30–§36 contracts demand,
  keeping `credentials: 'include'` throughout.

### 42.6 Endpoint registration & tags

- **Registration contract.** Domain endpoint sets are injected by
  their consuming section (§50–§59) with RTK Query `injectEndpoints`;
  each set declares its `providesTags`/`invalidatesTags` pairs, and
  the tag families are the five domain families of §41.6 (`Reports`,
  `Branches`, `Audio`, `Transcription`, `Conversation`, `Me`).
  Mutations that close a wizard step or a page action invalidate the
  families they change — the detailed pairs are pinned by the owning
  page sections, never invented here.
- **Auth surface.** The client calls exactly the §28 endpoints:
  login, logout, refresh, the current-user read consumed by
  `authSlice`/guards (§41.5), and the profile update surface (§57).
  None of these shapes are defined here; §42 references the §28
  contract and records that 401 handling follows §42.3.

### 42.7 Verification usage

- Grep gates: `fetch(`/`axios` appear only in `features/apiSlice.js`
  (none anywhere else in `src/`); `setError` appears only for
  client-side rule failures in the form-owning sections; no toast
  text is a technical term; 401 paths never toast; `_id` keys only
  (§12.11-3); no timeout constant, no new tag family beyond §41.6.
- Cross-section checks: mirrors §12.7 (reauth owner), §12.11-2/7
  (toast and plain-language rules), §9.6 (form rules), §5/§27
  (envelope), §28/§30–§39 (endpoint contracts consumed, never
  invented), §60 (state protocol).
- §42 introduces no constant, no path, and no package; it is
  standalone — it references only specification sections.

---

## 43. Design & Theme System

### 43.1 Purpose & scope

§43 owns the design system's definition — `AppTheme.jsx` and
`themePrimitives.js` (§15.5), the design language of the product,
the typography contract including Ethiopic text (§12.6 "the theme
supports Ethiopic text"), the light/dark color schemes, and the
date-display conventions (ADR-011, ADR-032). It does **not** own:
the per-component style overrides (inputs, dataGrid, charts, …, §44),
the breakpoint mechanics (§45), or the reusable component contracts
(§46).

The design language is normative: every page section (§48–§59)
derives its colors, type, spacing, and motif treatment from here and
from the §44 customization contract — never from ad-hoc values
(§9.6, SC-6: no magic values).

### 43.2 Design language (normative)

**Grounding.** The product is the daily supervision report of a
restaurant-chain area supervisor in Addis Ababa (§1.1, §3.3.1): the
supervisor speaks Amharic, the boss reads the finished report, and
the report's most characteristic artifact is the fixed eight-line
Amharic header (ቀን / ብራንች / ስም / ሰዓት …, §6.3). The design language
is therefore "**regulatory paper with a dictation desk**": flat,
paper-white surfaces with hairline rules, an English chrome that
stays quiet, and the report's own header as the one repeated
identity motif.

**Palette (committed scales).** The palette is the scaffold's
committed token set (§44 applies it mode-aware; components never
import primitives directly). Semantic roles (normative):

- Brand blue — interactive elements, selection, focus (`brand`
  scale, §44.1).
- Paper neutrals — page background (light: `hsl(0, 0%, 99%)`;
  dark: `gray[900]`) and surface (`hsl(220, 35%, 97%)` light /
  `hsl(220, 30%, 7%)` dark), text `gray[800]`/`gray[600]` (light)
  and `white`/`gray[400]` (dark), dividers at 40–60% alpha.
- Orange/amber — **reserved for audio** (recording states, timing,
  warning surfaces; `warning` role) and never used as a brand
  accent (§44.4).
- Green/red — success/error roles only (§44.4).
- Status colors follow the §46.13 `MuiStatusBadge` binding (draft →
  default, audio_attached → warning, transcribed → info, reviewed →
  primary, completed → success) — derived from the role palette,
  never new colors.

**Type roles (normative).**

- Chrome (shell, navigation, labels, buttons, validation messages,
  helper text, table headers): **Inter** 300–700 (§13.4
  `@fontsource/inter`).
- Content (report body, transcription text, chat messages — the
  §7.6 content surfaces): **Noto Serif Ethiopic** — the planned
  `@fontsource/noto-serif-ethiopic` dependency of §13.5, installed
  at the §66 theme phase; Latin runs inside content keep the Inter
  stack, Amharic runs render through the Ethiopic face (see the
  §43.5 stack rule).
- Captions and data (metadata, timestamps, badges): Inter 12px,
  `text.secondary`.

**Layout concept.** Flat paper surfaces (border-only cards, no
shadow, §44.6), hairline dividers, a single-document content spine
on md+ (details, wizard, report views) and stacked cards on xs–sm;
the app-bar and sidebar are the only fixed chrome (§47). The
"header strip" motif — a hairline rule above a small-caps eyebrow
and a title — is the standard page-header treatment (§46.12) and
mirrors the report's own line structure without imitating its
Amharic labels (§7.6 — chrome copy is English).

**Signature element (normative).** The Landing page hero (§48.2)
renders the *report-header motif*: the eight-line Amharic header of
§6.3, typeset in the Ethiopic content face over a hairline-ruled
paper panel, with a single restrained animation — a low-opacity
waveform line traced once across the ስም line ("the spoken report")
that obeys `prefers-reduced-motion` (§45.7). This is the only
decorative motion in the product; every other transition in §44–§59
is a MUI default or an explicit functional micro-interaction.
**Uniqueness rationale:** the brief's committed tokens (blue,
paper, Inter, light-first) rule out the common warm-cream/serif and
near-black/accent templates; the Ethiopic header ties the identity
to the subject's own artifact rather than to a decorative trope —
no Ge'ez ornament, no RTL, no invented Ethiopian styling beyond the
product's own header (§7.6, ADR-011).

### 43.3 Theme definition (`AppTheme.jsx`)

`AppTheme.jsx` composes the MUI theme exactly once (a `useMemo`
over an empty dependency array) and exports the provider component:

- `createTheme` with `cssVariables: { colorSchemeSelector:
  'data-mui-color-scheme', cssVarPrefix: 'template' }` — the CSS
  variable identity of the scaffold; the `--template-*` variables
  are the only CSS variables consumed in `sx` overrides (§44).
- `colorSchemes` — the light and dark schemes of §43.4, switched at
  runtime via `data-mui-color-scheme` (the theme toggle, §47).
- `typography` — the committed Inter scale (h1 48/600, letterSpacing
  −0.5; h2 36/600; h3 30/600; h4 24/600; h5 20/600; h6 18/600;
  subtitle1 18; subtitle2 14/500; body1 14; body2 14/400; caption
  12) plus the content-stack addition of §43.5; customizations may
  refine weights, never the roles.
- `shape: { borderRadius: 8 }` and the shadow ramp (baseShadow at
  index 1, §44.6) — the committed geometry.
- `components` — the spread of the eight `customizations/*` files
  (§44).
- `ThemeProvider` with `disableTransitionOnChange` (scaffold
  contract) and children rendering — mounted once in `App.jsx`
  (§41.4).

No page or component creates a second theme, calls `createTheme`, or
imports `themePrimitives.js` directly (§44.1, §9.6).

### 43.4 Light & dark schemes

Both schemes are authored by the color roles of §43.2 and the
scaffold scales; the page sections reference roles only.

| Role | Light | Dark |
|---|---|---|
| `primary.main` | brand[400] `hsl(210, 98%, 48%)` | brand[400] |
| `background.default` | `hsl(0, 0%, 99%)` | gray[900] |
| `background.paper` | `hsl(220, 35%, 97%)` | `hsl(220, 30%, 7%)` |
| `text.primary` | gray[800] | `hsl(0, 0%, 100%)` |
| `text.secondary` | gray[600] | gray[400] |
| `divider` | alpha(gray[300], 0.4) | alpha(gray[700], 0.6) |
| `error`/`warning`/`success` | red/orange/green scales (§13.4→§44.4) | dark variants per §44.4 |
| shadows/baseShadow | `hsla(220, 30%, 5%, 0.07) 0px 4px 16px 0px` + `hsla(220, 25%, 10%, 0.07) 0px 8px 16px -5px` | gray-based equivalent |

- The toggle between schemes is the §47 theme toggle; the browser's
  `prefers-color-scheme` seeds the initial scheme through MUI's
  color-scheme resolution (scaffold behavior, §44.1).
- Text and icons always resolve through roles (`text.primary`,
  `background.paper`, `grey.500`) — raw `gray[N]`/`brand[N]` value
  literals never appear in page `sx` (§44.1).

### 43.5 Typography & Ethiopic text

- **Chrome stack.** `fontFamily: "Inter, sans-serif"`; Inter weights
  300/400/500/600/700 loaded by `@fontsource/inter` in `main.jsx`
  (§41.3). Counters, times, and dates render in Inter with `font-
  variant-numeric: tabular-nums` where the surface aligns figures
  (tables, §50; visits grid, §51; times, §52/§53).
- **Content stack (normative).** Content surfaces (report body
  §51, transcription review §54, chat §55) set the family
  `'Noto Serif Ethiopic', 'Inter', sans-serif`; Latin words inside
  Amharic content render through Inter within the same stack — the
  Ethiopic face is used for Ethiopic-script runs, the pair never
  doubles Latin weights. The face is the §13.5 planned dependency,
  installed at the §66 theme phase; until installed, content
  surfaces fall back through the Inter stack (the §13.5 rule: no
  section assumes an uninstalled package's behavior before its
  phase).
- **PDF embedding** is an export concern of §58 (an Ethiopic-aware
  face embedded client-side), distinct from this screen-face
  contract.
- Display surfaces (page titles, the §48.2 hero header) use the
  Inter `h1`–`h3` scale — the Ethiopic face is a content face, not
  a display face, except the hero's report-header reproduction
  (§48.2).

### 43.6 Date & time display conventions

- Ethiopian dates display in **numeric notation only** —
  `DD-MM-YY` ("25-02-18") — with English day/month names (ADR-011,
  ADR-032, §6.5, §7.6); Ethiopian month names and Latin-letter
  Amharic words never appear in chrome (§7.6).
- The 13-month Ethiopian calendar (Meskerem … Pagume) maps to
  English month names for chrome labels; Pagume renders as
  "Pagume" in the MuiDatePicker header and never as a Gregorian
  equivalent (§46.6, §6.5).
- Times display as 24-hour `HH:mm`, zero-padded (§6.5).
- `dayjs` is the date library (§13.4); `ethiopianDate.js` (§46.6)
  is the only conversion surface — pages never inline Ethiopian↔
  Gregorian math.

### 43.7 Scaffold assets & migration

- `src/assets/hero.png` and the starter art (§15.5) are scaffold
  placeholders: the §48.2 landing signature supersedes their visual
  role; the files remain served assets until the implementing
  phase removes them (§15.7, §66). No other asset is added by §43.
- `public/favicon.svg` remains the scaffold favicon (§15.5); a
  favicon refresh, if any, is a §66 phase decision — never invoked
  by a page section.

### 43.8 Verification usage

- Grep gates: no `createTheme` outside `AppTheme.jsx`; no
  `themePrimitives` import outside `theme/*`; no `brand[`/`gray[`/
  `hsl(` literals in page or component code outside `theme/` and
  §44's customization files; no Ethiopian month-name words in
  chrome copy; `DD-MM-YY` everywhere dates appear; times `HH:mm`.
- Cross-section checks: mirrors §12.6 (theme + Ethiopic support),
  §13.4/§13.5 (Inter present; Ethiopic face planned), §7.6/§7.9
  (language boundary), §15.5 (theme tree), §46 (component
  contracts), §48.2 (hero signature), §58 (PDF face) and §14.3
  (ADR-011/032/038).
- §43 introduces no constant (§11 unchanged — the design tokens
  live in the scaffold `themePrimitives.js`), no path outside §15.5,
  and registers exactly one planned package in §13.5
  (`@fontsource/noto-serif-ethiopic`); it is standalone — it
  references only specification sections.

---

## 44. Theme & Component Customizations

### 44.1 Purpose & scope

§44 owns the eight scaffold customization files under
`client/src/theme/customizations/` (§15.5: `inputs`, `dataDisplay`,
`feedback`, `navigation`, `surfaces`, `dataGrid`, `datePickers`,
`charts`, re-exported by `index.js`). It converts their existing
override sets into **binding contracts**: the behavior below is what
the files implement, and the page sections (§48–§59) and the
reusable library (§46) build on these contracts — never on new
inline overrides.

**Rules (normative, extend §43.3).**

- All theme configuration lives under `theme/`; components and pages
  define no inline theme override (§9.6). A new override is added by
  extending the owning customization file, re-exported through
  `index.js`, and documented here (§15.7).
- `AppTheme.jsx` spreads the eight customization objects into
  `createTheme.components` (§43.3); the spread order is the §44
  contract.
- Components never import `themePrimitives.js` directly (§43.3,
  §9.6); `sx` uses mode-aware tokens only (`text.primary`,
  `background.paper`, `grey.500`, `error.main`, …) — never raw
  `brand[N]`/`gray[N]` literals (§43.4).
- Component customization applies to both schemes via MUI
  `colorSchemes`/`applyStyles` so every override is mode-aware
  (§43.4).

### 44.2 Inputs (`inputs.js`)

- `MuiButtonBase`: ripple disabled; minimum touch target 44px on
  viewports below 600px (§45.6); focus outlines use
  `alpha(primary.main, 0.5)` 3px (keyboard-focus floor, §45.7).
- `MuiButton`: sizes small 2.25rem / medium 2.5rem; `contained`
  primary renders as the **near-black** gradient (gray[900] →
  gray[800], white text) — the committed "ink" primary; `contained`
  secondary renders the brand gradient; `outlined`/`text` per the
  role palette (§43.2); `textTransform: none`.
- `MuiIconButton`: 2.25rem/2.5rem squares; icon color via `sx` —
  never the `color` prop of `MuiDataGrid` action icons (§46.8).
- `MuiToggleButton`/`MuiToggleButtonGroup`: the list/grid and
  filter toggles of §50.
- `MuiCheckbox`: rounded custom icons, brand[500] checked, fitted
  to form rows (§46.2).
- `MuiOutlinedInput`/`MuiInputBase`: 8px × 12px padding; `height`
  variants for single-line and search; `notchedOutline` = divider;
  focus border brand[400]; autofill fix via the `--template-*`
  variables.
- `MuiInputAdornment`: the standard adornment slot (§46.2 — every
  text input carries a start adornment).
- `MuiFormLabel`: caption size, 8px bottom margin above the field —
  the field-label contract of the form sections.

### 44.3 Data display (`dataDisplay.js`)

- `MuiList`/`MuiListItem`: padding and 1rem icons; `ListItemIcon`
  `minWidth: 0`; `ListSubheader` per section grouping; selected
  states per the §47 sidebar contract.
- `MuiChip`: default `size="small"`, 999px pill radius, `maxHeight:
  20`; color variants through the status roles (§46.13 status badge
  and the §52/§54 per-clip status chips use the same chip contract).
- `MuiTablePagination`: the pagination footer contract, consumed by
  MuiPagination/MuiDataGrid (§46.7/§46.8).
- `MuiIcon`: tone via the role palette; size per the icon-only rule
  (§45.5).

### 44.4 Feedback (`feedback.js`)

- `MuiAlert`: borderRadius 10; warning styling orange[100]
  background / orange[500] icon (the §60 toast and inline-alert
  surfaces); `error`/`success` variants through their roles.
- `MuiDialog`: paper radius 10; divider between sections —
  consumed by MuiDialog/MuiConfirmDialog (§46).
- `MuiLinearProgress`: height 8, radius 8 — the determinate
  pipeline progress of §52/§53/§54 (limited to functional
  surfaces; §43.2's one-animation rule).

### 44.5 Navigation (`navigation.js`)

- `MuiMenu`/`MuiMenuItem`: white paper in light / dark surface in
  dark, `baseShadow` elevation — the dropdown contract of §46.5.
- `MuiSelect`: `UnfoldMoreRounded` indicator, bordered field,
  hidden native `:before/:after` — the field look, not the native
  select look (§46.5).
- `MuiLink`: `underline: none` with the animated `::before` hover —
  links in auth pages (§48) and inline text; focus visible (§45.7).
- `MuiDrawer`: the sidebar/overlay drawer styling of §47.
- `MuiPaginationItem`: page buttons of the pagination contract
  (§46.7).
- `MuiTabs`/`MuiTab`: tab surfaces (wizard steps §52; per-visit
  tabs §52.4); also the base of `MuiStepConnector`/`MuiStepIcon`/
  `MuiStepLabel` — the custom 12px dot stepper of the wizard
  (§46.17 MuiStepper).

### 44.6 Surfaces (`surfaces.js`)

- `MuiAccordion`: elevation 0, disableGutters — the global-search
  result groups (§59).
- `MuiPaper`: elevation 0 default — the paper-desk language
  (§43.2).
- `MuiCard`: padding 16, gray[50] background (light) / gray[800]
  (dark), divider border, **no box-shadow**; `outlined` variant on
  white paper — the report cards of §50 and the KPI cards of §49.
- `MuiCardContent`/`MuiCardHeader`/`MuiCardActions`: zero padding
  (the card owns spacing) — the composition contract for card
  bodies and action rows.
- Shadows: `baseShadow` at index 1 only — elevation appears on
  overlays (menus, dialogs, drawers), never on static surfaces.

### 44.7 DataGrid (`dataGrid.js`)

- `MuiDataGrid`: overlay loaded with the custom no-rows overlay
  (min-height 300px); column-header and footer on `background.paper`;
  cell borders = divider; row hover/selected roles; the
  `iconButtonContainer`/`menuIconButton` action-column styling and
  the filter-form and columns-management chrome — the whole
  MuiDataGrid contract of §46.8 (server pagination, checkbox
  selection, GridToolbar).

### 44.8 Date pickers (`datePickers.js`)

- `MuiPickerPopper` (desktop popper) and picker dialogs (mobile):
  paper surface; `PickerArrowSwitcher`/`CalendarHeader`/
  `MonthCalendar`/`YearCalendar` spacing; `MuiPickersDay` selected =
  gray[700] with brand focus rings — the MuiDatePicker look of
  §46.6, including the Ethiopian calendar headers (Pagume label,
  §43.6).

### 44.9 Charts (`charts.js`)

- `MuiChartsAxis`: gray[300] lines / gray[500] labels; tooltip and
  legend through the paper surface; `MuiChartsGrid`: dashed grid
  `4 2`, width 0.8 — the dashboard chart contract of §49
  (@mui/x-charts, §13.4).

### 44.10 Verification usage

- Grep gates: no `sx`/`styled` theme override outside the eight
  customization files and `AppTheme.jsx`; no `themePrimitives`
  import outside `theme/*`; no raw `brand[`/`gray[` literal in page
  or component code (§43.4); every override mode-aware.
- Cross-section checks: mirrors §43 (roles and schemes), §15.5
  (files and indices), §46 (components consuming each contract),
  §47–§59 (surfaces built on this section).
- §44 introduces no constant (§11 unchanged), no path, and no
  package; it is standalone — it references only specification
  sections.

---

## 45. Responsive System

### 45.1 Purpose & scope

§45 owns the responsive behavior shared by the whole Part D: the
breakpoint buckets every page and component must state, the
icon-only and overflow rules (§12.6), the fixed-chrome layout
skeleton, the dialog/popover mode rules, touch targets, and the
accessibility floor (keyboard focus, reduced motion). The page
sections (§48–§59) author their **per-page** breakpoint matrices on
top of these rules — §45 never describes a single page's layout.

- **Owned here (normative).** Buckets and their semantics (§45.2);
  the icon-only rule (§45.3); the viewport skeleton (§45.4); text
  overflow and ellipsis (§45.5); dialog/popover modes (§45.6);
  touch targets and landscape (§45.7); focus and reduced motion
  (§45.8).
- **Owned elsewhere.** The `MuiDialog` fullscreen props = §46; the
  sidebar drawer modes = §47; per-page matrices = §48–§59.

### 45.2 Breakpoint buckets (normative, spec-wide)

Every page matrix, component rule, and responsive statement uses
exactly these five buckets — the MUI theme breakpoints with the
1200–1535 range split into two authoring buckets:

| Bucket | Width | MUI semantics |
|---|---|---|
| xs | < 600px | `theme.breakpoints.down('sm')` |
| sm | 600–899px | `up('sm')` below `up('md')` |
| md | 900–1199px | `up('md')` below `up('lg')` |
| lg | 1200–1535px | `up('lg')` below `up('xl')` |
| lg+ | ≥ 1536px | `up('xl')` |

Responsive logic uses MUI breakpoint props in `sx` (`xs`/`sm`/`md`/
`lg`/`xl` Grid sizes, `display: { xs: 'none', md: 'flex' }`, …) and
`useMediaQuery(theme.breakpoints.up('md'))` where a JS decision is
required (drawer mode §47, picker mode §46.6). Inline pixel
guesses — other than the bucket bounds above — are forbidden
(§9.6, SC-6).

### 45.3 Icon-only rule

Per §12.6: an element bigger than an icon is always accompanied by
its label at **xs and sm**, and at **md and above in landscape
below 768px** where the rule applies (app-info contract, §9.6). A
label may hide only:

- below 600px (portrait): full labels may collapse to icons with
  `MuiTooltip` text on hover for **chrome actions** (app-bar
  actions, grid action columns — §46.8/§47), never for primary
  content controls (submit, accept, record) which keep
  icon + text full-width per the §46.2 button contract.

The page matrices state which controls hide labels when.

### 45.4 Viewport skeleton

- Layout containers use the scaffold `layoutConfig` measures:
  `drawerWidth: 240`, `headerHeight: 64`, `mobileBreakpoint: 'md'`
  (§43.3, §47).
- **The 100vh rule:** all layouts wrap in
  `height: 100vh; overflow: hidden`; chrome (PublicLayout app-bar
  or AppShell sidebar + app-bar) is fixed; content areas use
  `overflow-y: auto`; the `body`/`html` elements are never
  scrollable (§47.2/§47.3).
- Content never overflows its column at any bucket (§45.5); the
  sidebar modes are §47.

### 45.5 Text overflow & ellipsis

- All text must ellipsize after the owning surface's cap: page
  titles, report titles, branch names, grid cells, and list rows
  use `text-overflow: ellipsis; white-space: nowrap; overflow:
  hidden` (single-line) or `-webkit-line-clamp` (multi-line, cap 2)
  at their responsive widths.
- Text never overlaps or wraps mid-word in stacked layouts; a field
  or cell that cannot fit at its bucket renders the ellipsized form
  of §45.5 — never horizontal scrolling of the surface.
- Icon button rows (grid actions, app-bar actions) shrink by icon
  count rules (§45.3) before they overflow.

### 45.6 Dialog & popover modes

- `MuiDialog` renders fullscreen when `down('sm')` **or**
  (`down('md')` + landscape) — the §46.3 responsive contract.
- Menu/popovers (`MuiSelect` dropdown, avatar menu, export menu)
  render as anchored popovers above 600px and as bottom sheets or
  full-width lists below 600px per the §46 contracts.
- The GlobalSearchDialog follows its own size matrix (§46.15/§59).

### 45.7 Touch targets & landscape

- Interactive elements enforce the 44px minimum touch target on
  viewports below 600px (§44.2); on larger viewports the §44 sizes
  apply.
- Below 768px in landscape, controls follow the icon-only rule
  (§45.3) and two-action rows keep both actions fully tappable
  (44px) even when labels collapse.

### 45.8 Focus & reduced motion

- Keyboard focus is always visible: the §44.2 3px focus outline on
  interactive elements, and the CSS `:focus-visible` emphasis — no
  focus surface may be invisible (`outline: none` without a
  replacement) (§44, §43.2).
- `@media (prefers-reduced-motion: reduce)`: the §43.2 signature
  animation and every decorative transition are disabled; functional
  feedback (spinners, progress bars) remains. The §53 recorder
  keeps its live timer; the §43.2 waveform renders statically.

### 45.9 Verification usage

- Grep gates: no viewport literals other than the §45.2 bounds; no
  `outline: 0`/`outline: none` without a focus replacement; no
  `overflow-x` on page-level wrappers (§45.4/§45.5); the
  five buckets appear in every page matrix.
- Cross-section checks: mirrors §12.6 (icons/overflow owners),
  §43.2/§44.2 (roles and focus), §46.3/§46.15 (dialog modes), §47
  (drawer modes), §48–§59 (page matrices).
- §45 introduces no constant (§11 unchanged), no path, and no
  package; it is standalone — it references only specification
  sections.

---

## 46. MUI Reusable Component Library

### 46.1 Purpose & scope

§46 owns the reusable `Mui*` component library —
`components/reusable/`, one PascalCase file per component (§15.5,
§15.2, §9.3: `MuiButton.jsx`, `MuiTextField.jsx`, …). Every
locally-authored UI surface in §47–§59 composes these components —
raw `@mui/material` widgets appear only inside this library
(§9.6, §12.6). The library is the only place a component's public
API is defined; pages never re-skin MUI components.

Each contract below states: file, purpose, props table (defaults
in bold), states, and responsive behavior. Forms bind through the
§46.2 patterns; the page sections cite these contracts by §46.x.

### 46.2 Library conventions (normative)

- **Props tables.** Every component lists its props with types and
  defaults in the contract below; unlisted MUI props pass through
  unless listed as fixed.
- **Loading.** Buttons use MUI's native `loading` prop — spinner
  (20px `CircularProgress`), `loadingPosition`, disabled while
  loading — never a local spinner state (§9.6).
- **Icons.** Icon colors via `sx` (`sx={{ color: 'primary.main'
  }}`), never the `color` prop on icon-bearing action controls
  (§44.2).
- **Imports.** Tree-shaken single imports (`import TextField from
  '@mui/material/TextField'`) — never the `@mui/material` barrel
  (§9.6, app-info contract); `Grid` uses the `size` prop, never
  `item`; deprecated props are never used (`margin="normal"` →
  `sx={{ mb: 2 }}`; `InputProps` → `slotProps.input`; `Link
  component="button"` → `Link slots={{ root: 'button' }}`).
- **Forms (react-hook-form).** All forms use `useForm({
  mode: 'onBlur' })` with `register` by default; `Controller` is
  used only for pickers whose value arrives via custom `onChange`
  (MuiDatePicker, MuiTimePicker) with a justification comment;
  cross-field validation uses `validate` with `getValues`
  (never `watch`); field errors render through the MUI `error` and
  `helperText` props; submission wraps `handleSubmit(onSubmit)` in
  try/catch and calls `reset()` on success (§9.6).
- **Adornments.** Every text input carries a start adornment
  (§44.2).
- **Themes & fonts.** Thematic: chrome Inter, content Ethiopic per
  §43.5; no inline `style` anywhere; `sx`/`styled` only (§9.6).

### 46.3 MuiButton

- **File:** `components/reusable/MuiButton.jsx`.
- **Purpose:** the single button; composed by every surface.
- **Props:** `variant` (`contained`/`outlined`/`text`), `color`
  (default `primary`), `size` (**small**), `loading`
  (**false**), `loadingPosition` (**center**), `startIcon`,
  `endIcon`, `fullWidth`, `disabled`, `children`, `onClick`, `sx`,
  `type`; icon-only buttons stay raw `@mui/material/IconButton`
  (never MuiButton) (§44.2).
- **States:** default / hover / focus-visible (§45.8) / pressed /
  disabled / loading (spinner replaces the label per
  `loadingPosition`). Submit buttons: `size="small"`,
  `flexShrink: 0` — **never shrink on flex** (§9.6).
- **Responsive:** full-width inside forms at every bucket; the
  §45.3 icon-only rule applies to chrome buttons, never to primary
  form actions.

### 46.4 MuiTextField

- **File:** `components/reusable/MuiTextField.jsx`.
- **Purpose:** all text entry: single-line, multiline, and
  passwords (no separate password component — an internal eye
  toggle on `type="password"` via `useState`/`useCallback`,
  `onMouseDown` prevents focus loss, no layout shift when
  toggled; caller `slotProps.input.endAdornment` merges after the
  eye).
- **Props:** `label`, `placeholder`, `type` (**text**), `required`,
  `disabled`, `multiline`, `rows`/`maxRows`, `fullWidth`,
  `error` + `helperText` (validation surface), `startAdornment`,
  `slotProps`, `sx`, standard passthrough.
- **States:** empty / filled / focused / error (helperText shows
  the manual-resolver message) / disabled; `register` returns the
  input props; `helperText` space is reserved so error appearance
  never shifts the layout.
- **Responsive:** full-width in form columns at every bucket;
  multiline grows by row caps, never by page scroll (§45.5).

### 46.5 MuiSelect

- **File:** `components/reusable/MuiSelect.jsx`.
- **Purpose:** all dropdown selection (provider picker §54/§52,
  branch picker §52/§56, filters §50) — the bordered, arrowed
  field style of §44.5.
- **Props:** `options` (`{ value, label }[]`), `value`, `onChange`,
  `label`, `fullWidth`, `disabled`, `error`/`helperText`;
  `MenuProps={{ slotProps: { paper: { sx: { maxHeight: 300 } } }
  }}` — the fixed dropdown height.
- **States:** empty (label + placeholder), focused, error,
  disabled, open; empty-option behavior is the owning form's
  validation concern (§48–§57).

### 46.6 MuiDatePicker & `ethiopianDate.js`

- **Files:** `components/reusable/MuiDatePicker.jsx` and
  `utils/ethiopianDate.js` (§15.5).
- **Purpose:** the Ethiopian-calendar date picker with English
  day/month names (§43.6, ADR-011/ADR-032) — built on
  `@mui/x-date-pickers` community (no Pro features). When the
  section needs a time value, the same component file renders the
  matching `MuiTimePicker` behavior (24h `HH:mm`, §43.6).
- **Conversion contract** (`ethiopianDate.js`):
  `ethiopianToGregorian(ethDate) → JS Date` and
  `gregorianToEthiopian(jsDate) → { day, month, year }` — a
  lightweight local utility, no npm package (§13.4); 13-month
  structure (Meskerem … Pagume); Pagume renders as "Pagume" in
  chrome headers (§43.6); input/display value `DD-MM-YY` numeric.
- **Props:** `value`, `onChange` (value arrives via the picker's
  custom onChange — **`Controller` is required**, with a
  justification comment, §46.2), `label`, `views` (day/month/year
  per the owning form, §52.3/§50.3), `disabled`, `error`/
  `helperText`.
- **Responsive:** md+ (≥ 900px) renders `DesktopDatePicker`
  (popper mode); below 900px renders `MobileDatePicker` (dialog
  mode, fullscreen below 600px per §45.6).
- **States:** empty (placeholder `DD-MM-YY`), invalid input
  (error + helperText), focused, disabled; the §29 validators
  remain the server-side authority (this component is the client
  input surface only).

### 46.7 MuiPagination

- **File:** `components/reusable/MuiPagination.jsx`.
- **Purpose:** the pagination control for server-driven lists
  (Reports §50, Branches §56).
- **Props:** `page`, `count` (**= `totalPages` from the server —
  never computed client-side**, §27), `onChange`, `disabled`.
- **Contract:** page size comes from the owning list
  (`PAGINATION_DEFAULT_LIMIT` 10 / `PAGINATION_MAX_LIMIT` 100,
  §11.5); the grid's `MuiDataGrid` owns its own footer (§46.8).
- **Responsive:** compact page buttons below 600px (§44.5).

### 46.8 MuiDataGrid

- **File:** `components/reusable/MuiDataGrid.jsx`; domain columns
  live in `components/columns/*.js` — `reports.js` (§50),
  `branches.js` (§56).
- **Purpose:** every data table (Reports §50, Branches §56,
  analytics-owned surfaces §56).
- **Props/contract:** `columns` (from the domain column file),
  `rows`, `loading`, `rowCount` (**= server `totalDocs`**),
  `paginationMode="server"`, `page`, `pageSize`, `onPaginationModelChange`, `onRowClick`, `checkboxSelection` (**true**),
  `disableRowSelectionOnClick` (**true**), `onSelectionModelChange`,
  `slots` (toolbar override), `slotProps`, `sx` (default height
  400, overridable); `pageSizeOptions={[10, 25, 50, 100]}` — the
  §11.5 `PAGINATION_*` mirrors.
- **Toolbar:** `GridToolbar` (columns toggle, filter, density, CSV
  export of the **selected rows**) — the CSV export is the §58
  export surface of the lists.
- **Action column:** per domain — View (`VisibilityIcon`,
  `sx={{ color: 'primary.main' }}`, tooltip "View", navigates to
  `/${resource}/${_id}`), Edit (`EditIcon`, `sx={{ color:
  'warning.main' }}`, tooltip "Edit"), and Archive/Restore/Delete
  rendered conditionally by row state (§50, §56); icon colors via
  `sx` only (§44.2).
- **States:** loading (custom overlay), empty (custom
  `noRowsOverlay` — the §60 empty copy), error (toast, §60),
  success, selected rows bar.
- **Responsive:** columns hide by an explicit per-domain priority
  list below 900px (the §50/§56 matrices); action icons follow
  §45.3; horizontal scroll is never applied to the page (§45.5).

### 46.9 MuiConfirmDialog

- **File:** `components/reusable/MuiConfirmDialog.jsx`.
- **Purpose:** every destructive or irreversible confirmation
  (archive, restore, delete, session revoke, leave-with-unsaved).
- **Props:** `open`, `onClose`, `onConfirm`, `title`, `message`,
  `confirmText`, `cancelText`, `confirmColor` (**default
  `primary`**; `error` for delete actions).
- **Contract:** built on MuiDialog (§46.10); message is a full
  sentence in plain end-user language (§12.5) stating what will
  happen ("Are you sure you want to archive this report?");
  confirm runs the action and closes; Escape/backdrop close
  without acting.
- **Responsive:** fullscreen below 600px (§45.6).

### 46.10 MuiDialog

- **File:** `components/reusable/MuiDialog.jsx`.
- **Purpose:** the only dialog wrapper (§44.4); `MuiConfirmDialog`
  and `MuiDatePicker` mobile mode build on it; the search dialog is
  the one exception (§46.15, standalone).
- **Props:** `open`, `onClose`, `title`, `children`, `actions`,
  `maxWidth`, `fullWidth`, `disableEnforceFocus` (**true**),
  `disableRestoreFocus` (**true**).
- **Responsive:** fullscreen at `down('sm')` **or** `down('md')` +
  landscape (§45.6); otherwise centered paper with radius 10.

### 46.11 MuiAppbar

- **File:** `components/reusable/MuiAppbar.jsx`.
- **Purpose:** the single app-bar for PublicLayout (public
  variant, full-width, fixed) and AppShell (protected variant,
  64px, sits inside the content column beside the sidebar). Its
  section-level behaviors (which actions render, navigation)
  belong to §47.
- **Props:** `variant` (`public`/`protected`), `actions`
  (ReactNode slot), `sx`.
- **Responsive:** below 600px only icons + tooltips (§45.3); height
  64px constant (§45.4); avatar sizes 32px below 600px / 36px at
  and above 600px.

### 46.12 MuiPageHeader

- **File:** `components/reusable/MuiPageHeader.jsx`.
- **Purpose:** the standard page header — the §43.2 header-strip
  motif: eyebrow (small-caps, `text.secondary`) + title (h4) +
  optional subtitle; right-side `actions` slot; `mb: 2`; bottom
  border 1px solid divider.
- **Props:** `eyebrow`, `title`, `subtitle`, `actions`,
  `hideSubtitle` (auto: subtitle hidden below 600px portrait).
- **States:** default only — loading/empty/error belong to the
  page sections.

### 46.13 MuiStatusBadge

- **File:** `components/reusable/MuiStatusBadge.jsx`.
- **Purpose:** read-only presentation of `report.status` — a
  non-interactive, color-coded chip (no click, no pointer cursor).
- **Props:** `status` (**required**) — one of
  `REPORT_STATUSES` (§11.4): `draft` | `audio_attached` |
  `transcribed` | `reviewed` | `completed`.
- **Color mapping (normative):** `draft` → default; `audio_attached`
  → warning; `transcribed` → info; `reviewed` → primary;
  `completed` → success (§43.2).
- **Usage:** Report Details header (§51), Reports grid/list cells
  (§50), wizard step headers (§52).

### 46.14 LoadingSpinner

- **File:** `components/reusable/LoadingSpinner.jsx`.
- **Purpose:** centered `CircularProgress` for full-page or
  section-level loading.
- **Props:** `message` (optional, `text.secondary`), `minHeight`
  (**`100vh`** default; sections override, e.g. `400px`).
- **Usage:** guards §41.5, page loads §49–§59, dialog loads.

### 46.15 GlobalSearchDialog

- **File:** `components/reusable/GlobalSearchDialog.jsx` (UX in
  §59; standalone — does not use MuiDialog's actions slot).
- **Props:** `open`, `onClose`, `initialQuery`.
- **Behavior contract:** search field with start adornment
  (**`ArrowBackIcon`** — clears the field, resets results, closes
  the dialog); React Hook Form `register('search')`; search fires
  on Enter or on click of the action — **no debounce** (§9.6);
  results grouped by entity (Reports, Branches) in MuiAccordion
  sections; empty state "No results found"; loading state;
  fullscreen below 600px (and below 768px landscape, no border
  radius, 100vh); centered at 600–1200px (80vh / 600px) and above
  1200px (70vh / 720px); closes via back arrow, Escape, or click
  outside.
- **Data:** the §39 search endpoint via the §42 layer; archived
  entities hidden unless the search contract of §39 includes them.

### 46.16 MuiEditor (TipTap + DOMPurify)

- **File:** `components/reusable/MuiEditor.jsx` (planned deps
  `@tiptap/react` and `dompurify`, §13.5 — installed at the §66
  editor phase; until then no section may assume the editor's
  runtime, but its contract is fixed here).
- **Purpose:** the single rich-text editing surface for **report
  content** (§51, §52 Step 5) and **transcription review** (§54);
  also renders read-only content (the details-body viewer writes
  through the same sanitized surface).
- **Toolbar (fixed scope, ADR-038):** **Bold, Italic, Font size,
  Text color** — the §44-styled toolbar; no other toolbar actions
  exist in this scope.
- **Values:** HTML string in/out (TipTap document → HTML; §14.4);
  `dompurify` sanitizes on **write and on render**; rendering uses
  `dangerouslySetInnerHTML` only on already-sanitized input
  (§61); no JSON-document storage (§14.4).
- **OQ-007 (open, recorded):** whether the persisted
  `raw`/`latest` slots carry plain text or rich-text HTML is
  decided at the editor phase (§21.2 open item, §66); `MuiEditor`
  emits and consumes HTML either way — the slots stay `String`
  (§21.2) until that decision lands.
- **Ethiopic content:** the content stack of §43.5 renders through
  the editor; the toolbar labels are chrome (English, §7.6).
- **Props:** `value` (HTML), `onChange`, `readOnly`, `minHeight`,
  `id` (editor instance id for the form integration).
- **States:** empty (placeholder in report voice), focused,
  read-only, error (owning form's `helperText` surface).

### 46.17 New components (owned here)

Justified by their sections; the same contract discipline applies:

- **MuiAudioPlayer** (`components/reusable/MuiAudioPlayer.jsx`) —
  clip playback; drives §53 (recording review) and §54 (clip
  playback during review). Props: `audio` (**the metadata-only
  DTO of §22.7 — no `filePath` ever reaches the client**), URL
  via the §32 audio endpoint, `onEnded`; states loading/playing/
  paused/ended/error; the play button is the recorder's only
  interactive cue with icon-only labels below 600px (§45.3).
- **MuiStatCard** (`components/reusable/MuiStatCard.jsx`) — the
  Dashboard KPI card (§49): `label` (small-caps eyebrow), `value`
  (h3), `icon` (start adornment, role color), optional `trend`
  caption; plain card surface (§44.6).
- **MuiStepper** (`components/reusable/MuiStepper.jsx`) — the
  wizard step indicator (§52): the §44.5 dot style, step labels,
  `activeStep`, `onStepClick` (only to visited steps), completed
  check; responsive: step labels collapse to dots below 600px.

### 46.18 Verification usage

- Grep gates: raw `@mui/material/*` imports appear only inside
  `components/reusable/` (and `theme/customizations/`); pages import
  only `Mui*` components, layout, and domain components; no `style={}`
  anywhere; no `color` prop on icon controls (§44.2); every text
  input has a start adornment prop; `Controller` appears only where
  a justification comment exists (§46.2).
- Cross-section checks: mirrors §43/§44 (roles and overrides),
  §45 (responsive buckets), §47–§59 (usage), §14.3/§14.4
  (ADR-023/032/034/038, editor), §22.7/§32/§37 (DTO and file
  exposure rules), §61 (sanitization), §13.5/§13.7 (planned
  packages and their gates).
- §46 introduces no constant (§11 unchanged), no path beyond §15.5
  (`components/reusable/`, `components/columns/` already exist),
  and no package beyond the §13.5 planned set; it is standalone —
  it references only specification sections.

---

## 47. Layout System

### 47.1 Purpose & scope

§47 owns the three layout shells of `components/layout/` (§15.5) —
`PublicLayout`, `AppShell`, `AppSidebar` — their composition and
responsive behavior, and the wiring of `MuiAppbar` (§46.11) into
each. It does **not** own: the reusable bar itself (§46.11), the
header-strip treatment (§46.12, used per page), the guards
(§41.5), or any page content (§48–§59).

- **Owned here (normative).** PublicLayout structure and auth-aware
  actions (§47.2); AppShell composition and content column (§47.3);
  AppSidebar modes, nav items, and theming (§47.4); app-bar wiring,
  the theme toggle, the avatar menu, and the search trigger (§47.5);
  navigation and active-state rules (§47.6).
- **Owned elsewhere.** Guard redirects §41.5; search dialog behavior
  §59; dialogs fullscreen §45.6/§46.10; statuses/copy §7.6/§60.

### 47.2 PublicLayout

- **File:** `components/layout/PublicLayout.jsx`.
- **Purpose:** the root wrapper of the public branch (Landing,
  Login, Register, 404 — §41.3). No sidebar, no auth gating.
- **Structure (column flex):** 1) `MuiAppbar` `variant="public"`
  (fixed, full-width; logo → `/`; right-aligned actions: theme
  toggle (LightMode/DarkMode icon buttons), and — auth-aware via
  `authSlice` — "Log in" (text) and "Sign up" (contained, §46.3)
  when unauthenticated, or a Logout icon button (with `MuiTooltip`
  "Logout") when authenticated); 2) `<Outlet/>` — scrollable
  content (`overflow-y: auto`); the outer wrapper applies
  `height: 100vh; overflow: hidden` (§45.4).
- **Responsive:** below 600px the bar actions collapse to
  icons/tooltips (§45.3); the content area scrolls independently.

### 47.3 AppShell

- **File:** `components/layout/AppShell.jsx`.
- **Purpose:** the protected root wrapper; one layout for all
  authenticated pages (§41.3).
- **Structure (horizontal flex):** left `AppSidebar` (§47.4);
  right content column (column flex): 1) `MuiAppbar`
  `variant="protected"` (64px, sits **inside** the content column —
  never spanning the sidebar; right-aligned: search icon button
  (opens `GlobalSearchDialog`, §46.15/§59), theme toggle, avatar —
  see §47.5; **no title text, no hamburger** — the hamburger lives
  in the sidebar header); 2) the page header, rendered by each page
  (§46.12 — not a reusable view here); 3) `<Outlet/>` — scrollable
  (`overflow-y: auto`). Outer wrapper: `height: 100vh;
  overflow: hidden` (§45.4).
- **Responsive:** the content column resizes to the sidebar mode
  (§47.4); on xs/sm the sidebar is an overlay (§47.4).

### 47.4 AppSidebar

- **File:** `components/layout/AppSidebar.jsx`.
- **Props:** `open` (boolean), `onClose` (function), `sidebarMode`
  (`'full'` | `'mini'`), `onToggle` (function).
- **Header:** menu icon + logo + app name (**"Report Builder"** —
  `VITE_APP_NAME`, §10.5). The menu icon toggles full/mini on the
  permanent drawer (md+); on xs/sm the menu icon opens the
  temporary overlay.
- **Nav items** (top, `flexGrow: 1`): **Dashboard, Reports,
  Branches, Profile** — each a `MuiListItemButton` with icon +
  label and a link to its route (§41.3). Bottom: `MuiDivider` +
  **Logout** (`MuiListItemButton`, icon + label; hover styled via
  `error.main` tint, §44.2/§47.6).
- **Theming (normative, §44):** default `backgroundColor:
  transparent`, `color: text.secondary`; hover `backgroundColor:
  action.hover`, radius 8; **selected**: `backgroundColor: primary.main
  + 0.08`, `color: primary.main`, `fontWeight: 600`, `borderLeft:
  3px solid primary.main`; icon selected `color: primary.main`,
  otherwise `color: action.active`; Logout hover:
  `backgroundColor: error.main + 0.08`, `color: error.main`.
- **Responsive (normative):**
  - xs (< 600px) and sm (600–899px): **temporary overlay** drawer
    (240px) — opens via the sidebar-header menu icon, closes on
    backdrop click, nav selection, or Escape (§45.6/§46.10).
  - md+ (≥ 900px) default: **permanent docked** drawer (240px),
    full icon + text.
  - md+ after toggle: **permanent mini** drawer (64px), icons only;
    labels via `MuiTooltip` on hover; header shows the menu icon
    only.
  - The mini/full mode is `sidebarMode` state held by the shell
    (§47.3); `MuiDrawer` per §44.5.

### 47.5 App-bar wiring (protected variant)

- **Search icon** — `IconButton` (icon + tooltip "Search"), opens
  `GlobalSearchDialog` (§46.15; UX §59).
- **Theme toggle** — LightMode/DarkMode icon buttons switching the
  §43.4 color scheme (MUI `colorSchemes` via `data-mui-color-scheme`).
- **Avatar dropdown** — the user avatar button (sizes 32px below
  600px, 36px at and above 600px) opens a `Menu` with **Profile**
  (`/profile`, §57) and **Logout** (runs the §42/§28 logout, then
  `<Navigate to="/login">`).
- The logo navigates to `/dashboard` when authenticated, else `/`
  (§41.5, decision 10; in the protected bar the logo sits in the
  sidebar header, §47.4).

### 47.6 Navigation & active-state rules

- Nav marking follows the active route: exact match on the four
  nav paths (Dashboard, Reports, Branches, Profile); the wizard
  (`/reports/new`) and details (`/reports/:reportId`) do **not**
  mark the Reports nav item as selected (page-context rule),
  unless the section chooses a different rule explicitly.
- `useNavigate` is the only navigation mechanism for actions;
  `Link` is used for nav items and inline links (§44.5).
- Logout clears the `authSlice` state **after** the §28 logout
  call succeeds; a failing logout still clears local state and
  navigates (§42 handles refresh/expiry independently).

### 47.7 Verification usage

- Grep gates: the four nav items and their paths match §47.4
  verbatim; no second app-bar/title inside `AppShell` content; the
  `100vh` wrapper and `overflow-y: auto` patterns appear in both
  shells (§45.4); no hamburger in the protected app-bar.
- Cross-section checks: mirrors §12.6/§12.7 (shell and auth),
  §44.5/§44.2 (drawer/button styles), §45 (buckets and drawer
  modes), §46.11/§46.15 (bar and search contracts), §41.3/§41.5
  (routes and guards), §59 (search UX).
- §47 introduces no constant (§11 unchanged — "Report Builder"
  is `VITE_APP_NAME`, §10.5), no path, and no package; it is
  standalone — it references only specification sections.
