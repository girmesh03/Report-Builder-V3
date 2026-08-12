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
>
> **Implementation protocol:** this document is implemented by an agent
> executing the §66 phase protocol (§66.2) in the §66.5 protocol chain,
> using the workspace agent skills — the *frontend-design* skill (UI
> practice, §66.4) and the *planning-with-files* skill (working-files
> practice, §66.3) — and any skills added to that set.

## Table of Contents

Authored top sections (each heading links to its section):

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
- [26. Backend Foundation](#26-backend-foundation)
- [27. Global Backend Concerns](#27-global-backend-concerns)
- [28. Authentication & User Domain](#28-authentication--user-domain)
- [29. Validators](#29-validators)
- [30. Branch API](#30-branch-api)
- [31. Report & Status API](#31-report--status-api)
- [32. Audio Upload & Storage](#32-audio-upload--storage)
- [33. STT Pipeline](#33-stt-pipeline)
- [34. AI Report Generation Service](#34-ai-report-generation-service)
- [35. AI Correction Service](#35-ai-correction-service)
- [36. AI Chat & Conversation API](#36-ai-chat--conversation-api)
- [37. Export API](#37-export-api)
- [38. Analytics API](#38-analytics-api)
- [39. Global Search API](#39-global-search-api)
- [40. Mock Data & Seeding](#40-mock-data--seeding)
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
- [52. Page — Report Wizard (New / Edit)](#52-page--report-wizard-new--edit)
- [53. Component — Editor Components](#53-component--editor-components)
- [54. Component — Correction Modes (Correction Modes 1–3)](#54-component--correction-modes-correction-modes-13)
- [55. Component — Conversation Bubble & Chat UI (UI only)](#55-component--conversation-bubble--chat-ui-ui-only)
- [56. Page — Branches](#56-page--branches)
- [57. Page — Profile](#57-page--profile)
- [58. Feature — Print-to-PDF & Client-side Exports](#58-feature--print-to-pdf--client-side-exports)
- [59. Feature — Global Search & 404 Page](#59-feature--global-search--404-page)
- [60. Universal UX — States Protocol, Toasts & Feedback](#60-universal-ux--states-protocol-toasts--feedback)
- [61. Security & Reliability Requirements](#61-security--reliability-requirements)
- [62. Sweeper, TTL & Data Retention](#62-sweeper-ttl--data-retention)
- [63. Testing & Verification Strategy](#63-testing--verification-strategy)
- [64. Performance & Scale (+ official-± resolution)](#64-performance--scale--official--resolution)
- [65. Deployment](#65-deployment)
- [66. Implementation Phases](#66-implementation-phases)
- [67. Risks & Mitigation](#67-risks--mitigation)
- [68. Glossary](#68-glossary)
- [69. Open Questions & Assumptions (registry)](#69-open-questions--assumptions-registry)

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

An authenticated session may also browse the Landing page
(read-only, §41.5/§48.2 — the bar shows the Logout action
instead of Log in / Sign up, §47.2); Login and Register remain
guests-only.

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
  open here is left open; its rules are not half-decided in §5 (the
  `clockIn`/`clockOut` requiredness question is closed — OQ-002, §21.2).
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
- The capture & attribution contract is owned by §6.10; the branch-digest
  and filtering contract by §6.11. Nothing in either may contradict the
  format rules above.

### 6.10 Capture & attribution contract

§6.10 completes §6's day model with the capture–attribution
contract: the rules that determine, for every content item of a
branch day, which branch it belongs to — even when the narration
never names a branch — and the shared content-status vocabulary of
the review surfaces. It implements the multi-branch business rules
(BR-03/BR-04, ADR-010, §6.4, §6.7) at item level.

- **Owned here (normative).** The form-only metadata contract;
  the clip-to-visit
  binding model; the branch-directive narration rule; the attribution
  priority chain and its `attributionBasis` values; the item status
  vocabulary and rating semantics; the locked decisions of the
  capture model; edge cases.
- **Owned elsewhere — deliberately not repeated here.** The wizard
  pages, steps and form fields = §52; the capture fields and the
  Audio row with its `visitNo` binding = §21.2/§22/§32; the
  transcription review surface = §54; the branch digest and the
  filtering contract = §6.11; the accept gate = §31.6; generation
  mechanics and the structured-output schema = §34; the clip-level
  transcription vocabulary as UI state (never a document field) =
  §23.2.
- **Explicitly out of scope §6.10.** No endpoint, no schema field
  (the capture fields are §21.2's), no constant (§11 unchanged), no
  package, no transition or guard rule (§31 owns them).

**Locked status = temp.** Every decision in this section is
approved for the current phase only — status **Approved (temp)**
per §14.2 — and changes only through the §14.5 amendment protocol
(owning-section text first, the §14.3 register row updated in the
same change). None of the decisions here claims permanence.

**Capture metadata is form-only.** Every header value of the §6.2
skeleton comes from the §21.2 capture fields (`reportDate`,
`supervisorName`, `visits[]`) filled by the wizard's capture form
(§52.4–§52.5). No metadata is ever extracted from audio or
transcription text by the model (the mandatory line of the next
paragraph is content, not metadata). The fallback order for a missing value is form → reviewed
transcription → blank/"not specified" (BR-19, §6.3 value-source
cells, §8 rule 6); a value is never invented. The `ብራንች:` header
line, the per-visit time-range lines, the day start/exit, and the
type (Type-1/Type-2 — one visit vs two or more) are derived
deterministically from `visits[]` per §6.4 and are never stored as
copies (§21.2). On a Type-2 day the branch names join with ` / `
in visit order (§6.4); a branch visited twice appears as two visit
lines while the snapshot holds one member (§6.4, Sample 4).

**Clip-to-visit binding (recording).** The wizard Audio step
(§52.6) shows **one recording tab per visit** — there is no
global/all tab and no all-branches state: every clip belongs to
exactly one visit. A clip is **bound** at upload time in the same
write session: the Audio row's `visitNo` exact key (§21.2, §32.2)
copies the tab's visit row. On a Type-1 (single-visit) day there is
one visit only, so no tab is needed — binding is implicit (every
clip lands on the day's only visit). The supervisor finishes a
branch's activities, issues and comments inside that branch's
clips; content may be spoken in any order, and a forgotten point is
fixed by recording a new clip on the same visit's tab. Multiple
clips per visit are allowed and merge in the digest (§6.11) in any
order — recording order never matters.

**Branch-directive narration (the mandatory line).** When narration
names the branch its content belongs to, it uses the §6.8 prefix
pattern `በ[branch] ብራንች፡` — the mandatory line. A clip carries at
most one mandatory line (one directive style; two directive styles
never appear together in one clip). The mandatory line attributes
the items that follow it (rule 1 of the chain below), and the §6.7
rule-10/rule-11 preservation applies: the generated multi-branch
body may keep the same `በ[branch] ብራንች፡` prefixes for branch-
specific items, while a single-branch day's body stays as natural
narration (the samples of §6.8). The report body is the §8.4
rewrite of the narration — never a verbatim repeat — but the branch
attribution it expresses is exactly the one resolved here.

**Attribution priority chain (normative, no guessing).** For every
content item the attribution is resolved in this order, and
`attributionBasis` on the item records which rule won (§6.11):

| # | Basis | Rule |
| - | ------ | ---- |
| 1 | `spoken` | Narration names a branch (via the mandatory line or inline) — that wins, even against a conflicting tab binding. |
| 2 | `binding` | The clip's bound visit (`Audio.visitNo`, §21.2/§32) — the tab the clip was recorded on. |
| 3 | `single-branch-default` | A Type-1 day: every item belongs to the day's only branch, without any spoken name. |
| 4 | `user-assigned` | Anything left appears in the review Unassigned panel; the supervisor assigns it with one tap (§54). |

There is **no silent fallback** and **no global/all concept**: a
spoken phrase like `በሁለቱም ብራንቾች…` inside a clip bound to one
visit belongs to that visit's branch only (edge case 9 below). An
item that cannot be attributed by rules 1–3 becomes an
`unassignedItems` member (§6.11) and the report accept is blocked
until it is resolved (the §6.11 gate, §31.6).

**Item status vocabulary & ratings.** Content items share one
status vocabulary, **`reported` → `in_progress` → `completed`**
(the vocabulary §23 references as this section's domain):

- activities → `completed` (default) or `in_progress`;
- issues → `reported` (default); the model upgrades to
  `in_progress` when the narration promises a visit (e.g.
  `ነገ መጥቶ ያስተካክላል`) or to `completed` when it verifies one
  (e.g. `መጥቶ አስተካክሎታል`);
- comments → no status; an optional integer `rating` 0–5, `null`
  allowed (no rating voiced = `null`);
- clip-level transcription review state → the same vocabulary as
  **UI/capture state only, never a document field** (§23.2: no
  transcription status field exists by design; the §31.6 per-clip
  acceptance gesture is the only persistence, and the §33.5/§34.2
  presence contract is the generation gate).

Statuses are editable during review (activities and issues alike;
§54); edits update the item in the digest before the next accept
(§6.11).

**Locked decisions (normative).** The capture-model decisions
locked for this phase:

1. Metadata is captured by the form; form wins over transcription;
   fallback `form → reviewed transcription → blank` (BR-19).
2. Audio carries content only (activities, issues, comments; any
   order) — never metadata.
3. Type = visit count (1 → Type-1, ≥ 2 → Type-2; §6.4, ADR-010).
4. Header lines derive from `visits[]`; the `ብራንች:` value is the
   visit-ordered ` / ` join — never a stored copy, never
   LLM-composed at print time (§21.2).
5. **No global (ብራንች ሁሉ) tab/step** — binding tabs per visit
   only; every clip belongs to exactly one visit; Type-1 needs no
   tab.
6. Attribution priority: spoken > binding > single-branch-default >
   user-assigned; no silent fallback; no global-all rule.
7. `accept` is blocked while `unassignedItems` is non-empty
   (§6.11, §31.6).
8. Status vocabulary: `reported → in_progress → completed`;
   activities `completed` (default) or `in_progress`; issues
   `reported` (default); comments have no status; `rating` 0–5
   optional, `null` allowed; clip transcription review state uses
   the same vocabulary as UI state (§23.2).
9. Multi-branch body may carry `በ[branch] ብራንች፡` prefixes
   (§6.7 rules 10–11); single-branch body stays natural.
10. The branch digest (§6.11, schemaVersion 1) is stored,
    regenerated at the §6.11 derivation points, and is the **only**
    source for branch filtering — no model call in the filtering
    loop.

**Edge cases.**

| # | Case | Rule |
| - | ----- | ---- |
| 1 | Clip bound to visit X, but narration names branch Y | `spoken` wins (rule 1). |
| 2 | A clip mentions another branch too | The itemization splits the piecewise content; split pieces go to the spoken branch; ambiguous pieces → `unassignedItems` (rule 4); the supervisor assigns. |
| 3 | Branch archived/deleted after the report | The digest keeps the stored branch-name text; filters match stored text regardless of the current branch-list state (§17.4 tombstones). |
| 4 | Correction adds/removes a visit | The digest is re-derived at the next §6.11 derivation point; items of a removed visit's branch become `unassignedItems`; the supervisor reassigns (rule 4). |
| 5 | No rating voiced | `rating: null` — valid. |
| 6 | No comment voiced | `comment.text: null` — valid. |
| 7 | Zero visits or no audio | The wizard blocks generation (invalid report; §31.2 creation steps, §52.10). |
| 8 | Multiple clips on the same visit tab | All merge into that branch's items in the digest — order-independent. |
| 9 | Spoken `በሁለቱም ብራንቾች…` inside a bound clip | Belongs to the bound visit's branch only (no global bind). |

### 6.11 Branch digest & filtering contract

§6.11 owns the **branch digest**: the stored, item-level
itemization of the report content (which activity, issue, and
comment belongs to which branch, with its status, rating, and
attribution basis), the unassigned-items gate on accept, and the
server-side filtering vocabulary that reads only this digest.

- **Owned here (normative).** The digest schema (schemaVersion 1,
  below); the digest lifecycle and its derivation points; the
  unassigned-accept gate; the filtering contract and its parameter
  vocabulary.
- **Owned elsewhere — deliberately not repeated here.** The
  attribution rules the digest records = §6.10; the item status
  vocabulary = §6.10; the accept endpoint and its guards = §31.6;
  the generation round that writes the digest = §34.4/§34.6; the
  analytics payloads = §38; search mechanics = §39; the review UI
  (Unassigned panel, status editing) = §54; report lists = §50;
  exports = §58.
- **Explicitly out of scope §6.11.** No endpoint shape is owned
  here (endpoints register in §31.6/§38/§39); the digest field
  itself is registered in §21.2 (this section decides its value
  contract only); no constant new to §11 — the derivation reuses
  the generation parameters (§11.3); no package.

**Digest schema (schemaVersion 1, normative).** The digest is a
single embedded document on the report row (§21.2 `branchDigest`):

```json
{
  "schemaVersion": 1,
  "report": {
    "type": "Type-2",
    "visits": [
      { "visitNo": 1, "branchName": "ጎላጉል", "clockIn": "01:05", "clockOut": "02:20" },
      { "visitNo": 2, "branchName": "ብስራተ ገብርኤል", "clockIn": "03:30", "clockOut": "12:00" }
    ]
  },
  "branches": [
    {
      "branchName": "ጎላጉል",
      "activities": [
        { "itemId": "a1", "text": "…", "status": "completed", "sourceClip": "…", "attributionBasis": "single-branch-default" }
      ],
      "issues": [
        { "itemId": "i1", "text": "…", "status": "reported", "sourceClip": "…", "attributionBasis": "binding" }
      ],
      "comment": { "text": null, "rating": null }
    }
  ],
  "unassignedItems": []
}
```

Field rules:

- `schemaVersion` — a Number, `1` today; changes through §14.5,
  never silently.
- `report.visits` — the §21.2 `visits[]` block of the report,
  mirrored at derivation time (`visitNo` row keys — never
  `visitId`, §9.3/§12.11); equality holds by construction at the
  write moment, and the digest survives later snapshot edits as a
  copy (the mirror is refreshed at the next derivation point).
- `branches[]` — one member per branch appearing in the day; the
  member for a branch visited twice is a single entry (two visit
  rows) — the branch is the item's unit, the visit only its
  binding source (§6.10).
- `branches[].branchName` — the **stored branch-name text**
  (survives archival/deletion, edge case 3): filters match this
  text, never a live join.
- Items (`activities[]`, `issues[]`) — each entry is
  `{ itemId, text, status, sourceClip, attributionBasis }`:
  `itemId` is unique within the digest (stable across versions of
  the same item); `text` is the item's report wording (§8.4 — the
  rewritten line); `status` is a member of the §6.10 vocabulary
  (`reported`, `in_progress`, `completed`); `sourceClip` is the
  ObjectId of the Audio row the item came from (plain-model ref,
  §9.3/§22); `attributionBasis` records which §6.10 rule won
  (`spoken`, `binding`, `single-branch-default`, `user-assigned`
  — auditable).
- `branches[].comment` — `{ text: String|null, rating:
  Number 0–5|null }`; no status (the §6.10 vocabulary applies to
  activities and issues only).
- `unassignedItems[]` — items resolved by no rule of §6.10; same
  item shape with `attributionBasis: "unassigned"`; when the
  supervisor assigns one (§54), it moves into its branch's list
  with `attributionBasis: "user-assigned"`. There is no stored
  "all branches" member anywhere — a report's items partition
  across `branches[]` ∪ `unassignedItems[]`.

**Digest lifecycle & derivation points.** The digest is written
or cleared only in a §27.7 session, together with the content
write it reflects:

1. **Generation (§34).** The provider round outputs the §6.11
   digest together with the report text (the §34.4 structured
   schema carries `branchDigest` and `unassignedItems`); §34.6
   persists it in the same session as `raw`/`latest`.
2. **Content writes (Mode-1 Save and Mode-2/3 accept→save, §31.6/
   §35.5) and visit writes (§31.5)** clear the stored digest
   (`branchDigest` is nulled in the same session — the
   **stale marker**). No model call happens in these paths (the
   no-AI-in-Mode-1 rule of §35.8 is preserved).
3. **Report accept (§31.6)** re-derives a stale digest before the
   gate: when `branchDigest` is null, the endpoint runs one
   derivation call — the §34.5 provider chain with the generation
   parameters (§11.3, no new constant), output schema = the digest
   shape of this section — for the current `latest` text; provider
   exhaustion → 502 with no state change (the saved content is
   untouched, BR-11). Derivation failure never blocks
   corrections, only the accept.
4. **After `completed`** (BR-10 corrections) the digest is cleared
   as in (2) and never re-derived automatically: item-level
   filtering then excludes the report (a "pending re-derivation"
   state surfaced in analytics, §38) until the supervisor runs
   `POST /reports/:reportId/digest` — the manual re-derivation
   retry (ai tier per §27.3; failure → 502 + a §36 assistant
   note). No derivation ever happens inside a filtering read: the
   filtering loop is model-free by construction.

**Unassigned-accept gate (normative).** `POST /reports/:reportId/
accept` (§31.6) proceeds only from a fresh digest whose
`unassignedItems` is empty. Non-empty → 422 with the unassigned
item texts (§27.5 semantics); the UI routes to the Unassigned
panel (§54) for rule-4 assignment or a Mode-1/2/3 content
correction, after which accept is retried. The gate never drops
an unassigned item silently. At `completed` the gate does not
re-run (accept is the only gate point; BR-10 keeps edits open
afterwards).

**Filtering contract (server-side, model-free).** The only data
source for branch-aware filtering is the stored digest — no model
in the loop, no derivation on read (§6.10 locked decision 10).
Parameter vocabulary:

| Param | Values | Semantics |
| ----- | ------ | --------- |
| `branch` | branch-name text | matches `branches[].branchName` stored text — tombstone-safe (edge case 3) |
| `group` | `activities` \| `issues` \| `comments` | the §6.7 content classes of the digest |
| `status` | `reported` \| `in_progress` \| `completed` | the §6.10 vocabulary; ignored for `comments` |
| `dateFrom` / `dateTo` | Ethiopian `DD-MM-YY` | report-date window, §38.5 rollup semantics |
| `q` | free text | text match over digest item text — search mechanics are §39's |
| `page` / `limit` | numbers | server-side pagination (ADR-034, §11.3) |

Responses use the §27.4 envelope; DTO shapes and exact endpoint
routes register with their owning sections — report content items
view = §31.6/§50, analytics items = §38 (incl. the "pending
re-derivation" state), search = §39 — all reading this vocabulary.
Exports (§58) render the report text; branch filtering of what is
exported follows the same vocabulary.

**Verification usage.**

- Grep gates: no digest field outside the §21.2 registry; no
  transcription status field anywhere (§6.10 vocabulary is UI
  state plus the digest; never a document field); the filtering
  services contain no provider call; the derivation call appears
  only at the §34.6 and §31.6 points and in the manual
  re-derivation endpoint; no `visitId` spelling anywhere.
- Cross-section checks: mirrors §6.10 (attribution/status), §21.2
  (`branchDigest` field, `visits[]` row keys), §31.6 (accept gate),
  §34.4 (output schema), §35.5/§35.8 (Mode-1 no-AI gate), §38/§39
  (analytics/search vocabulary), §54 (Unassigned panel), §58.
- §6.11 introduces no constant (§11 unchanged), no path beyond
  §15.4, and no package; the manual re-derivation endpoint
  registers in §31.6.

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

## Part 0 — Standards & Configuration (SDD)

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
  `:userId`). Embedded-row route segments follow the row's key name
  instead of `<resource>Id` — the segment names an embedded row, not
  a resource: `/reports/:reportId/visits/:visitNo/...` (§21.2).
- **Document reference fields** use the plain model name — no suffix:
  `user`, `branch`, `report`, `audio`, `transcription`,
  `conversation` (`branches[].branch` in a report's embedded
  snapshot, §20). `Id`-suffixed names are reserved for route
  parameters only (§12.11-1); document fields never carry the `Id`
  suffix. Embedded row keys are plain row keys too — never
  `Id`-suffixed (`visits[].visitNo`): a row key is a sequential
  number within its parent, not a durable identifier.
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
- Reusable input components use `forwardRef`; **forwardRef
  components declare no `propTypes`** — the named function (or an
  explicit `displayName`) is their identity; plain components may
  keep `propTypes`.
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
| `AVATAR_MAX_SIZE_BYTES`           | 5242880 (5 MB)                               | §28, §29                    |
| `AVATAR_ALLOWED_MIME_TYPES`       | `['image/jpeg', 'image/png', 'image/webp']`  | §28, §29                    |
| `ACCESS_TOKEN_TTL_MIN`            | 15                                           | §28                         |
| `REFRESH_TOKEN_TTL_DAYS`          | 7                                            | §28                         |
| `AI_TEMPERATURE`                  | 0.2                                          | §34                         |
| `AI_MAX_OUTPUT_TOKENS`            | 2048                                         | §34                         |
| `AI_TOP_P`                        | 0.9                                          | §34                         |
| `AI_TOP_K`                        | 40                                           | §34                         |
| `AI_CORRECTION_MAX_OUTPUT_TOKENS` | 2048                                         | §35                         |
| `AI_CORRECTION_TEMPERATURE`       | 0.15                                         | §35                         |
| `AI_CONVERSATION_HISTORY_MAX_ENTRIES` | 20                                        | §34, §36                   |
| `CHAT_MESSAGE_MAX_LENGTH`         | 4000                                         | §36                         |
| `EXPORT_DOCS_ENABLED`             | `false`                                      | §37                         |
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
| `OFFICIAL_TOKEN_PREFIX`           | `'±'`                                        | §35, §37, §53, §58, §64     |

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
| `REPORT_STATUS_LABELS`| §11.4 (English chrome, §7.6) | §49, §46.13 |
| `AI_PROVIDERS`        | §11.4                | §54     |
| `AI_MODELS`           | §11.4                | §54     |
| `AI_REASONING_EFFORTS`| §11.4                | §54     |
| `PAGINATION_*`        | §11.3                | §50     |
| `AUDIO_*`             | §11.3 (MIME list)    | §53     |
| `AVATAR_*`            | §11.3 (max size, MIME list) | §57 |
| `OFFICIAL_TOKEN_PREFIX` | §11.3              | §51, §53, §58 |
| `TOAST_AUTO_DISMISS_MS` | §60.5 cadence (success/info 5000, error/warning 8000; loading never auto-dismisses) | §60, §48 |
| `TOAST_CATALOGUE`     | §60.6 catalogue — single-sourced strings (one occurrence per string, §48.6) | §27, §48, §60 |

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
cross-cutting mechanics in Part E (§60 universal UX, §61 sanitization,
§62 sweeper & retention, §63 verification gates, §64 performance &
official-± resolution, §65 deployment). Delivery lands in Part F
(§66 implementation phases, §67 risks & mitigation, §68 glossary,
§69 open questions & assumptions). Every pointer below forwards
to its low-level home; §12 never duplicates what those sections own.

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
- **Tokens:** two JWTs: access (15 min, path `/api/v1`) and refresh
  (7 days, path `/api/v1/auth`, signed with `JWT_REFRESH_SECRET`);
  both delivered as httpOnly cookies (§10.4, §28).
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
| 1 | Route parameters use the `<resource>Id` form (`:reportId`, `:branchId`, `:transcriptionId` — and `:visitNo` for a report's embedded visit rows); a bare `:id` is never used; there is no conversation-by-id route (`:conversationId` never appears — chat is nested per report) | §9.3; route definitions (§30–§39, §49–§54) |
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
| @fontsource/noto-serif-ethiopic | ^5.3.0        | Ethiopic content face (Amharic body, §43.5)    | §43        |
| jspdf                       | ^4.2.1            | PDF export (client-side)                       | §58        |
| jspdf-autotable             | ^5.0.8            | PDF tables (report tables)                   | §58        |
| prop-types                  | ^15.8.1           | Runtime prop validation (direct dep of the §46 belt) | §46  |
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
    |-- main.jsx                    (scaffold)  # flat route map; HydrateFallback spinner; RouterProvider;
    |                                           # Provider; LocalizationProvider + AdapterDayjs (§41)
    |-- App.jsx                     (scaffold)  # application shell & guards (§41)
    |-- assets/                     (scaffold)  # hero.png, starter art, notFound_404.svg; documented use in §43/§59
    |-- theme/
    |   |-- AppTheme.jsx            (scaffold)  # theme definition (§43)
    |   |-- themePrimitives.js      (scaffold)
    |   `-- customizations/         (scaffold)  # inputs, dataGrid, datePickers, charts,
    |                                           # navigation, surfaces, feedback, dataDisplay, index — §44
    |-- utils/
    |   |-- constants.js                       # client constants inventory (§11.5)
    |   |-- httpStatus.js                      # client mirror of the status semantics (§11.6)
    |   |-- ethiopianDate.js                   # Ethiopian calendar conversions (§13.4, §46, §52)
    |   |-- ethiopianDateAdapter.js            # field display → Ethiopian DD-MM-YY (§46.6)
    |   `-- toast.jsx                          # showToast/dismissToast — the §60.3 trigger API (§60)
    |-- hooks/
    |   |-- useAudioRecorder.js                # recording hook; reused by Mode 3 (§53)
    |   `-- useLogout.js                       # the single logout flow (§47.6)
    |-- mock/                                  # dev-only §66.10 adapter; deleted at P7
    |   |-- fixtures.js                        # §40 fixture data — seed of the adapter
    |   `-- transport.js                       # §42-shaped mock transport over the fixtures
    |-- redux/
    |   |-- app/
    |   |   `-- store.js                       # store creation; Provider wiring (§41–§42)
    |   `-- features/
    |       |-- apiSlice.js                  # RTK Query createApi; fetchBaseQuery +
    |       |                                #   baseQueryWithReauth; network & error layer (§41–§42)
    |       |-- authSlice.js                  # session/identity UI state (§41.5, §42)
    |       |-- authEndpoints.js              # getCurrentUser/login/logout/refresh (§28, §42)
    |       |-- reportsEndpoints.js           # report CRUD + visits + content + lifecycle (§30, §31, §34, §35)
    |       |-- branchesEndpoints.js          # branch CRUD + lifecycle (§30, §56)
    |       |-- audioEndpoints.js             # clips CRUD, audio stream URL (§32)
    |       |-- transcriptionEndpoints.js     # list, transcribe, re-transcribe, accept (§33, §54)
    |       |-- conversationEndpoints.js      # chat get/send (§35, §55)
    |       |-- analyticsEndpoints.js         # dashboard + items analytics (§38, §49, §56)
    |       |-- searchEndpoints.js            # global search (§39, §59)
    |       |-- profileEndpoints.js           # profile + sessions (§28, §57)
    |       `-- <domain>Slice.js             # one slice per domain (e.g. reports, branches) (§41)
    |-- components/
    |   |-- AppErrorPage.jsx                   # §60 render-error fallback (ADR-025, §41.4)
    |   |-- layout/                          # PublicLayout, AppShell, AppSidebar, PublicRoute,
    |   |                                    #   ProtectedRoute, Logo, ThemeToggle, AvatarMenu (§47)
    |   |-- reusable/                        # Mui* belt (§46), one file per component: MuiButton,
    |   |                                    #   MuiTextField, MuiSelect, MuiDatePicker (+MuiTimePicker),
    |   |                                    #   MuiPagination, MuiDataGrid, MuiConfirmDialog, MuiDialog,
    |   |                                    #   MuiEmptyState, MuiAppbar, MuiPageHeader, MuiStatusBadge, MuiAudioPlayer,
    |   |                                    #   MuiRecorder, MuiFileInput, MuiStatCard, MuiStepper,
    |   |                                    #   MuiRegistrationValue, MuiToast, AppToastContainer,
    |   |                                    #   GlobalSearchDialog, LoadingSpinner, TableSkeleton,
    |   |                                    #   ListSkeleton, FormSkeleton, MessageSkeleton
    |   |                                    #   (MuiEditor at the editor phase, §66)
    |   |-- columns/                         # domain column-set files for MuiDataGrid (§50, §56, ADR-034):
    |   |                                    #   reports.jsx (§50), visits.jsx (§52)
    |   |-- landing/                          # e.g. Hero.jsx — example of a domain folder
    |   |-- auth/                             # e.g. LoginForm.jsx — example of a domain folder
    |   |-- report/                           # ReportCard.jsx — the §50 list/grid card (§15.6)
    |   |-- reports/                          # correction surface folders (§54, §15.6):
    |   |                                    #   edit-content/, correct-instruction/, correct-voice/,
    |   |                                    #   corrected-strip/, unassigned-panel/
    |   |-- branches/                         # branch domain components — Create/Edit dialog,
    |   |                                    #   Branch Details composition (§56, §56.5)
    |   |-- print/                            # ReportPrint.jsx — the §58.3 print surface
    |   `-- <domain>/                        # every other component lives at
    |-- pages/                                # one <Name>.jsx per routed view; the page set is
    |                                         # decided by the page sections (§48–§59); pages so far:
    |                                         # Landing, Login, Register, NotFound, Dashboard, Reports,
    |                                         # ReportNew, ReportDetails, Branches, BranchDetails,
    |                                         # Profile — each implementing phase adds its page
    |                                         # files here in the same change (§15.7)
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
  `auth/`, `landing/`, `report/`) — and never outside `components/`.
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
| Report — Audio | 1 — N clips | `{ report, visitNo }` on Audio (exact keys) | BR-01/BR-02, §22 |
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
carries `{ report, visitNo }`, written once at upload: `report`
joins the report, `visitNo` is the **exact key** of the visit this
clip belongs to (`visits[].visitNo`, §21.2). A visit's source resolves
by exact-key query — `Audio.where({ report, visitNo })`, then each
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
| `transcribed` | report + audio rows + transcription(s) with `raw` (and `latest`, both initialized equal); per-visit source resolved via the exact-key edges (`audio.{ report, visitNo }` → 1:1 transcription, §17.3) — the presence check is the query, never a stored ref on the row |
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
  §6.11/§21; pickers, Reports UI, and global search behavior =
  §46.6/§52, §50, §39/§59; the ownership guard = §3.2.3/BR-13.
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
   used by filtering, the unassigned-accept gate) = §6.10/§6.11;
   audio documents, upload and removal
   material and bindings = §22/§32; transcription rows = §23; chat
  conversations = §24/§36; content generation and correction writes
  to the content slots = §34/§35; export fidelity = §37/§58; the
  sweeper and windows = §62; field validators = §29; wizard steps
  and Reports UI = §52, §50–§54; search = §39; analytics = §38/§49; the
  ownership guard = §3.2.3/BR-13; the retention constants = §11.
- **Explicitly out of scope §21.** No endpoint, no transition or
  guard rule (§30–§31 own them), no retention arithmetic (§62), no
  attribution or digest-composition rules (§6.10/§6.11 own the value
  contract; the `branchDigest` field itself is registered in §21.2),
  no capture-contract
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
| `visits` | Array | yes (default `[]`) | the capture block — each entry is `{ visitNo: Number (required, sequential within the report), branchName: String (required), clockIn: String (required — `HH:mm`, §6.5), clockOut: String (required — `HH:mm`) — the day clock rule: on a Type-1 (single-visit) day the visit pair is the day pair, auto-set by the wizard (§52.5); on a Type-2 day every visit carries its own required pair (§6.3 field 4; OQ-002 closed by amendment, §21.7) }`; stored in chronological capture order (§6.4); Type-1 days hold one entry, Type-2 two or more (BR-03); a branch visited twice appears as two entries while the snapshot holds one member (§6.4); `branchName` copies the same `Branch.name` as the matching snapshot member, at the same capture moment, so equality holds by construction and the two blocks are never edited independently; time values follow the `HH:mm` zero-padded format of §6.5 (validated by the §29 validators, never composed in the schema) |
| `raw` | String | no (null until first generation) | the original generated content, written once at first generation and never rewritten (BR-11, §18.7); no version chain exists beside it (ADR-005 retired, §14.3) |
| `latest` | String | no (null until first generation) | the single current-content slot, initialized to `raw` at first generation; every edit, correction, and revert overwrites it (BR-11); accepted content is this slot fixed at accept (§21.5) |
| `branchDigest` | Mixed | no (null until first generation; null = stale) | the §6.11 branch-digest document (schemaVersion 1) — the item-level itemization of `latest` (attribution, statuses, ratings, unassigned items); written at generation (§34.6) in the same session as `raw`/`latest`; **nulled** by every later content or visits write (§31.5/§31.6) as the stale marker; re-derived at report accept when stale and by the manual re-derivation endpoint (§31.6) — the value contract, lifecycle and gate are §6.11's, never re-stated here; no index is declared on it (§21.3) |
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
carries `{ report, visitNo }`, so a visit's clips and their
transcriptions resolve by exact-key query over the edges, never by
array position or implicit ordering (§17.3; future §22 contract); the
ChatConversation row carries the report ref (§24). The
`branchDigest` field of the table above is the only item-level
artifact on the row (value contract, lifecycle and gate = §6.11,
never re-stated here);
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
- **OQ-002 (closed by amendment, recorded here).** Whether `clockIn`/
  `clockOut` are required per visit was closed on 2026-08-10: **every
  visit carries a required `HH:mm` clock pair**. On a Type-1
  (single-visit) day the visit pair is the day pair — the wizard
  auto-sets it from the day-clock fields of step 2; on a Type-2
  (multi-visit) day each visit supplies its own pair (§6.3 field 4,
  §52.5). Day start/exit remain derived from the first `clockIn` /
  last `clockOut` (§6.4, §21.7) — nothing is stored above `visits[]`.
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

### 21.12 Design rationale (why the report schema is shaped this way)

The shape above is deliberate; each choice below is justified by its
owning subsection and repeated nowhere else:

1. **`supervisorName` is a snapshot, not a join.** A report is a
   historical artifact: the printed name must read exactly as it did
   on the day it was written, and a later profile rename never
   rewrites report history — the same snapshot doctrine as
   `branches[].name` (→ the `supervisorName` row of §21.2; §17.4
   tombstone doctrine).
2. **`reportDate` is a business date, not `date`.** It is the
   report's `ቀን` business identity, distinct from the lifecycle
   timestamps (`createdAt`/`updatedAt`); a `date` name would invite
   query-time confusion, and the list sort depends on the
   distinction (→ the `reportDate` row of §21.2; the §21.3 index).
3. **Day start/exit are derived, never stored.** Day start = the
   first visit's `clockIn`; day exit = the last visit's `clockOut`
   (the requirement's own definition, §6.3 field 8). Storing them
   would be a second source of truth that contradicts `visits[]`
   after an edit (→ §21.7, §6.4; both clock fields are required
   per visit — the closed OQ-002 rule).
4. **No `audio[]` / `transcription` ref on the report.** The edges
   are child-side — `Audio.{ report, visitNo }` and a 1:1
   `Transcription.audio` — so presence is the query, never a stored
   parent array that must be rewritten on upload, re-transcription,
   or deletion and can go stale (→ §22.1, §17.3).
5. **`visitNo` is a sequential row key, not a durable id.** A visit
   is an embedded row, and its key is the sequential number within
   its report; routes mirror the key (`/visits/:visitNo`), and the
   name never carries the `Id` suffix (→ the `visits` row of §21.2;
   §9.3).
6. **Activities, issues, and opinion stay inside the content
   slots.** The format defines them as prose blocks (§6.3 fields
   5–7); nothing queries them as fields (search is full-text, §39);
   §35's surgical protocol is text-anchored by design; a structured
   per-branch content model is deliberately reserved at §6.10/§6.11
   — never guessed early (→ the `raw`/`latest` rows of §21.2; §6.9).

### 21.13 Verification usage

- Grep gates: `status` values always resolve to `REPORT_STATUSES`
  (§11.4) — no literal status strings anywhere in §21;
  `ARCHIVED_TTL_SECONDS` resolves to §11.3 — the literal `2592000`
  never appears; `isArchived`/`archivedAt` appear as the lifecycle
  pair with **no `deletedAt`** anywhere in the section; the snapshot
  shape everywhere is `branches[].{ branch, name }`; the content
  slots are exactly `raw` + `latest` (null until first generation);
  `clockIn`/`clockOut` appear only in the `visits` block, every
  visit carrying the required `HH:mm` pair (the closed OQ-002
  rule, §21.7); the item-level artifact is exactly the
  `branchDigest` field (registered in §21.2; value contract §6.11),
  and no per-item vocabulary — no attribution basis, no rating, no
  unassigned-items structure — appears as its own field outside the
  digest; the stored capture fields are exactly
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
Report—Audio edge (§17.3): it carries `{ report, visitNo }`, written
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
| `visitNo` | Number | yes | the exact visit key this clip belongs to — equals a member of `visits[].visitNo` of the owning report at the upload moment (§21.2, §17.3); written once at insert, together with `report`, in the same session (single write site per §17.3); a report's visit removal detaches or cascades the visit's clips in the same write session (§17.4, §18.5) |
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
ordering assumption as a *binding* — `Audio.where({ report, visitNo })`
is exact-key.

### 22.3 Keys, indexes & TTL

- **Owner scope.** `schema.index({ user: 1 })` — the mandatory
  owner-scoping index (§18.3, BR-13); every clip query resolves the
  owning user first.
- **Exact-key source query.** `schema.index({ user: 1, report: 1,
  visitNo: 1 })` — serves the §17.3 per-visit source resolution and
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
  `report`/`visitNo` bindings are written at insert (the single write
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
  only (`_id`, `report`, `visitNo`, `mimeType`, `sizeBytes`,
  `durationSec`, timestamps).
- Exposed refs keep the §9.3 plain-name doctrine; route parameters
  keep the `Id` suffix (`:audioId`, §12.11-1) — the two namespaces
  never collide.

### 22.8 Seeds & mocks

Audio seeds are **metadata-only** clips — real binaries are never
written by seeding (ADR-037, §25). Seeded rows carry valid
`report`/`visitNo`/`mimeType`/`sizeBytes`/`durationSec` values that
satisfy §17.6 presence and the §22 registry; injection and wipe are
session-aware (§18.5) and arrive exclusively through the §25/§40
mechanisms — never hard-coded in the model (§18.8).

### 22.9 Evolution

Changes are additive-only (§18.9, §14.5); a documented destructive
schema change is applied through the §25/§40 wipe mechanism in
development (§12.10). The binding fields (`report`, `visitNo`,
`transcription`) are load-bearing for the §17.3 source contract; a
change to their shape requires §17.3/§21.2 coordination (§18.9) and
an amendment record (§14.5).

### 22.10 Verification usage

- Grep gates: no `status`, no `isArchived`, no `archivedAt`, no
  `deletedAt` on this model; no TTL declaration beyond §18.3's two;
  `mimeType` values always resolve to `AUDIO_ALLOWED_MIME_TYPES`; the
  binding fields are exactly `report` + `visitNo` (no `reportId`
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
validation (§29); or the clip-level review vocabulary
(`reported → in_progress → completed`) — stated in §6.10, applied
as UI/capture state in §54, and never a field in this model.

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
`reported → in_progress → completed` vocabulary of §6.10 is
UI/capture state only — never a document field — and introducing a
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
  `latest`, equal) exist; `reviewed` means a generation exists
  (§17.6) — it freezes nothing: content stays editable through the
  §23.4 review paths until `completed` (§34.6, BR-10) — the checks
  are queries, never stored flags on this row.

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
  snapshot, and `visits[]` per §21.2 (every fixture visit carries
  the required `HH:mm` clock pair).
- **Audio** — metadata-only rows bound to the reports (valid
  `report`/`visitNo`/`mimeType`/`sizeBytes`/`durationSec`; no
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

## Part C — Backend (HLD/LLD)

## 26. Backend Foundation

### 26.1 Purpose & scope

§26 owns the backend process foundation: the `config/env.js`
frozen configuration, the Winston logger, server boot and
graceful shutdown (ADR-013), the Express app wiring with the
fixed middleware chain (ADR-035), the single route registry
(`routes/index.js`), and the health endpoint. It exists because
§12.2-7/§12.2-8/§12.10 define the process-level contract that
every Part C section (§27–§40) hangs on, and §15.4 freezes the
file tree.

- **Owned here (normative).** Config boot and fail-fast (§26.2);
  the logger (§26.3); the Express app and middleware wiring
  (§26.4); the route registry (§26.5); boot, health, and graceful
  shutdown (§26.6); verification (§26.7).
- **Owned elsewhere — deliberately not repeated here.** The
  middleware behaviors = §27 (rate limits, sanitize, transform,
  error handler); auth middleware = §28; validators = §29; per-
  domain route/controller/service design = §30–§39; the constant
  values = §11; the file tree = §15.4; env-var additions = §10.3.
- **Explicitly out of scope §26.** No endpoint beyond the health
  endpoint, no provider call, no new constant (§11 unchanged —
  `LOG_RETENTION_DAYS` exists), no new path beyond §15.4, no
  package.

### 26.2 Config boot & fail-fast

`backend/config/env.js` is the **only file reading `process.env`**
(§10.3) and exports a frozen `env` object (ADR-020). Lookup
chain per §10.3: process env → pre-defined `.env` → `backend/.env`
→ default → **fail-fast** when a required variable is missing.
Required without default: `MONGO_URI`, `JWT_ACCESS_SECRET`,
`JWT_REFRESH_SECRET`, `ADDIS_API_KEY`, `GEMINI_API_KEY`,
`NVIDIA_API_KEY`, `NVIDIA_API_URL` (§10.4). The env object exposes
exactly the §10.4 variables plus the frozen defaults — a key not
in §10.4 cannot be read here (grep gate: no other `process.env`
read anywhere, §12.6). `env` is frozen with `Object.freeze` on
export; mutation attempts fail in strict mode (ADR-020).

### 26.3 Logger (Winston)

`backend/utils/logger.js`: Winston with transports — console
(development, simple format), rotating file `logs/` daily with
`LOG_RETENTION_DAYS` (30) retention, both gitignored (§9.5).
Child loggers labeled `Server`, `DB`, `Auth`, `AI-Addis`,
`AI-Gemini`, `AI-Nvidia` for the §16 provider calls. Safe-
logging policy (ADR-019): passwords, JWT values, cookies, API
keys, audio content, and full transcription/report texts are
**never** logged; provider logs carry only provider, model,
status code, latency, request/response ids. `console.log` is
banned (§9.5); logger methods are the only logging surface. The
logger is imported by `server.js`, `app.js`, and every controller/
service; the global handler (§27.5) logs through it.

### 26.4 Express app & middleware wiring

`backend/app.js` builds the Express app; it **registers no route
directly** (§12.2-7) — only `routes/index.js` does. Order (fixed,
ADR-035 — never reordered, never dropped):

```
helmet → cors → compression → cookie-parser → express-mongo-sanitize → rate-limit
```

wired in that order, then the `/api/v1` registry mount (§26.5),
then the not-found handler and the global error handler (both
§27.5). CORS per §12.3: origin `CLIENT_ORIGIN`
(`http://localhost:3000`), `credentials: true` — httpOnly cookies
travel with requests. `app.js` also mounts nothing else: no
static asset serving (uploads are service-internal, §32; avatar
serving is not an Express route — §28 owns the avatar files and
its access bookkeeping), no provider proxy routes (backend-only
proxy = service layer, §16).

### 26.5 Route registry (`routes/index.js`)

`backend/routes/index.js` is the **single route registry**
(§12.2-7): it imports every per-domain module of §30–§39
(`branch.routes.js`, `report.routes.js`, `audio.routes.js`,
`transcription.routes.js`, `chat.routes.js`, `auth.routes.js`,
`export.routes.js`, `analytics.routes.js`, `search.routes.js`,
`mock.routes.js`) and mounts them under `/api/v1` in the order
listed in §15.4/§30–§39. `app.js` calls exactly one function
(`app.use('/api/v1', routes)`) — adding a route module anywhere
else violates the registry (grep gate: one `/api/v1` mount in
`app.js`). Names are kebab-case; params use `<resource>Id`.

### 26.6 Boot, health & graceful shutdown

`backend/server.js`: connect to MongoDB (log via the `DB`
logger; fail-fast on connection failure after the §26.2 check),
then `app.listen(PORT)` (4000 in development), log `Server`
listening. Health endpoint (mounted under `/api/v1`, defined in
`routes/index.js`): `GET /api/v1/health` → 200
`{ success: true, message: 'OK', data: { status: 'up', uptime } }`
— unauthenticated, excluded from rate-limit tiers (§27.3), never
touches the database.

**Graceful shutdown (ADR-013):** on `SIGINT`/`SIGTERM` —
stop accepting connections (`server.close()`), clear the sweeper
timer (§12.5/§62), close the MongoDB client, flush the logger,
exit 0; forced exit after a timeout (default 10 s, dev-only log).
The sweeper timer's interval = `SWEEPER_INTERVAL_MS` (§12.5)
started after the server is listening.

### 26.7 Verification usage

- Grep gates: no `process.env` reads outside `config/env.js`; no
  `console.log` in `backend/`; one `/api/v1` mount; the
  middleware order in §26.4 matches §27.2 exactly; `raw`/`latest`
  texts never appear in logger calls.
- Cross-section checks: mirrors §10 (env), §11.3 (`LOG_RETENTION_DAYS`,
  `SWEEPER_INTERVAL_MS`), §12.2/§12.5/§12.10 (registry, sweeper,
  shutdown), §15.4 (tree), §16 (logger child labeling), §27
  (chain behaviors), §28 ($JWT secrets consumer).
- §26 introduces no constant (§11 unchanged), no new path beyond
  §15.4, and no package; it references only specification sections.

---

## 27. Global Backend Concerns

### 27.1 Purpose & scope

§27 owns the cross-cutting backend behaviors every endpoint
shares: the fixed security middleware chain (ADR-035), the
three rate-limit tiers (ADR-029), the API envelope and the error
handler (ADR-016), the response transform layer (ADR-017,
DTO mapping), pagination (ADR-034), and the session-transaction
template (ADR-018). Since §30–§39 specify endpoints, they
reference this section instead of repeating these mechanics.

- **Owned here (normative).** Middleware chain and its behaviors
  (§27.2); rate-limit tiers (§27.3); envelope, DTOs and the
  transform layer (§27.4); errors and the global handler (§27.5);
  pagination (§27.6); transactions (§27.7); verification (§27.8).
- **Owned elsewhere — deliberately not repeated here.** Middleware
  installation = §26.4; auth middleware = §28; validators and 422
  shape rules = §29; constants = §11.3; provider proxy behavior =
  §16; the client's toast mapping of errors = §60.
- **Explicitly out of scope §27.** No endpoint, no route, no
  constant (§11 unchanged — `RATE_LIMIT_*` exist), no package.

### 27.2 Fixed middleware chain (ADR-035)

Installed in §26.4 order, never reordered. Behavior notes:

- **helmet** — HTTPS header hardening, defaults.
- **cors** — origin `CLIENT_ORIGIN`, `credentials: true`
  (§12.3); the AI/export flows never need extra origins (no
  provider keys reach the browser, §16).
- **compression** — gzip for responses.
- **cookie-parser** — read `accessToken`/`refreshToken` httpOnly
  cookies (§28).
- **express-mongo-sanitize** — strips `$`/`.` operator keys from
  bodies/queries before validation.
- **rate-limit** at §27.3.

Auth middleware runs after the chain, per-route (not global),
via the domain route modules (§28.4). No other middleware is
added; if one is ever needed it goes through §10.3/§14.5
amendment (this list is closed).

### 27.3 Rate-limit tiers (ADR-029)

Three tiers from `RATE_LIMIT_*` constants (§11.3); every endpoint
belongs to exactly one tier; the health endpoint is exempt:

| Tier | Window | Max | Applied to |
|---|---|---|---|
| global | `RATE_LIMIT_GLOBAL_WINDOW_MIN` (15 min) | `RATE_LIMIT_GLOBAL_MAX` (100) | all non-auth, non-AI endpoints — branches, reports read/write, audio metadata, exports, analytics, search, mock |
| auth | `RATE_LIMIT_AUTH_WINDOW_MIN` (15 min) | `RATE_LIMIT_AUTH_MAX` (20) | `auth/*` endpoints (§28) |
| ai | `RATE_LIMIT_AI_WINDOW_MIN` (1 min) | `RATE_LIMIT_AI_MAX` (10) | generation (§34), correction (§35), chat (§36) — the provider-calling endpoints |

Violation → 429 `TOO_MANY_REQUESTS` through the standard error
envelope (ADR-016 shape, §27.5). The AI tier caps provider
calls; `Retry-After` from a provider maps into the AI tier's
rejection (per-provider retry counts are §33–§36, not the
tier).

### 27.4 Envelope, DTOs & transform layer (ADR-016/017)

- **Envelope** (every response): `{ success, message, data }`.
  Successes: `success: true`, `message` plain end-user language,
  `data` = the DTO (§27.4) or `null`. Errors: `success: false`,
  `message` = user-facing text, `data: null` (§27.5).
- **Paginated list data** (ADR-034): `data: { docs, page, limit,
  totalDocs, totalPages }` via `mongoose-paginate-v2` — `docs`
  is a `docs` array **not** named `data` (the transform layer
  maps the plugin output), defaults `PAGINATION_DEFAULT_PAGE` (1)
  / `PAGINATION_DEFAULT_LIMIT` (10), max `PAGINATION_MAX_LIMIT`
  (100).
- **Transform layer (ADR-017):** every controller maps its model
  output through a per-domain DTO function (`toDto`/`toListDto`)
  consuming only the schema `toJSON` transform output (§18.4).
  Fields: entities serialize exactly the model's serialized
  surface (§19–§24) — `filePath` never, `password` never by
  `select: false`, `stt.*` subfields on transcription only,
  derived values never stored. DTOs add no fields that are not
  in the models' serialized surfaces. `docs` list DTOs strip
  heavy fields (`raw`/`latest` full texts, `messages`) unless the
  endpoint's contract names them explicitly (§30–§39).

### 27.5 Errors & the global handler

- **`CustomError`** (`backend/utils/errors.js`): carries
  `statusCode`, semantic `status` name from `httpStatus.js`
  (§11.6), `message` (user-facing, plain language), optional
  `details` (validation field errors only). Status codes come
  strictly from the `httpStatus` constants: 400 `BAD_REQUEST`, 401
  `UNAUTHORIZED`, 403 `FORBIDDEN` (state/lifecycle blockers, e.g.
  accept denied at a non-`reviewed` status — §31), 404
  `NOT_FOUND`, 409 `CONFLICT` (dup-key 11000, dup email,
  archive/restore violations), 422 `UNPROCESSABLE_ENTITY`
  (validation, §29), 429 `TOO_MANY_REQUESTS` (§27.3), 502
  `BAD_GATEWAY` (AI provider failures mapped by §16.5).
- **Global handler:** single `(err, req, res, next)` at the end
  of the app (§26.4). Logs via the §26.3 logger (`error` child
  by source when derivable); it never logs the error's message
  verbatim if it could contain user text (safe policy — logs the
  error class, status, and reference). Stack trace rendered only
  in development. Response envelope per §27.4 with
  `message` falling back to a generic phrase for unknown
  statuses.
- **No layer responds directly:** controllers forward with
  `next(error)`; validators forward 422 (§29); services never
  respond. Not-found handler (any unmatched `/api/v1/*` path):
  `{ success: false, message: 'Route not found', data: null }`
  with 404.

### 27.6 Pagination

Read endpoints that list entities use `mongoose-paginate-v2`
(ADR-034): `page` (default 1), `limit` (default 10, max 100,
higher values clamp), and `sort` per endpoint contract. Filter
dimensions are per-domain (§30, §31, §38, §39 name theirs);
pagination mechanics are here. Invalid `page`/`limit` (non-
positive, non-numeric) → 422 via the §29 rule chain. List DTOs
never return full entity sets (heavy fields stripped, §27.4);
the client never holds cross-page datasets.

### 27.7 Transaction template (ADR-018)

Write handlers (create, update, archive/restore/delete, cascade,
upload metadata, transcription write, correction accept,
re-transcription, message append, mock seed/wipe) use the
canonical template:

```
startSession → startTransaction → writes (session-aware models) → commitTransaction
→ catch → abortTransaction → finally → endSession
```

- Every model hook/static that writes accepts `{ session }` and
  joins the caller's transaction (§18.5); no implicit/embedded
  sessions. Controllers never split a logical write across
  sessions.
- Read-only endpoints never open transactions; reads are
  `.lean({ virtuals: true })`.
- TTL index deletions (§18.3) are the single documented exception
  (server-side, cannot use a session); the orphan sweep (§62)
  cleans leftovers.

### 27.8 Verification usage

- Grep gates: all responses use `res.json` with the §27.4
  envelope or the error handler (no raw `res.send` bodies); no
  controller responds inside a try/catch (only `next(error)`);
  every rate tier applied via the `rateLimit` factory with
  constant values, never literals; pagination only through the
  plugin; no `pageSize`/`email`-style literals (§11).
- Cross-section checks: mirrors §11.3/§11.6 (constants), §12.2
  (stack/registry), §16.5 (provider failure mapping to 502),
  §18.4/§18.5 (transforms/sessions), §29 (422 shape), §62
  (sweeper's orphan pass), §60 (client toast mapping).
- §27 introduces no constant (§11 unchanged), no path, and no
  package; it references only specification sections.

---

## 28. Authentication & User Domain

### 28.1 Purpose & scope

§28 owns the auth surface (register, login, logout, refresh,
current-user, profile, avatar) and everything the `req.user`
identity provides to the other domains. It exists because §3.2.2
(Self-service registration, ADR-009), §19 (single account type,
ADR-036), §12.7 (dual-token JWT, ADR-004) and the ownership rule
BR-13 require one authoritative identity contract.

- **Owned here (normative).** Identity & token model (§28.2);
  endpoints (§28.3); auth middleware and route protection (§28.4);
  profile & avatar (§28.5); Google OAuth stub (§28.6); states,
  edge cases (§28.7); verification (§28.8).
- **Owned elsewhere — deliberately not repeated here.** The User
  schema, hashing, and index = §19; envelope/errors/rate tiers =
  §27; validators = §29; the client's reauth loop = §42; profiles
  UI = §57; `BcryptSaltRounds`/token TTLs = §11.3.
- **Explicitly out of scope §28.** No role/permission model
  (ADR-036), no user deletion (§19 — users have no delete path),
  no new constant (§11 unchanged — `ACCESS_TOKEN_TTL_MIN`,
  `REFRESH_TOKEN_TTL_DAYS`, `BCRYPT_SALT_ROUNDS` exist), no
  package.

### 28.2 Identity & token model (ADR-004/036)

- **Identity:** everything scopes by `req.user._id.toString()`
  (BR-13) — branches, reports, audios, transcriptions,
  conversations, analytics, search, mock. There is exactly one
  account type; no `role` field anywhere (§19).
- **Two httpOnly cookies** set with attributes: `accessToken`
  (15 min, path `/api/v1`, `SameSite=Lax`, `Secure` in
  production), `refreshToken` (7 days, path `/api/v1/auth`,
  `SameSite=Lax`, `Secure` in production). Values are JWTs signed
  with `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`; payload =
  `{ sub: user._id, type: 'access'|'refresh' }`.
- **Rotation:** every refresh issues a new refresh token and
  invalidates the presented one (a rotation-token use set stored
  in-memory is acceptable; no server-side session store beyond
  it). Forced logout (§28.3) clears cookies; there is no
  server-side blacklist for access tokens within their 15-minute
  window (documented acceptance).
- **No delegation:** `req.user` is always the authenticated
  owner; BR-13 ownership queries never trust client-supplied
  user ids.

### 28.3 Endpoints (all under `/api/v1/auth`, auth tier §27.3)

| Method+Path | Auth | Request | Success | Errors |
|---|---|---|---|---|
| `POST /auth/register` | none | `{ email, password }` | 201 `{ data: { user: UserDto } }` — **no cookies set, no auto-login** (locked decision 9, §41.2): the client redirects to `/login` with the "Account created" toast (§60.6) | 409 duplicate email; 422 validation |
| `POST /auth/login` | none | `{ email, password }` | 200 `{ data: { user: UserDto } }` + cookies | 401 invalid credentials (identical message for unknown email/ wrong password — no user enumeration) |
| `POST /auth/refresh` | refresh cookie | — | 200 `{ data: { user: UserDto } }` + rotated refresh cookie | 401 expired/absent/unusable refresh token |
| `POST /auth/logout` | optional | — | 200 `{ success: true, message, data: null }`; clears both cookies | — |
| `GET /auth/me` | access | — | 200 `{ data: { user: UserDto } }` | 401 |
| `GET /auth/sessions` | access | — | 200 `{ data: { sessions: [...] } }` — active refresh tokens (issued-after `exp` bookkeeping); no secrets | 401 |
| `DELETE /auth/sessions/:sessionId` | access | — | 200; invalidates that rotation token | 401, 404 |

Validation chains: §29 (`user.validator.js`). Passwords hash via
the §19 `pre('save')` hook with `BCRYPT_SALT_ROUNDS`; login uses
`comparePassword`. `firstName`/`lastName` derive from the email
local part per §19 at creation — never accepted from the client
(422 if present).

### 28.4 Auth middleware (`middleware/auth.js`)

`authenticate` reads the `accessToken` cookie, verifies the JWT
(secret, type `access`, expiry), loads the user by `sub`
(`select('+password')` never — plain `.lean()`), attaches
`req.user = { _id, email, firstName, lastName, fullName, avatar,
position }`, else 401. `optionalAuth` (used only by `GET
/auth/me`'s refresh-probe per §42) tolerates a missing cookie.
Per-domain routes apply `authenticate` on the protected group of
their route module (§30–§39); `/auth/register` and `/auth/login`
skip it; `/auth/refresh` uses the refresh cookie directly.
Controllers read `req.user._id` and `req.validated` and never
parse cookies themselves (§26.4).

### 28.5 Profile & avatar

- `PATCH /auth/profile` (access): updates `position`, `firstName`
  (only when not derived-locked — i.e. after any manual rename the
  value stands, §19), `avatar` (via multipart, §29 chain). Returns
  the fresh UserDto. The supervisor name used **at report capture
  time** is snapshotted (§21 `supervisorName`); later profile
  renames never rewrite stored report headers (§21.2).
- Avatar files land in `backend/uploads/avatar/` (gitignored,
  §19); served only through the auth'd `GET /auth/avatar` (access)
  — never via a public static mount (§26.4). Size/MIME limits via
  the §29 chain from `AVATAR_MAX_SIZE_BYTES` and
  `AVATAR_ALLOWED_MIME_TYPES` (§11.3).

### 28.6 Google OAuth stub (ADR-024/031)

The Google OAuth flow exists as a stub: `GET /auth/google`
responds 404 `NOT_FOUND` with the §69 open-question text in the
message ("Google sign-in is not available in this version"). No
Google-related env vars exist (§10.4 closed — no `GOOGLE_*`).
ADR-024 marks real integration as an open question; the
provider-neutral OAuth architecture (ADR-031) is limited to the
stub route shape today, subject to §14.5 amendment when real
integration is planned.

### 28.7 States & edge cases

- Login failure — 401, cookie-less response; refresh rotation
  collision (reuse of a rotated token) → clear both cookies and
  401 (theft heuristic, documented in §69).
- Duplicate registration email → 409 `CONFLICT` via the dup-key
  11000 detection (§27.5), message "This email is already
  registered".
- Cookie domain/path mismatches (refresh sent without access) →
  the client's §42 reauth loop re-issues through `/auth/refresh`;
  a wholly invalid refresh cookie → 401 and a client-side
  redirect to the login page.
- Profile rename before any report exists affects future
  snapshot values; after reports exist, only new reports carry
  the new name (BR-14 snapshot contract).

### 28.8 Verification usage

- Grep gates: `role` absent from any backend file; `GOOGLE_*`
  env reads absent (§10.4); the only `/auth/*` routes are the
  §28.3 table's; token secrets never logged (ADR-019); no
  `password` key in any response DTO; no user-delete endpoint.
- Cross-section checks: mirrors §19 (schema/hash), §11.3 (TTL
  constants), §27 (envelope/tiers), §29 (validators), §42
  (reauth), §57 (profile UI), §69 (OAuth open question).
- §28 introduces no constant (§11 unchanged), no path beyond
  §15.4, and no package; it references only specification
  sections.

---

## 29. Validators

### 29.1 Purpose & scope

§29 owns the server-side validation contract: the express-validator
rule chains per domain, the `validate()` harness, the 422 shape,
and the `req.validated` attachment consumed by controllers. It
exists because §12.5/§15.4 define the validator layer as the only
place validation rules live (besides bespoke patterns, §43.7) and
bans zod — validation is manual resolvers with the consistent
error shape (§2.5, §9, §29).

- **Owned here (normative).** The harness (`validators/validation.js`)
  and the 422 shape (§29.2); rule-chain conventions (§29.3);
  cross-domain rules (ids, dates, pagination, language, status,
  tokens) (§29.4); domain chains inventory (§29.5); verification
  (§29.6).
- **Owned elsewhere — deliberately not repeated here.** Business
  guards and status transitions = §30/§31 (the guard table);
  error envelope/status semantics = §27; field defaults = §11
  constants; audio MIME/size limits = §32; the server-reflection
  message mirroring = §31.
- **Explicitly out of scope §29.** No business-transition logic
  (guards live in services, never in validators), no new constant
  (§11 unchanged), no package.

### 29.2 Harness & 422 shape (ADR-016)

`validators/validation.js` exports `validate()`: runs
`validationResult(req)`; on failure responds 422 with the
**§27-owned shape** (envelope `{ success: false, message,
data: null }` with `details: [{ field, message }]` listing each
failed field — one entry per field, first failure wins per
field), then `next()`; on success attaches
`req.validated = { body, params, query }` via `matchedData(...)`
(only declared fields) and calls `next()`. Chain errors do not
abort before 422 — the harness aggregates them. `message` is
plain end-user language ("Check the highlighted fields" + per-
field messages in the details).

### 29.3 Rule-chain conventions

- One chain per domain: `validators/<domain>.validator.js`
  (kebab-case), imported by the §30–§39 route modules, mounted
  **before** the domain controller (`router.post('/', chain,
  validate(), controller)`).
- Rules reference `<entity>Id` params (`:reportId` etc.,
  §12.11-1), sanitize inputs (escape HTML in text fields per
  §61 policy — validators are also the sanitization gate), and
  use values from `httpStatus`/constants only.
- Numbers/dates: `isISO8601` (dates), `isInt` with min/max
  (pagination, `visitNo`, `sizeBytes`), enums via `isIn` on the
  §11.4 constant arrays (`REPORT_STATUSES` for the filter
  dimensions, `AI_PROVIDERS`, `AI_REASONING_EFFORTS`,
  `LANGUAGE_CODES`, `MESSAGE_ROLES`).

### 29.4 Cross-domain rules (shared)

- **Ids:** every `:xId` is a valid Mongo ObjectId — non-ObjectId
  params → 422 (never 404; §12.11).
- **Pagination:** `page` ≥ 1, `limit` 1..100 (`PAGINATION_MAX_LIMIT`),
  else 422; defaulting happens at the controller from
  `PAGINATION_DEFAULT_PAGE` / `PAGINATION_DEFAULT_LIMIT`.
- **Dates:** time fields use the `HH:mm` regex (`/^([01]\d|2[0-3]):[0-5]\d$/`), report dates ISO.
- **Status enum:** the transition-guard table is §31's; validators
  only check enum membership, never transitions.
- **Text security:** string fields pass the §61 escape/sanitize
  step (rich content = report/transcription text is stored as-is
  and sanitized at render; chrome strings are validated as plain
  text without HTML intent).

### 29.5 Domain chains inventory (`validate` lists per §30–§39)

`user.validator.js` (§28), `branch.validator.js` (§30),
`report.validator.js` (§31), `audio.validator.js` (§32),
`transcription.validator.js` (§33/§35), `chat.validator.js`
(§36), `export.validator.js` (§37), `analytics.validator.js`
(§38), `search.validator.js` (§39), `mock.validator.js` (§40).
Each owns the field-level rules of its domain contract; the
domain sections name the specific rules inline (validators are
the mechanical home — section text is normative, chain code is
its mirror).

### 29.6 Verification usage

- Grep gates: no validator chain constructs a status transition
  or a business guard; every route module mounts `validate()`;
  no zod dependency; 422 shape only from `validation.js`.
- Cross-section checks: mirrors §27.5 (envelope), §11.4 (enums),
  §30–§39 (per-domain rules), §61 (sanitize policy), §43.7
  (client mirror; bespoke default).
- §29 introduces no constant (§11 unchanged), no path beyond
  §15.4, and no package; it references only specification
  sections.

---

## 30. Branch API

### 30.1 Purpose & scope

§30 owns the Branch endpoints — the CRUD, archive/restore, and
permanent-delete lifecycle (BR-14 two-path deletion) for the
branches a supervisor manages (§3.1.2 F2). It is the first
domain API because every report flow consumes the branch
surface: the §31 creation steps reference active branches, and
the snapshot discipline (BR-14) starts here.

- **Owned here (normative).** The branch list/filter contract
  (§30.2); create (§30.3); update (§30.4); archive/restore
  (§30.5); permanent delete (§30.6); ownership & edge cases
  (§30.7); endpoints matrix (§30.8); verification (§30.9).
- **Owned elsewhere — deliberately not repeated here.** Branch
  schema/snapshot/tombstone = §20; envelope/errors/pagination/
  transactions = §27; validators = §29; sweeper hard-delete =
  §62; the branch page UI = §41.5; constants = §11
  (`PAGINATION_*`, `ARCHIVED_TTL_SECONDS`).
- **Explicitly out of scope §30.** No transition rule for
  reports (§31), no digest/header composition (§6.11/§31), no
  analytics aggregation (§38), no new constant (§11 unchanged),
  no package.

### 30.2 List & filters

`GET /branches` (access, global tier §27.3) — paginated
(§27.6). Filters:
- `isArchived` **absent or `false`** → **active only** (default,
  BR-14 semantic: archived hidden unless explicitly asked);
  `isArchived=true` → archived only. Query items: `page`,
  `limit`, `sort` (`name` asc default), `isArchived`.
- Response: §27.4 envelope with `data: { docs, page, limit,
  totalDocs, totalPages }`; each `docs` item is the BranchDto:
  `{ _id, user, name, location, isArchived, archivedAt,
  createdAt, updatedAt }` — the model's serialized surface
  (§27.4), no additions.
- Errors: 422 invalid filter values; 401 unauthenticated.

`GET /branches/:branchId` (access) — BranchDto; 404 when not
found **for this user** (BR-13 scoping — the query is
`{ _id, user }`, so another user's branch never leaks a 403 or
a 404 difference beyond the same 404).

### 30.3 Create

`POST /branches` (access): `{ name, location }` (both required
strings, trimmed, `location` optional? no — required per §20:
`location` is a required field; but the branch picker's usage:
the creation form in §41.5 requires both). 201 CREATED with
BranchDto. Validation: non-empty `name` (1..100 chars),
`location` (1..200), no duplicate-name constraint (no unique
index, §20). Transaction: single-doc session write (§27.7).

### 30.4 Update

`PATCH /branches/:branchId` (access): `{ name?, location? }` —
at least one field required. Returns the fresh BranchDto.
**Never cascades into reports** (BR-14: report snapshot
`branches[].name` is immutable once captured; §20/§21).
Archived branches remain updatable (rename before deletion is
allowed; the snapshot contract is unaffected).

### 30.5 Archive / Restore (BR-14 two-path step 1)

- `POST /branches/:branchId/archive` (access): sets
  `isArchived=true`, `archivedAt=now` in one session; 200
  BranchDto. Idempotent-ish: re-archiving an archived branch →
  409 `CONFLICT` (archive/restore lifecycle violation, §27.5).
- `POST /branches/:branchId/restore` (access): clears both
  (`isArchived=false`, `archivedAt=null`); 200 BranchDto;
  restoring an active branch → 409.
- Either is forbidden on a branch that is a tombstone (belongs
  to another user → 404, BR-13).
- **Archive implications:** archived branches disappear from
  default listings (§30.2) and are hidden in the §31 branch
  options (active-only rule referenced at §20/§31); reports
  keep their snapshot names.

### 30.6 Permanent delete (BR-14 step 2, BR-15)

`DELETE /branches/:branchId` (access): **no immediate hard
delete** — BR-15/§62 own the timing. The endpoint performs the
archive as the deletion's step-1 (sets `isArchived=true`,
`archivedAt` if not yet) and **returns 202-style semantics via
OK** with `data: { archived: true, message: 'Branch archived —
it will be permanently removed after the retention period' }`
(precise copy is §60's catalogue; chrome per §7.6). The actual
row removal happens only in the sweeper after
`ARCHIVED_TTL_SECONDS` (30 days) — the only hard-delete path
(BR-15, §62). There is no `deletedAt` anywhere (§18.3/§20).

### 30.7 Ownership & edge cases

- BR-13: every query carries `user: req.user._id`; a branch of
  another user is indistinguishable from nonexistent (404).
- Duplicate-name create is allowed (no unique index, §20 —
  names are free-form).
- A branch can be renamed/archived/deleted while reports
  reference it — snapshots hold the display truth; the
  `branches[].branch` join key returns `null` on tombstone and
  the reads render the snapshot (never an error, §17.4).
- Long lists: pagination is server-side only (ADR-034); the
  client never holds more than the current page.

### 30.8 Endpoints matrix

| Method+Path | Auth | Request | Success | Errors |
|---|---|---|---|---|
| `GET /branches` | access | query `{ page, limit, sort, isArchived }` | 200 paginated BranchDtos | 401, 422 |
| `GET /branches/:branchId` | access | — | 200 BranchDto | 401, 404 |
| `POST /branches` | access | `{ name, location }` | 201 BranchDto | 400/422 |
| `PATCH /branches/:branchId` | access | `{ name?, location? }` | 200 BranchDto | 400/422, 404 |
| `POST /branches/:branchId/archive` | access | — | 200 BranchDto | 401, 404, 409 |
| `POST /branches/:branchId/restore` | access | — | 200 BranchDto | 401, 404, 409 |
| `DELETE /branches/:branchId` | access | — | 200 (archived→retention) | 401, 404, 409 |

### 30.9 Verification usage

- Grep gates: no branch route writes outside a session (§27.7);
  no hard-delete in any branch controller (only archive); no
  `deletedAt`; no snapshot rewrite on update; filters default to
  active-only; DTO keys exactly the Branch serialized surface.
- Cross-section checks: mirrors §20 (model), §27 (envelope/
  tiers/transactions), §29 (validators), §31 (branch options in
  report creation), §62 (sweeper), §41.5 (UI), §11 (constants).
- §30 introduces no constant (§11 unchanged — `PAGINATION_*`
  exist), no path beyond §15.4 (`branch.routes.js`), and no
  package; it references only specification sections.

---

## 31. Report & Status API

### 31.1 Purpose & scope

§31 is the **largest and most-referenced backend section**: the
Report endpoints, the status machine with the authoritative
transition-guard table (BR-06, ADR-003), the creation steps the
wizard mirrors (§52 references §31.2-1…§31.2-5), the cascade and
rewind rules (§17.4), the two-path lifecycle (BR-16), and the
accept flow (BR-08). Every Part D page (§49–§52) and Part C
section (§32–§39) hangs on this section.

- **Owned here (normative).** Report creation steps (§31.2);
  detail/list contracts (§31.3); the status machine and the
  transition-guard table (§31.4); visit/content update endpoints
  (§31.5); correction & accept flows (§31.6); the two-path
  lifecycle (§31.7); cascade/rewind and presence invariants
  (§31.8); endpoints matrix (§31.9); verification (§31.10).
- **Owned elsewhere — deliberately not repeated here.** Audio
  upload = §32; transcription = §33; generation = §34;
  correction service internals = §35; chat = §36; export = §37;
  retention timing = §62; the wizard UI = §52; the details page =
  §51; envelope/errors/transactions = §27.
- **Explicitly out of scope §31.** No STT/AI provider calls
  (§33–§35), no new constant (§11 unchanged — `REPORT_STATUSES`,
  `ARCHIVED_TTL_SECONDS`, `SWEEPER_INTERVAL_MS` exist), no path
  beyond §15.4, no package.

### 31.2 Creation steps (§31.2-1 … §31.2-5)

The five creation steps are the server side of the wizard (§52);
the step list replicates the creation order of §6.3's field list
(reportDate, supervisorName) and the steps below — no separate
client registry exists.

**§31.2-1** `POST /reports` (access): `{ supervisorName,
reportDate }` (reportDate optional Date ISO) → 201 CREATED,
ReportDto at `draft`, `raw`/`latest` null, `visits: []`,
`branches: []`. The report row exists before visits/audio;
wizard step 1 maps here. No `lng`/`lat` exists anywhere (§21.2)
— no coordinate endpoint exists, and none is planned.
Validation: `supervisorName` 1..100.

**§31.2-2** `PATCH /reports/:reportId/visits` (access): replaces
the `visits[]` capture block (validates each entry:
`branchId` → resolves to an **active** branch of this user, sets
`branchName` = that branch's `name` snapshot at the same capture
moment and updates `branches[]` members to match (§21.2
equality by construction); `clockIn` and `clockOut` are both
required per visit — `HH:mm` (the day clock rule of §6.3 field 8
and §21.2: on a single-visit day the visit pair is the day pair,
auto-set by the wizard; on multi-visit days every visit carries
its own pair); the branch's
active state is checked here, **not** in §30). Returns the
ReportDto with both blocks.

**§31.2-3** audio attach: upload endpoints of §32 (`POST
/reports/:reportId/visits/:visitNo/clips`); the first clip moves
the status per §31.4 (draft → audio_attached).

**§31.2-4** transcription + review: §33 pipelines; review
decisions are §31.6's accept-of-transcription (per-clip
accept) and §35's corrections.

**§31.2-5** generation: §34 writes `raw`/`latest`; report moves
to `reviewed` per §31.4.

Each step's guard: forward-only per §31.4; client-side mirroring
posts through these calls on each completed wizard step (the
per-step save; no client autosave — the server owns every write).

### 31.3 Detail & list

- `GET /reports/:reportId` (access): 404 on not-found-for-user
  (BR-13). Response ReportDto (list DTO): the serialized surface
  minus heavy fields — `raw`/`latest` **excluded** unless
  `?withContent=true` (details page fetches with the flag;
  §51 relies on `latest`; ADR-034). Includes `branches[]`
  (snapshot), `visits[]`, status, dates, `isArchived`.
- `GET /reports` (access): paginated; filter dimensions: `status`
  (enum from `REPORT_STATUSES`), `branchId` (multikey index
  `user + branches.branch`), `isArchived` (default hidden),
  `search` (delegated to §39), `sort` (`reportDate` desc,
  `createdAt` tiebreak, §21 index). Data: list DTOs, heavy fields
  absent.

### 31.4 Status machine & the transition-guard table (normative)

States = `REPORT_STATUSES` order. The table below **is the only
transition authority** — §51/§52 UI actions reuse it identically
(BR-06 note); services and validators never hold their own copy.

| From | To | Guard / trigger | Owner |
|---|---|---|---|
| `draft` | `audio_attached` | first clip uploaded (§32.2) | §32 |
| `audio_attached` | `transcribed` | every audio has a transcription row with `raw` set (§33.5) | §33 |
| `transcribed` | `reviewed` | generation completed: `raw`/`latest` written, report content exists (§34.4) | §34 |
| `reviewed` | `completed` | super.-accept (§31.6 Accept; BR-08) | §31 |
| `completed` | *(none)* | forward-locked; content stays editable via §35/§31.6 (BR-10); re-transcription and audio add/remove are frozen at `completed` (BR-12 end, §31.8) — corrections are the §35/§54 Modes 1–3 path | §31/§35 |
| `audio_attached` | `draft` | **last audio deleted** (single explicit backward transition, ADR-003) | §32/§31 |
| `transcribed` | `audio_attached` | **last audio deleted** | §32/§31 |
| `reviewed` | `transcribed` | re-transcription of any clip invalidates the review lock (ADR-030; §33.6) | §33 |
| `reviewed` | *(no other)* | generation reruns? — regeneration is allowed only from `transcribed` (the §34 regen gate: content regenerates against the reviewed transcription, but the **status index** is `reviewed`; no separate transition row needed — regen keeps status; §34.3) | §34 |

**Guard principles:** never skip states forward except the listed
steps; no implicit rewind on edits (BR-10 — edits never rewind);
the only rewind paths are the last-audio rewind and the review
invalidation; archive/restore (BR-16) is orthogonal to status
(guards apply within archived reports for
content-changing actions; read-only views still open).

### 31.5 Visit & content updates

- `PUT /reports/:reportId/visits/:visitNo` — update a single row
  (branch/time fields); re-runs §31.2-2's rules for the row;
  clears `branchDigest` in the same session (§6.11 stale marker).
- `DELETE /reports/:reportId/visits/:visitNo` — removes the row;
  its clips remain bound (`report, visitNo` exact — §32/§22)
  and stay attached (their visit is still a captured memory);
  the report row is never deleted by this; clears `branchDigest`
  — at the next derivation point the removed visit's items become
  `unassignedItems` (edge case 4, §6.10).
- `PATCH /reports/:reportId` — header fields
  (`supervisorName`, `reportDate`) — the wizard's step-1 save.

### 31.6 Accept, corrections & content endpoints

- **Accept transcription (per clip):** `POST
  /reports/:reportId/transcriptions/:transcriptionId/accept`
  — BR-08's review gesture per clip: marks that clip's
  transcription as reviewed by the supervisor. It is a **review
  gesture only — it never changes the report status**: the
  `transcribed → reviewed` move is owned by generation (§34.6),
  and `reviewed → completed` by the Accept-report action below.
The gesture exists for BR-08's review-then-accept flow (§5.3,
  §23.4); there is no per-clip stage strip and no per-clip
  transition gate.
- **Accept report:** `POST /reports/:reportId/accept` — only
  from `reviewed` (guard from the table); when `branchDigest` is
  null (stale, §6.11/§21.2) it first runs the §6.11 digest
  derivation (the §34.5 provider chain, generation parameters —
  §11.3) for the current `latest`; provider exhaustion → 502 with
  no state change. Gate (§6.11): a fresh digest whose
  `unassignedItems` is non-empty → 422 with the unassigned item
  texts (§27.5 semantics) — the UI routes to the Unassigned panel
  (§54); nothing is dropped silently. Otherwise it fixes `latest`
  as the accepted content (BR-08/BR-11) and sets `completed`.
  Returns the ReportDto. 403 on wrong state with the §27.5
  semantics ("Report is not ready to be completed").
- **Digest re-derivation retry:** `POST /reports/:reportId/digest`
  (access, ai tier §27.3) — re-derives a stale or missing
  `branchDigest` on demand (the corrective path after
  post-`completed` corrections, which never run an automatic
  derivation — §6.11); 200 with the fresh digest; 502 on provider
  exhaustion (+ a §36 assistant note); 409 on a fresh digest
  (nothing to do).
- **Correction endpoints** (wired to §35 service); every content
  write in this list **clears `branchDigest`** in the same session
  (the stale marker of §6.11/§21.2):
  - `PATCH /reports/:reportId/content` — Mode-1 save: replaces
    `latest` with the client's corrected content (sanitized
    §61); allowed at every status including `completed`
    (BR-10); never touches `raw` (BR-11); no model call (§35.8).
  - `POST /reports/:reportId/correct` — Mode-2/3: typed
    instruction OR voice-correction clip (multipart) → the §35
    service rewrites only the relevant part (BR-09) and writes
    the result to `latest` on Accept (the §35 accept→save
    flow); returns the corrected content snapshot.
  - `POST /reports/:reportId/content/revert` — single undo:
    copies `raw` → `latest` while they differ (BR-11); 200 con
    `data: { content: latest }`; clears `branchDigest` because
    the content changed (the accept re-derives, §6.11).

### 31.7 Two-path lifecycle (BR-16, mirrors §30.5)

- `POST /reports/:reportId/archive` / `POST /reports/:reportId/restore`
  — set/clear `isArchived`/`archivedAt`; 409 on state mismatch;
  archive allowed at any status (including `completed`).
- `DELETE /reports/:reportId` — step 1 archive (BR-15; the
  physical removal happens in the §62 sweeper after 30 days).
  Hard-delete cascade is §62's, always in session
  (audio docs + `fs.unlink` after commit, transcription rows,
  conversation row); no `deletedAt`.

### 31.8 Cascade / rewind / presence invariants

- **Last-audio rewind** (ADR-003): deleting the last audio of an
  `audio_attached` report rewinds to `draft`; of `transcribed`/
  `reviewed` to `audio_attached`; a `completed` report never
  rewinds (deletion = storage hygiene) — the §51.4 confirm copy
  states the consequence (§32 owns the audio endpoint; §31 owns
  the transition).
- **Presence map** (§17.6): `draft` = row only; `audio_attached`
  = +≥1 Audio row; `transcribed` = + transcription(s) `raw`
  (= `latest`); `reviewed` = `raw`/`latest` written by generation
  (the review lock is implicit — being at `reviewed` means a
  generation exists, §34.6; content stays editable, §23.4, BR-10);
  `completed` = accepted content fixed. No other data may
  change status.
- **Tombstones:** deleted branch `branch` refs → `null` join;
  reads render `branches[].name` / `visits[].branchName`; never
  an error; analytics/export/search honor it (§17.4).
- **Concurrency:** every write in §31.5/§31.6 runs in the §27.7
  session template; version/reject conflicts surface via §27.5
  as a toast on the client (§60) — never a silent overwrite.

### 31.9 Endpoints matrix (Report domain)

| Method+Path | Auth | Request | Success | Errors |
|---|---|---|---|---|
| `POST /reports` | access | `{ supervisorName, reportDate? }` | 201 ReportDto | 401, 422 |
| `GET /reports` | access | query filters + pagination | 200 list | 401, 422 |
| `GET /reports/:reportId` | access | `?withContent` | 200 ReportDto | 401, 404 |
| `PATCH /reports/:reportId` | access | `{ supervisorName?, reportDate? }` | 200 | 404, 422 |
| `PATCH /reports/:reportId/visits` | access | visits block (day clock pairs, OQ-002 §6.3) | 200 | 404, 422 |
| `PUT /reports/:reportId/visits/:visitNo` | access | visit fields | 200 | 404, 422, 403 (archived) |
| `DELETE /reports/:reportId/visits/:visitNo` | access | — | 200 | 404 |
| `POST /reports/:reportId/transcriptions/:transcriptionId/accept` | access | — | 200 | 404, 403 (state) |
| `POST /reports/:reportId/accept` | access (ai tier when a derivation runs, §6.11) | — | 200 ReportDto | 404, 403, 422 (unassigned gate), 502 (derivation) |
| `POST /reports/:reportId/digest` | access (ai tier §27.3) | — | 200 fresh digest | 404, 409 (already fresh), 502 |
| `POST /reports/:reportId/generate` | access (ai tier §27.3) | — | 200 generated content | 404, 403 (regen gate), 502 (providers) |
| `PATCH /reports/:reportId/content` | access | content replaced | 200 `{ content }` | 404, 422 |
| `POST /reports/:reportId/correct` | access | instruction or multipart clip | 200 corrected snapshot | 404, 502 (providers) |
| `POST /reports/:reportId/content/revert` | access | — | 200 `{ content }` | 404 |
| `POST /reports/:reportId/archive` / `restore` | access | — | 200 | 404, 409 |
| `DELETE /reports/:reportId` | access | — | 200 (archived→retention) | 404, 409 |

### 31.10 Verification usage

- Grep gates: exactly one transition-guard table in the
  codebase (this section); no `..accept()` outside §31.6; no
  status writes outside the §31 tables; no `lng`/`lat` anywhere
  (§21.2 — no coordinate field, no endpoint).
- Cross-section checks: mirrors §11 (`REPORT_STATUSES`,
  `ARCHIVED_TTL_SECONDS`), §17.4 (§17.6 presence), §20 (active
  branch check), §21 (fields/snapshot), §27 (envelope/tiers),
  §29 (validators), §32–§35 (pipeline wiring), §51/§52 (UI
  actions reuse the table), §62 (sweeper).
- §31 introduces no constant (§11 unchanged), no path beyond
  §15.4, and no package; it references only specification
  sections.

---

## 32. Audio Upload & Storage

### 32.1 Purpose & scope

§32 owns the audio clip surface (BR-02): upload, list, play/
download, delete, and the storage discipline — metadata-only
documents with binaries on the local filesystem (§22, §12.9/§17.5)
and the hard rule that `filePath` never reaches a client (§22.7,
DTO gate). It is also the step-3 birth of the status machine
(§31.4: first clip → `audio_attached`; last-clip deletion →
rewind).

- **Owned here (normative).** Upload endpoint & multer con-
  figuration (§32.2); clip listing, play streaming, per-visit
  binding (§32.3); clip deletion & the rewind rule (§32.4);
  temp-cleanup and file lifecycle (§32.5); states & edge cases
  (§32.6); endpoints matrix (§32.7); verification (§32.8).
- **Owned elsewhere — deliberately not repeated here.** The Audio
  model and its cascade rules = §22; the STT pipeline feeding on
  physical files = §33; status transitions = §31.4; validators
  = §29; constants = §11.3 (`AUDIO_MAX_*`,
  `AUDIO_ALLOWED_MIME_TYPES`); recording UX = §53; the clip list
  UI = §51.4/§46.17.
- **Explicitly out of scope §32.** No STT call, no streaming of
  any kind (D2 — files play via HTTP range, never wss/SSE), no
  new constant, no path beyond §15.4 (`uploads/audio/`,
  `audio.routes.js`), no package (multer already in §13).

### 32.2 Upload

`POST /reports/:reportId/visits/:visitNo/clips` (access, global
tier): multipart/form-data with one file part `clip` plus a
`language` field (default `am`, must be a `LANGUAGE_CODES`
member). Rules:

- MIME in `AUDIO_ALLOWED_MIME_TYPES`; size ≤ `AUDIO_MAX_SIZE_BYTES`
  (50 MB); duration ≤ `AUDIO_MAX_DURATION_SEC` (900 s) verified
  via ffprobe (informational `durationSec`; the §29 chain enforces
  the file, the multer `limits` enforce size, ffprobe enforces
  duration). Video MIME (`video/*`, `.mp4`) is rejected with the
  §19.1 placeholder message (deferred D1) — 422.
- Store under `backend/uploads/audio/` (gitignored, multer
  destination; filename = `{$reportId}-{$visitNo}-{$timestamp}` +
  sanitized extension, no user input in names). Bindings
  `{ report, visitNo }` written in the same §27.7 session that
  inserts the Audio doc (`visitNo` must equal a member of the
  owning report's `visits[].visitNo` — 422 otherwise; audio can
  be bound to a removed visit only until the visit's own
  removal, never after re-use).
- Response 201: AudioDto — `{ _id, report, visitNo, mimeType,
  sizeBytes, durationSec, createdAt, updatedAt }` (all fields,
  no `filePath`). First clip of the report triggers
  `draft → audio_attached` (§31.4, §32 session).
- `video` clips rejected; silent `audio/webm` uploads accepted
  for storage (metadata-only) but the §33 pipeline never feeds
  webm — chunk MIME is §33's own rule (uploaded webm is
  converted by the pipeline).

### 32.3 Listing & playback

- `GET /reports/:reportId/visits/:visitNo/clips` (access):
  200 list of AudioDtos, ordered by `createdAt` asc (§22 —
  within a visit, chronological by creation, never array
  position). Empty list → `docs: []` (no 404).
- `GET /audios/:audioId` (access): metadata AudioDto; 404 for
  not-owned.
- `GET /audios/:audioId/play` (access): streams the physical
  file with `Accept-Ranges`/HTTP range support and the stored
  `mimeType` (browser audio element; no resumable-S3, no
  signed URL — plain authenticated range streaming). Headers:
  `Content-Type: mimeType`, `Accept-Ranges: bytes`,
  `Cache-Control: private`. 404 when the file is missing (the
  doc's binary already cleaned — edge §32.5), 403 for
  not-owned.

### 32.4 Deletion & the rewind rule

`DELETE /audios/:audioId` (access): removes the Audio doc + its
transcription (cascade in-session, §22/§23) and, after commit,
`fs.unlink`s the physical file (failure → orphan-sweep retry,
§62). Status consequences per §31.4 — this endpoint applies the
appropriate rewind when the deleted clip was the report's last:
`audio_attached → draft`, `transcribed`/`reviewed →
audio_attached`; `completed` never rewinds (deletion is storage
hygiene only). Response 200 `{ data: null, message }` (message =
§60 catalogue copy — "Clip deleted" with the rewind sentence in
the §51.4 confirm dialog). A `completed` report's deletion
stays within the session and never touches status.

### 32.5 Temp-cleanup & file lifecycle

- Multer temp/partial failure: uncommitted files (validation
  failure, session abort) are removed by the controller's
  cleanup in the same request (finally); anything leaked beyond
  a request is the orphan sweep's second pass (§62).
- Files are not served by any public mount (§26.4); avatar files
  share the discipline (§28.5).
- The Audio doc's binary is never re-uploaded; transcriptions
  reference audio doc ids, not paths.

### 32.6 States & edge cases

- Race: upload session aborted after multer wrote a physical
  file — controller cleanup unlinks it; sweeper covers rest.
- File missing (manual deletion from disk): play returns 404
  with the toast copy; the doc remains (the sweeper cleans it
  with the owning report's lifecycle).
- Deleting an audio of a visit whose `visitNo` no longer exists
  on the report: allowed (binding is exact-key, §22) — the
  report row itself is never deleted by this path.

### 32.7 Endpoints matrix

| Method+Path | Auth | Request | Success | Errors |
|---|---|---|---|---|
| `POST /reports/:reportId/visits/:visitNo/clips` | access | multipart `clip` + `language` | 201 AudioDto | 401, 404 (report/visit), 422 (MIME/size/duration/binding), 413 via multer → 422 mapping |
| `GET /reports/:reportId/visits/:visitNo/clips` | access | — | 200 list | 401, 404 (report) |
| `GET /audios/:audioId` | access | — | 200 AudioDto | 401, 404 |
| `GET /audios/:audioId/play` | access | — | 200 stream | 401, 403, 404 |
| `DELETE /audios/:audioId` | access | — | 200 | 401, 404 |

### 32.8 Verification usage

- Grep gates: `filePath` absent from every DTO/response (§22.7);
  no `GridFS`/`S3`/`wss`/`/api/v1/audio` proxy anywhere (§16.3
  gate, §4.1 D2); video MIME rejection present; rewind logic
  only here + §31.4 (single place); `fs.unlink` only after
  commit.
- Cross-section checks: mirrors §22 (model, DTO), §11.3
  (limits), §29 (validators), §31.4 (status), §33 (pipeline),
  §53 (client limits — the same constants), §19.1 (video out),
  §62 (orphan sweep), §27 (envelope/session template).
- §32 introduces no constant (§11 unchanged), no path beyond
  §15.4, and no package; it references only specification
  sections.

---

## 33. STT Pipeline

### 33.1 Purpose & scope

§33 owns the speech-to-text pipeline — the accuracy-critical
Amharic transcription step (ADR-001, ADR-007, SC-1): ffmpeg
preparation, PCM-level WAV chunking via
`utils/wavSplitter.js`, Addis AI STT (exclusively — ADR-001,
§12.11-5), and the persistence of `raw`/`latest` on the
Transcription doc (§23, BR-11). It also owns re-transcription
(ADR-030) and the status entry into `transcribed` (§31.4).

- **Owned here (normative).** Pipeline contract & stages (§33.2);
  chunking (ADR-007) (§33.3); the Addis STT call (§33.4);
  persistence & the `transcribed` gateway (§33.5);
  re-transcription (ADR-030) (§33.6); failure handling &
  retries (§33.7); endpoints (§33.8); verification (§33.9).
- **Owned elsewhere — deliberately not repeated here.** Upload
  and storage = §32; the Transcription model = §23; status
  transitions = §31.4; provider call envelope (transport, retry
  semantics, logging labels) = §16; constants = §11.3
  (`ADDIS_AI_STT_MAX_DURATION_SEC`, `AI_PROVIDER_RETRIES` etc.);
  mock STT = §25/§40; corrections = §35.
- **Explicitly out of scope §33.** No Gemini/NVIDIA involvement
  (ADR-001), no new constant (§11 unchanged), no new path beyond
  §15.4 (`transcription.routes.js`), no package.

### 33.2 Pipeline contract

`POST /reports/:reportId/transcribe` (access, **ai tier**
§27.3) triggers transcription for one report: the service
(`services/stt.service.js`, the only layer calling `addis`) walks
the report's audios in `visitNo`+`createdAt` order (§32.3),
transcribes each (or skips audios that already have a
transcription row), and returns progress. Chunks within one
audio are transcribed and concatenated (§33.3/§33.4). The
pipeline is **synchronous request/response** (no streaming, no
queue — §4.1 D2); long clips take the request time, bounded by
the 900 s audio cap and the 60 s chunk threshold.

### 33.3 Chunking (ADR-007, accuracy-critical)

- `utils/wavSplitter.js` (PCM-level, §15.4) splits a WAV-stream
  into ≤60 s pieces (chunk break at silence when a natural
  boundary is near; constant `ADDIS_AI_STT_MAX_DURATION_SEC`);
  ffmpeg converts non-PCM uploads (mpeg/wav/mp4/webm → mono
  16-bit 16 kHz PCM) **before** chunking. Output chunks are the
  pipeline's own MIME (PCM or wav), never the uploaded
  `audio/webm` type (§22 note).
- The chunk boundary logic never reorders text; transcriptions
  concatenate chunk results in order with single-space joins —
  deterministic, no post-processing (§43.6 analog applies to
  STT output as raw material).

### 33.4 The Addis STT call

Provider client: native `fetch` + multipart (ADR-008),
`x-api-key: ADDIS_API_KEY`; endpoint per §16.4
(`data` object: audio blobs `request_data`, `language_code`
from the clip's stored `language` default `am`,
`target_language` `am` always); timeout `AI_TIMEOUT_MS`;
retry per §16.5 only on transport/5xx (per-provider counts);
429 → honor `Retry-After`. **No fallback chain for STT**
(ADR-001) — a failed chunk is marked failed, never sent to
Gemini/NVIDIA; per-chunk failures do not abort the whole clip;
transcription completes with the chunks that succeeded and the
§33.7 failure record.

### 33.5 Persistence & the `transcribed` gateway

On success the service writes the Transcription row in the
§27.7 session: `{ user, audio, raw, latest, language, stt:
{ requestId, model } }` — both texts equal (BR-11), the
`stt` subdoc from `usage_metadata.requestId` + the providers'
model string (ADR-019-permitted audit fields only; confidence
not persisted, §16.4/§23). The audio's `transcription` ref is
set in the same session (§22); when **every** audio of the
report has a transcription with `raw` set, the report moves
`audio_attached → transcribed` (§31.4 — the row state is simply
both texts written; there is no per-clip stage strip).
Re-transcribing (see §33.6) re-runs the row replace.

### 33.6 Re-transcription (ADR-030)

`POST /reports/:reportId/transcriptions/:transcriptionId/re-
transcribe` (access, ai tier): deletes the transcription row
and inserts a fresh one (`raw` = `latest` = new STT result)
atomically in one session, re-pointing `audio.transcription`
(§23). Availability per §31.4: at every status **except**
`completed` (BR-12 window); at `reviewed` the re-run
**invalidates the review lock** → report returns to
`transcribed` (single explicit backward path alongside the
last-audio rewind, ADR-003/ADR-030). Response: fresh
TranscriptionDto.

### 33.7 Failure handling & retries

- Chunk-level failure: report still moves to `transcribed` only
  when all chunks succeeded; otherwise the audio stays
  pending and the response returns `data: { completed, failed:
  [{ audioId, reason }] }`; the client's §51.4/§54 surface
  shows the retry affordance (the endpoint can be re-called —
  only failed/pending audios re-run; spans are idempotent).
- Provider-level exhaustion: 502 `BAD_GATEWAY` via the §27
  handler with user-facing message ("Transcription failed —
  please retry"); logs = provider, model, status, timing only
  (ADR-019).
- An empty transcription result (all-silence) is persisted as an
  empty-string `raw` (a valid result, not an error) and counts
  toward `transcribed`.

### 33.8 Endpoints matrix

| Method+Path | Auth | Tier | Request | Success | Errors |
|---|---|---|---|---|---|
| `POST /reports/:reportId/transcribe` | access | ai | `{}` | 200 `{ data: { completed, failed } }` — status advanced per §31.4 | 401, 404, 403 (archived/`completed`), 422 (no audios or all already transcribed), 502, 429 |
| `POST /reports/:reportId/transcriptions/:transcriptionId/re-transcribe` | access | ai | — | 200 TranscriptionDto | 401, 404, 403 (`completed`), 422, 502, 429 |
| `GET /reports/:reportId/transcriptions` | access | global | — | 200 list of TranscriptionDtos (`audio` ref, `language`, `raw`, `latest`, `stt.*`) | 401, 404 |

### 33.9 Verification usage

- Grep gates: Addis only in STT (no Gemini/NVIDIA client in
  `stt.service.js`); chunk length constant, never literal; no
  streaming markers (`res.` streams absent); `raw` written once
  (BR-11) and re-transcription visible as full row replace in
  one session; `retry` counts from the constants.
- Cross-section checks: mirrors §16 (transport, ADR-001/008/
  019), §23 (model, DTO), §31.4 (status), §32 (files),
  §25/§40 (mock STT rows), §11.3 (constants), §27 (envelope/
  tiers/sessions), §19.1/§4.1 (no streaming).
- §33 introduces no constant (§11 unchanged), no path beyond
  §15.4, and no package; it references only specification
  sections.

---

## 34. AI Report Generation Service

### 34.1 Purpose & scope

§34 owns the report-generation engine (G2, F5): the prompt
construction per §8, the structured-output schema, the provider
chain (ADR-014 with the fixed fallback `addis → gemini →
nvidia`), and the write of `raw`/`latest` plus the `transcribed
→ reviewed` gateway (§31.4). §34 is where §6 (format), §7
(language), and §8 (AI rules) become behavior.

- **Owned here (normative).** Trigger & preconditions (§34.2);
  prompt construction (§34.3); structured-output schema & parsing
  (§34.4); provider call & fallback (§34.5); persistence &
  status advance (§34.6); regeneration rules (§34.7); failure
  handling (§34.8); verification (§34.9).
- **Owned elsewhere — deliberately not repeated here.** Provider
  transport/retry/timing/logging = §16.5; the reviewed
  transcription (BR-07 source) = §23/§33; format, language,
  tone = §6–§8; validation = §31/§29; correction = §35; the
  conversation turns = §36; constants = §11.3 (`AI_*`).
- **Explicitly out of scope §34.** No STT (ADR-001, §33), no
  translation (D5), no new constant, no path beyond §15.4, no
  package.

### 34.2 Trigger & preconditions

`POST /reports/:reportId/generate` (access, **ai tier** §27.3).
Preconditions enforced server-side (403/422 semantics):

- status must be `transcribed` (every clip has a transcription;
  a `reviewed` report does not regenerate without first exiting
  review — §34.7);
- every audio has a non-null transcription `raw` (presence map,
  §17.6);
- report not archived (403).

The response is synchronous: 200 with the generated content and
the report's fresh DTO only after persistence (§34.6).

### 34.3 Prompt construction (per §8)

The production prompt is assembled from registry data — never
free-text literals:

1. **System/context:** the §6.2 skeleton (each slot named), the
   §6.3 field list with types, Type-1 vs Type-2 handling per
   §6.4, tone sample per §6.6 and §8.4, and the strict
   no-invention clause (BR-19: missing values stay blank/"not
   specified").
2. **Content blocks:** the capture data — `supervisorName`,
   `reportDate` (Ethiopian date per §6.3 display; stored UTC),
   `branches[]` snapshot names, `visits[]` (branchName + clockIn/
   clockOut), `language`, the **reviewed transcription**
   text (the §23 `latest` — BR-07 source of truth), and each
   clip's visit binding (`Audio.visitNo`, §6.10/§21.2) so the
   itemization of §6.11 can attribute by rule 2.
3. **Conversation history:** when regeneration needs it, the
   §36 conversation entries projected (`role` `user`/`assistant`
   only, content) bounded per §12.8; absent on first generation.
4. **Output contract:** structured JSON per §34.4.

### 34.4 Structured-output schema & parsing

Every provider call demands structured JSON (Gemini
`responseMimeType`/`responseSchema`; NVIDIA `response_format:
{ type: 'json_object' }`; Addis via explicit prompt instruction
— §16.4). Schema (owned here):

```json
{ "report": { "header": "string", "branchSections":
  [{ "branchName": "string", "activities": ["string"],
  "unresolvedIssues": ["string"], "generalOpinion": "string" }],
  "daySummary": "string", "exitTime": "string",
  "overallAssessment": "string" },
  "branchDigest": { "…": "the §6.11 digest (schemaVersion 1), complete" },
  "unassignedItems": [ { "text": "string" } ] }
```

All keys render in the §6 vocabulary; the field semantics follow
§6.3 exactly; `branchDigest` is the complete §6.11 digest document
for the day and `unassignedItems` carries every item attributed by
no §6.10 rule (never silently guessed). The service parses the
provider response;
schema-invalid/parse-failed → provider failure per §16.5
(retry, then fallback — never silent acceptance, SC-1 gate).
`finish_reason` must be `stop`; anything else is treated as
failure (§16.4). Temperature `AI_TEMPERATURE`, max output
`AI_MAX_OUTPUT_TOKENS`, `AI_TOP_P`, `AI_TOP_K` — all from §11.3.

### 34.5 Provider call & fallback (ADR-014)

`services/generation.service.js` uses the fixed chain
`addis → gemini → nvidia` (§11.4 `AI_PROVIDERS` order): try a
provider per §16.5 (transport/5xx retries × `AI_PROVIDER_RETRIES`,
backoff `AI_PROVIDER_BACKOFF_BASE_MS`, timeout `AI_TIMEOUT_MS`),
on exhaustion fall to the next; all exhausted → 502 via the §27
handler ("Report generation failed — please try again"). The
reasoning parameter is sent only when the chosen model's
`reasoning` capability flag is on (§16.4); Addis calls carry
`language_code`/`target_language` = `am`. The selected
`(provider, model, reasoning)` triple is recorded on the §36
conversation message for this generation turn (ADR-014); the
conversation row is created lazily at its first saved turn so
the audit trail lands with the content (§24, §36).

### 34.6 Persistence & status advance

In one §27.7 session: write `raw`/`latest` (**both** = the
generated content, BR-11 — `raw` written once, forever
untouched; `latest` starts equal), write the `branchDigest`
field from the same provider round (§6.11 — fresh by
construction), set the report status
`transcribed → reviewed` (§31.4 gateway). Response: 200 with
the ReportDto (`withContent` semantics — content included) and
`data.content`. Neither `acceptedAt` nor `exportedAt` is ever
stored (§21.2). The review lock is implicit: being at `reviewed`
means a generation exists.

### 34.7 Regeneration rules

Regeneration (`POST /reports/:reportId/generate` again) is
allowed only from `transcribed` (a report that left `reviewed`
via re-transcription, §33.6, may regenerate); from `reviewed` it
is refused 403 unless the report re-enters `transcribed` first
(no implicit rewind). Regeneration **overwrites `latest`** and
leaves `raw` alone (BR-11), and records the new turn on the §36
conversation. At `completed`: generation is refused 403 —
corrections are the §35 path (BR-10 keeps the report editable
via correction, not regeneration).

### 34.8 Failure handling

- Provider exhaustion → 502 (never a partial write; nothing is
  persisted on failure — `raw` stays null, status stays put).
- Timeout mid-attempt → treated per §16.5 (retried, then
  fallback); the single provider attempt is bounded by
  `AI_TIMEOUT_MS`.
- Content that fails the §6/§7 validation gates after a
  successful provider call → the service posts an
  **assistant note** to the §36 conversation ("content rejected
  by validation") and surfaces a 422 with the reason; the
  generation is not persisted (no false `reviewed`).

### 34.9 Verification usage

- Grep gates: the generation service is the only caller of the
  provider chain for text output; prompts assembled from the
  §34.3 blocks (no prompt literal outside the service file and
  §8's fixtures); the schema JSON keys = this section's keys;
  no Gemini/NVIDIA path in STT (§33); `AI_*` constants, never
  literals.
- Cross-section checks: mirrors §16 (ADR-008/014/019), §6–§8
  (format/language/tone), §21 (raw/latest), §31.4 (status
  gateway), §33 (transcribed input), §35 (corrections),
  §36 (conversation turns), §27 (envelope/tiers), §11.3
  (constants).
- §34 introduces no constant (§11 unchanged), no path beyond
  §15.4, and no package; it references only specification
  sections.

---

## 35. AI Correction Service

### 35.1 Purpose & scope

§35 owns the correction engine (G3, BR-09, BR-10, BR-11): the
three modes (Mode-1 typed Save, Mode-2 typed instruction +
Accept/Revert, Mode-3 voice-transcribed instruction) exposed by
§31.6's endpoints, and the **surgical partial-edit contract** —
only the relevant part changes, unrelated correct sections stay
identical (§2.2 G3, §2.4 SC-3). It is the machine behind the §54
components and the §51.5 actions.

- **Owned here (normative).** Mode contracts (§35.2); the
  partial-edit rule (BR-09) and the `±`-token protocol (§35.3);
  provider call & temperature (§35.4); accept → save flow
  (BR-11) (§35.5); voice-correction instructions (Mode 3)
  (§35.6); failure handling (§35.7); verification (§35.8).
- **Owned elsewhere — deliberately not repeated here.** Endpoints
  and their guards = §31.6; the transcription raw material for
  Mode 3 = §33; conversation history = §36; rendering/sanitizing
  = §61; providers/transport = §16.5; constants = §11.3
  (`AI_CORRECTION_*`).
- **Explicitly out of scope §35.** No generation (first-pass
  text = §34), no new constant, no path beyond §15.4, no
  package.

### 35.2 Mode contracts

| Mode | Endpoint (§31.6) | Input | Engine behavior |
|---|---|---|---|
| Mode-1 | `PATCH /reports/:reportId/content` | edited full content | no AI — the client's corrected text replaces `latest` directly (sanitized §61), allowed at every status incl. `completed` (BR-10) |
| Mode-2 | `POST /reports/:reportId/correct` | typed instruction (registry-guided; may name the exact §6.3 field/§6.7 content class) | prompts for a **partial edit**: returns only the changed `branchSections[]` slots with the reason (server vocabulary), to be merged on Accept |
| Mode-3 | `POST /reports/:reportId/correct` (multipart) | voice-correction clip → §33 STT → instruction text | same engine as Mode-2 fed from the transcription; the STT step is shared code with §33 (no second pipeline) |

### 35.3 Partial-edit rule (BR-09) & `±`-token protocol

- The prompt states the surgical contract verbatim: the
  instruction touches only the addressed section/value; every
  other §34.4 key is returned **byte-identical** to `latest`
  (the service diff-verifies: parts not in scope must be
  unchanged or the correction is rejected as provider failure
  and retried — SC-3 gate).
- **`±`-token protocol (normative):** official/entitled text the
  user must not freely alias is marked with the `±` prefix (the
  ±-token vocabulary of the official format, §64). The
  correction engine never resolves, strips, or translates `±`
  tokens (resolution is §37/§64's — the official-format
  decision), never lets a correction delete a `±` block
  silently (a `±` block deletion is only accepted when the
  instruction explicitly names it and the diff verification
  confirms it), and returns tokens verbatim in output. The
  §54/§53 surfaces render the tokens as-is with the "leave this
  token untouched" guidance (§53.4).

### 35.4 Provider call & temperature

Mode-2/3 run the §34.5 provider chain mechanics (ADR-014
fallback, ai tier, §16.5 retries) with the **correction
parameters**: `AI_CORRECTION_TEMPERATURE` (0.15) and
`AI_CORRECTION_MAX_OUTPUT_TOKENS` (2048) (§11.3), and the
correction-specific structured schema = a partial of the §34.4
schema: `{ changed: [{ section, field, content, reason }] }`.
Reason vocab: the server-returned `reason` sentences of the
§35.4 schema ("removed duplicate verb", "moved case FE
paragraph") — never invented client-side (§54.3). `reasoning`
params follow the model's capability flag (§16.4).

### 35.5 Accept → save flow (BR-11)

The corrected partial is **not written on generation**: the
service returns the staged corrected content (the "corrected-copy
strip" of §54 stages it client-side) and `latest` is persisted
**only when the user Accepts** — the Accept action of §31.6
writes the merged content to `latest` and completes the
correction turn. **Revert** (`POST /reports/:reportId/content/
revert`) restores `raw` → `latest` (single undo, BR-11) or
discards the staged copy. `raw` is never rewritten via
correction. `completed` reports accept corrections the same way
(BR-10). Staging is client-owned (the endpoints accept the full
target content to write); the server never keeps an unaccepted
edit beyond the request — no server-side pending-edit store
(ADR-033). Every content write of the accept→save flow clears the
stored `branchDigest` in the same session (the §6.11 stale marker —
this section's correction writes never call the provider for the
digest; it is re-derived at the next report accept or via the
manual retry `POST /reports/:reportId/digest`, §31.6).

### 35.6 Voice-correction instructions (Mode 3)

The mode-3 multipart upload reuses §32's multer/file rules and
§33's STT pipeline (`POST /reports/:reportId/correct` with a
`clip` part when a `mode` field equals `voice`): the clip is
transcribed (chunked per §33.3), the instruction text is the
transcription result, and Mode-2's engine runs against it. The
mode-3 clip is ephemeral — never stored as an Audio row, never
added to the clip list (§32 DTO gate); the resulting
instruction may be quoted into the §36 conversation as the
user's correction turn for the audit trail.

### 35.7 Failure handling

- Provider exhaustion → 502 with "Correction failed — please
  try again"; the staged copy survives (client-side) and retry
  re-runs from the same instruction.
- Schema-invalid correction output → provider failure per §16.5
  (retry → fallback); SC-3 diff failure retries once, then
  422 with the diff reason.
- Mode-3 clip corrupt/unreadable → 422 (STT failure map §33.7);
  the instruction never reaches the provider.

### 35.8 Verification usage

- Grep gates: no AI call in Mode-1 (pure write path); every
  content write clears `branchDigest` (§6.11 stale marker); the
  digest is re-derived only at the §31.6 accept and the manual
  retry endpoint — never inside a correction write; the
  correction service shares the §33 STT entry (no second
  pipeline); `±` unchanged across every service output; no
  server-side staging store; `AI_CORRECTION_*` constants used;
  the mode-3 clip never creates an Audio doc.
- Cross-section checks: mirrors §31.6 (endpoints/guards), §33
  (STT), §34.5 (chain), §54 (UI modes), §22 (copy vocabulary),
  §61 (sanitize on write), §27 (envelope/tiers), §11.3
  (constants).
- §35 introduces no constant (§11 unchanged), no path beyond
  §15.4, and no package; it references only specification
  sections.

---

## 36. AI Chat & Conversation API

### 36.1 Purpose & scope

§36 owns the conversation endpoints behind the correction chat
UI (F7): the lazy conversation row (§24 — one per report, unique
`report` ref), the message-append contract with the
`(provider, model, reasoning)` triple per message (ADR-014), the
message list DTO, and the `conversation_history` projection §34/
§35 consume. All §36 writes append inside the §27.7 session and
validate against the §11.4 registers before insert (triple
validated, §24).

- **Owned here (normative).** Conversation row creation
  (§36.2); the message endpoints (§36.3); the append contract
  and validation (§36.4); the history projection (§36.5);
  envelope/edge cases (§36.6); endpoints matrix (§36.7);
  verification (§36.8).
- **Owned elsewhere — deliberately not repeated here.** The
  ChatConversation model and indexes = §24; the provider
  transport = §16.5/§16.4; generation & correction feeding the
  history = §34/§35; the UI = §55; `MESSAGE_ROLES` = §11.4.
- **Explicitly out of scope §36.** No provider call (the chat
  is a correction interface; the AI call happens in §35 — the
  chat persists both sides of it), no new constant (§11
  unchanged — `MESSAGE_ROLES`, `AI_PROVIDERS`, `AI_MODELS`,
  `AI_REASONING_EFFORTS` exist), no package.

### 36.2 Conversation row creation

The conversation document is created **lazily at its first
saved turn** (§24): `POST /reports/:reportId/chat/messages`
creates the row (`{ user, report }`) when none exists, in the
same session as the first message append — never a separate
step, never created empty (grep gate: no preemptive
conversation creation in §31/§34). `GET /reports/:reportId/chat`
returns the conversation DTO; a report with no conversation yet
responds 200 with `data: { messages: [] }` (empty, not 404).

### 36.3 Message endpoints

- `GET /reports/:reportId/chat` (access, global tier): the
  conversation DTO — `{ _id, user, report, messages }`;
  messages surface exactly `role, content, provider, model,
  reasoning, createdAt` (§24.2 serialized surface), ordered by
  `messages.createdAt` (index §24), never by array index. `user`
  and `report` may be included; `content` is rendered sanitized
  client-side (§61).
- `POST /reports/:reportId/chat/messages` (access, **ai
  tier** §27.3): the **user** turn (text content, ≤
  `CHAT_MESSAGE_MAX_LENGTH` — 4 000 chars, §11.3)
  — validated against `MESSAGE_ROLES` (`user` only for this
  endpoint), `provider`/`model`/`reasoning` from the §11.4
  registers (non-member → 422, never stored (§24)). The row is
  created if needed and the message `$push`ed inside the §27.7
  session; the response is 201 with the fresh conversation DTO.
  The AI answer is generated by the §35 correction engine (or
  the §34 generation note) as a second message appended by the
  service, not by this endpoint (the endpoint never calls a
  provider itself — SC-7 is about the browser; the server
  always calls providers only in §33–§35 services).
- There is **no delete/update endpoint**: conversations are
  never individually archivable or deletable (§24) — their
  lifetime is the owning report's (cascade on hard-delete,
  §62).

### 36.4 Append contract & validation

Every append validates the message tuple (`role ∈ MESSAGE_ROLES`,
`provider ∈ AI_PROVIDERS` with `model ∈ AI_MODELS[provider]`,
`reasoning ∈ AI_REASONING_EFFORTS`) via the §29 chat validator
then §24.2's registry checks at save; `content` length ≤
`CHAT_MESSAGE_MAX_LENGTH` (§11.3); the validator references the constant — no literal. $push is the only message
write; no in-place updates, no array reordering (§24.2 caveats).

### 36.5 History projection

The `conversation_history` consumed by §34.3/§35.2 is a
projection of this collection: entries with `role` `user`/
`assistant` only (`system` notes are excluded from prompts),
content + createdAt, bounded to the recent
`AI_CONVERSATION_HISTORY_MAX_ENTRIES` entries (§11.3; §12.8
window). The projection is computed server-side in
the generation/correction service; the chat DTO is never sent
to the client in prompt form.

### 36.6 Envelope & edge cases

- Empty conversation read → `{ messages: [] }` (200).
- Message-length violations → 422 with field error.
- Concurrent appends to the same report (two tabs): each append
  is transactional; the unique `report` index + session make
  row creation race-safe (second creator receives 409 on the
  index conflict — mapped to 422 retry semantics by §29, or a
  natural re-read by the client).
- A deleted report's conversation: cascade removes it (§62);
  the client's §51 would already be gone.

### 36.7 Endpoints matrix

| Method+Path | Auth | Tier | Request | Success | Errors |
|---|---|---|---|---|---|
| `GET /reports/:reportId/chat` | access | global | — | 200 `{ data: { _id, user, report, messages } }` (empty allowed) | 401, 404 |
| `POST /reports/:reportId/chat/messages` | access | ai | `{ content, provider, model, reasoning }` | 201 conversation DTO with appended message | 401, 404, 422, 409 (row race) |

### 36.8 Verification usage

- Grep gates: no message update/delete endpoint; no conversation
  creation outside §36.2 (no preemptive rows in other services);
  the chat route never imports a provider client (only §33–§35
  services do); `MESSAGE_ROLES`/register validation references
  constants; no `reasoning_content` anywhere (§24).
- Cross-section checks: mirrors §24 (model), §34.3/§35.2
  (history consumers), §55 (UI), §61 (sanitize), §27 (tiers/
  sessions), §11.4 (registers), §62 (cascade).
- §36 introduces no constant (§11 unchanged — the 4 000-cap
  note points at §11's amendment channel), no path beyond
  §15.4, and no package; it references only specification
  sections.

---

## 37. Export API

### 37.1 Purpose & scope

§37 owns the **backend-side** export surface: the Google Docs
export (BR-18, ADR-006, §2.4 SC-5) into the user's own Google
Drive via `drive.file` scope with the user's own OAuth token,
and the authenticated proxy through which the client-side export
formats (§58) receive the report's current content. It exists
because ADR-006 reserves Google Docs for the backend (only the
backend may hold provider tokens; SC-7).

- **Owned here (normative).** Export content readiness (§37.2);
  Google Docs export (§37.3); the OAuth token contract (§37.4);
  the content-retrieval surface for §58 (§37.5); states & edge
  cases (§37.6); verification (§37.7).
- **Owned elsewhere — deliberately not repeated here.** The
  client-side PDF/TXT/CSV/XLSX flows = §58; retention of
  exported artifacts = §62; naming rules = §58 (OQ-006); the
  content that exports = §21/§22 (official text, `±` resolution
  = §64/§35.3).
- **Explicitly out of scope §37.** No client PDF generation,
  no conversion of content language (BR-17/D5), no new
  constant, no package (Google APIs absent from §13 — the stub
  holds; ADR-024 keeps real Google integration open in §69).

### 37.2 Export content readiness

Export requires `latest` (a generated report — `raw`/`latest`
non-null); a `draft`/`audio_attached` report's export call
returns 422 ("Nothing to export yet"). Export reproduces the
current accepted content (BR-18) at the moment of the request;
nothing is persisted (no `exportedAt` field anywhere, §21.2).

### 37.3 Google Docs export

`POST /reports/:reportId/export/docs` (access, global tier):
creates a Google Docs document in the **user's own Drive** with
the report's `latest` content (sanitized §61 server-side before
transmission) and `drive.file` scope. On success:
`200 { data: { documentId, url } }` (url = docs.google.com
document link). On missing/invalid token → 401-ish mapping via
ADL-024's stub: the flow requires the user's Drive OAuth token,
which **does not exist yet** (ADR-024 open) — the endpoint is
specified against a `drive` service interface whose
implementation is deferred:

- The `drive` service is the **only** Google-boundary module;
  it consumes a user-scoped OAuth token obtained through §28's
  OAuth architecture (ADR-031) when implemented; today the
  endpoint resolves to the §69 open question and the client
  shows the §58 copy ("Google Docs export is coming soon"),
  guarded by a constant `EXPORT_DOCS_ENABLED` (`false`, §11) —
  when the flag flips true the service becomes live without
  page changes.
- `±` tokens in `latest` are resolved **at export by the
  backend** (the §64 official-format decision boundary): the
  service replaces `±`-marked tokens with the corresponding
  official text from the ±-token vocabulary of §64 **only in the
  exported artifact**, never in stored content (BR-17: language
  unchanged; the resolution is format-only).

### 37.4 OAuth token contract

No Google env vars exist (§10.4 closed). When the open question
closes, the token arrives via §28's OAuth flow (ADR-031,
provider-neutral), stored server-side scoped to the user (no
bearer storage in the browser, SC-7), and refreshed through the
provider — this contract is written now; the implementation
flags off (§37.3).

### 37.5 Content-retrieval surface for §58

`GET /reports/:reportId/export/content` (access, global tier):
returns `{ data: { content: latest, reportDate, supervisorName,
branchNames } }` — the exact current content the browser-side
PDF/TXT/CSV/XLSX flows format (§58). `±` tokens are returned
**as-is** for the client formats (§58 prints them verbatim;
resolution happens only in the backend Google Docs path §37.3).
Content is returned raw-text (not HTML), sanitized per §61.

### 37.6 States & edge cases

- No `latest` → 422 (title copy per §60); archived reports may
  still export (read-only view, §51); `completed` status is not
  required (editable reports export their current `latest`,
  BR-10/BR-18).
- Google flag off → the §58 menu item disabled with "coming
  soon" tooltip; flag on → live path per §37.3.
- Drive quota/unauthorized → 502 mapping with the §60 toast
  copy; the client retries via the same button.

### 37.7 Verification usage

- Grep gates: the only Google API references live in
  `services/drive.service.js` behind the `EXPORT_DOCS_ENABLED`
  constant; no `GOOGLE_*` env reads; no `exportedAt` write; `±`
  untouched in stored content and in the §37.5 surface; no
  provider token in any client DTO.
- Cross-section checks: mirrors §58 (client flows), §27
  (envelope/tiers), §21.2/§22.3 (content), §61 (sanitize),
  §64 (`±` decision), §28 (OAuth architecture), §69 (open
  questions), §11 (`EXPORT_DOCS_ENABLED`).
- §37 introduces no constant (§11 — `EXPORT_DOCS_ENABLED`
  exists in §11.3 backend inventory), no path beyond §15.4, and
  no package; it references only specification sections.

---

## 38. Analytics API

### 38.1 Purpose & scope

§38 owns the analytics payload the §49 dashboard renders — KPI
counts and chart series computed **server-side over the report/
branch collections** (ADR-034: the client never aggregates;
§49.3's KPI table is this section's contract). It exists because
F9 names a dashboard, and §3.1.2/§49 reference this section as
the analytics data owner.

- **Owned here (normative).** The payload contract (§38.2); the
  KPI computation rules (§38.3); the chart series (§38.4);
  rollup & date semantics (§38.5); states & edge cases (§38.6);
  verification (§38.7); the **item-filter surface** of §6.11 —
  `GET /analytics/items` reads only stored digests (no model in
  the loop, §6.11 filtering contract).
- **Owned elsewhere — deliberately not repeated here.** The
  dashboard UI/KPI card mapping = §49; the report/branch fields
  aggregated = §20/§21; visibility = §3.2.3 (personal, BR-13);
  constants = §11.4/§11.3.
- **Explicitly out of scope §38.** No per-report detail data, no
  heavy joins beyond the aggregations below, no new constant
  (§11 unchanged), no package.

### 38.2 Payload contract

`GET /analytics/dashboard` (access, global tier) →
`200 { data: { kpis, charts } }`:

- **kpis** — `{ reportsThisMonth, inProgress, completed,
  activeBranches, trends? }` where trends (optional object,
  `reportsThisMonthDelta`, `completedDelta` etc.) may be present
  or absent — §49.3 renders no caption when absent (no invented
  numbers).
- **charts** — `{ statusDistribution: [{ status: <member of
  REPORT_STATUSES>, count }], activityByBranch: [{ name, count }
  ] (top N = 8, ordered desc), issuesTrend: [{ date,
  count }] }` — issuesTrend emits the §6.11 issue vocabulary's
  counts for the recent 30 days (the endpoint returns
  `[]`-series when the vocabulary is pending, §49.4's "pending
  contract" — the schema is fixed, the values may be empty).

All counts are **personally scoped** (BR-13: `user:
req.user._id` only); counts exclude archived reports (unless a
dimension says otherwise — none does).

**Item filters (the §6.11 contract).** `GET /analytics/items`
(access, global tier) returns digest items across reports with the
parameters of §6.11's filtering table (`branch`, `group`, `status`,
`dateFrom`/`dateTo`, `q`, `page`/`limit`; §27.4 envelope with
`docs/page/limit`). It reads **only stored digests** —
reports whose `branchDigest` is null (stale) are excluded and
surface as the §38.6 "pending re-derivation" state; no
derivation and no model call ever runs inside this endpoint.

### 38.3 KPI computation rules

- **reportsThisMonth** — reports whose `reportDate` falls in
  the current **Ethiopian month** (per §6.3/§43 display; the
  server normalizes: stored UTC dates are bucketed by the
  Ethiopian calendar month at computation time — no
  client-side calendar math, ADR-034).
- **inProgress** — count of `draft` + `audio_attached` +
  `transcribed` + `reviewed` (the §31 open-state set; if §31
  ever extends the open set, this list follows it).
- **completed** — count of `completed`.
- **activeBranches** — count of `isArchived: false` branches of
  this user (§20 surface).
- Sum constraint: `inProgress + completed ≤ reportsThisMonth`
  only holds when every report has a `reportDate`; reports
  without a `reportDate` count in none of the month buckets
  (BR-01/BR-19: missing stays missing — the KPI totals are per-
  dimension, never reconciled into a grand total here).

### 38.4 Chart series rules

- **statusDistribution** — one `$group` per `REPORT_STATUSES`
  member over non-archived reports; the five members always
  appear (zero-count statuses are emitted with 0 — the donut
  never drops a slice, §49.4).
- **activityByBranch** — reports grouped by active
  `branches[].name` snapshot (tombstone-safe: the snapshot
  name is aggregated even when the branch row is gone, §17.4);
  top 8 by count.
- **issuesTrend** — issue counting over stored digests'
  `issues[]` (the §6.11 vocabulary) by `reportDate` for each of
  the last 30 days; reports with a stale digest are excluded
  (the §38.6 state).

### 38.5 Rollup & date semantics

- Aggregations run via MongoDB `$match` + `$group` with the
  owner filter and `isArchived: false` in `$match` — no
  post-processing joins, no per-user aggregation maps cached
  (the query cost is bounded by the per-user index set §21).
- `reportDate` bucketing: server interprets the UTC date
  through the Ethiopian calendar month boundaries (the §6.3
  conversion at the boundary — exact mapping per §43.6 notes;
  week boundaries are not part of this contract).
- A `null` `reportDate` never breaks a bucket or the endpoint
  (404-free; the month bucket simply excludes it).

### 38.6 States & edge cases

- Empty account (no reports): kpis all zero, charts = five
  zero-slices + empty series — the §49 dashboard renders no
  account-level empty band (owner decision, R3-fix): each chart
  degrades to its own §60 empty state and the Latest-reports
  band renders its own (no special "no data" 200 variant; the
  client derives nothing from zeros beyond those per-surface
  states).
- Archive state: archived reports/`archivedAt` windows never
  feed the dashboard (consistent with §50's filters).
- A tombstoned branch's reports still count in
  statusDistribution/issuesTrend and appear under their
  snapshot name in activityByBranch (§17.4 rule).
- **Pending re-derivation (the stale-digest state):** a report
  whose `branchDigest` is null after a content or visits write
  (§31.5/§31.6) is excluded from item-level results and counted
  separately in `data.pendingRederivation` (a count, not a
  list) — the supervisor resolves it via the review accept or
  the manual retry `POST /reports/:reportId/digest` (§31.6);
  the state never affects report-level KPIs other than through
  that explicit count.

### 38.7 Verification usage

- Grep gates: the analytics controller contains the only
  aggregation pipelines in the backend (no `$group` elsewhere
  for UI data); no client-side reduction over list responses
  for KPIs (ADR-034); the payload keys match §49.3's table
  exactly; `REPORT_STATUSES` order preserved; no literal
  `200`-style special-casing.
- Cross-section checks: mirrors §49 (UI), §20/§21 (fields
  aggregated), §6.11 (vocabulary), §31 (open-state set), §17.4
  (tombstones), §11.4 (enums), §27 (envelope).
- §38 introduces no constant (§11 unchanged), no path beyond
  §15.4, and no package; it references only specification
  sections.

---

## 39. Global Search API

### 39.1 Purpose & scope

§39 owns the global search endpoint — the backend of the §59
search dialog: text search across the user's own reports,
drafts, branches, and transcription/audio content. It is where
the report text index question is decided (§21.4/§18.3 promise
"§39 will prove any text index it needs").

- **Owned here (normative).** Index decision & proof (§39.2);
  the endpoint contract (§39.3); result groups & scoring
  (§39.4); edge cases (§39.5); verification (§39.6).
- **Owned elsewhere — deliberately not repeated here.** The
  dialog UI = §59; list/pagination envelope = §27.4; validators
  = §29; entity serialization = §27.4/§19–§24.
- **Explicitly out of scope §39.** No cross-user search (BR-13),
  no search-index daemon (single-tenant per-user, bounded), no
  new constant, no package.

### 39.2 Index decision (normative)

Search is served by MongoDB **text indexes**, proven by this
usage: a single wildcard text index per collection is **not**
added blindly — instead exactly these scoped text indexes are
created (proven by the §38.4/§31.3 usage patterns and the
endpoint below):

- `reports`: text index over `{ supervisorName, 'branches.name',
  'visits.branchName' }` (the multikey snapshot arrays support
  text over array elements).
- `branches`: text index over `{ name, location }` (user-
  scoped).
- `reportDate` (§27.1) is a Date and MongoDB `$text` indexes

  string fields only — Date fields are never text-indexed; date
  search is out of scope (chronological access flows through
  §49.2's recent list and the §27.2 filters), proven by the
  §38.4/§31.3 usage patterns and the endpoint below.
- Transcription content (`transcriptions.latest`/`raw`) and
  audio `filePath` are **not** indexed for search (content
  search crosses into generation-prompts territory; BR-19;
  cost) — searches match report/branch fields only, and the
  §39.3 result for reports carries the matching report; further
  content search is a deferred feature (§4).
- Digest item text (`branchDigest.*.text`) is **not**
  text-indexed either: the §6.11 filtering `q` parameter reads
  directly over the stored digests of the filtered window
  (bounded per-user, §64 scale, ADR-034 pagination) — never
  over a content text index, never via a model call (§6.11).

### 39.3 Endpoint contract

`GET /search?q=...` (access, global tier): `q` 1–100 chars
(trimmed; empty → 422). Pagination `page`/`limit` (§27.6), and
`type` (optional: `report` | `branch`; absent = all). Response
§27.4: `data: { docs: [{ type, entityId, title, subtitle,
status?, matchedFields }], page, limit, totalDocs, totalPages }`
(grouped client-side by `type`, §59.3). `title` = report date
(`DD-MM-YY`) or branch `name`; `subtitle` = supervisor name /
branch `location`; `matchedFields` = which indexed field(s)
matched (for highlight, chrome copy per §7.6).

### 39.4 Scoring & ordering

- Ranking: text-score desc; ties by `reportDate` desc /
  `name` asc. `$text` `$search: q` with the §29 chain sanitizing
  `q` (no regex injection — `$text` is regex-free by design);
  no fuzzy/typo tolerance (acceptance: exact and prefix-ish
  text matches only — documented).
- Type filter maps to a `type` union of index targets: `report`
  → the reports text index; `branch` → the branches index.
- Results respect BR-13 and `isArchived` (archived rows are
  excluded unless `includeArchived=true` — default false,
  matching §30.2/§31.3).

### 39.5 Edge cases

- Zero matches → 200 with `docs: []` and `matchedFields: []`
  items (never 404); the §59 dialog shows the "No results"
  state.
- Multi-word `q` → `$text` ORs term matches; a quoted phrase in
  `q` honors `$text` phrase syntax only if the validator allows
  quotes (it does not — quotes are stripped before `$text`,
  documented to avoid injection surprises).
- Long `q` truncation at 100 chars; special regex chars have no
  effect (documented acceptance).

### 39.6 Verification usage

- Grep gates: exactly the two text indexes above declared
  (initialSchema target §18.3 — no wildcard `'$**'`); no regex
  constructed from `q` anywhere (`RegExp` absent in
  `search.service.js`); `filePath` never a search target; the
  search dialog is the only consumer of this endpoint (§59.6).
- Cross-section checks: mirrors §21.4/§18.3 (index promise
  closed here), §59 (UI), §27.4 (envelope/pagination), §29
  (validation), §17.4 (tombstones), §20/§21 (fields).
- §39 introduces no constant (§11 unchanged), no path beyond
  §15.4 (`search.routes.js`), and no package; it references only
  specification sections.

---

## 40. Mock Data & Seeding

### 40.1 Purpose & scope

§40 owns the seed/wipe mechanism (ADR-037) — the development-
only surface that produces mock data per §25's rules: mock
users, branches, reports in every status, audio documents
(metadata-only, §25/§40), mock transcriptions as documents, and
a mock conversation, all session-safe (§18.5) and never
hard-coded into models (§18.8/§25).

- **Owned here (normative).** Seed/wipe endpoints (§40.2);
  fixture composition (§40.3); session safety (§40.4);
  environment gating (§40.5); states & edge cases (§40.6);
  verification (§40.7).
- **Owned elsewhere — deliberately not repeated here.** Mock
  content rules and fixtures' Amharic copy = §25; the models
  written = §19–§24; the sweeper = §62.
- **Explicitly out of scope §40.** No production data path, no
  seed into production, no new constant (§11 unchanged), no
  package.

### 40.2 Endpoints

- `POST /mock/seed` (access; **development only** §40.5):
  creates a deterministic fixture set:
  **user fixtures** (D5) — the two §25.3 accounts (the
  supervisor persona `ቤዛ አያሌው` and a second user),
  schema-valid per §19 (email + ADR-007 hash), created
  idempotently (upsert on email — no unique-index collision
  on rerun), with **no real email or password material**: the
  hash is a dev-only placeholder and the accounts can never
  authenticate (§28 login always fails for them). They are the
  **only non-`user`-scoped writes** (BR-13 otherwise applies).
  Everything else is written for the **current user only**
  (BR-13 — seeding writes only `user`-scoped rows): branches
  (3 active, 1 archived), reports in each of the five
  statuses (with visits, snapshot names), audio docs
  (metadata-only with NO physical files — §25's metadata-only
  rule, ADR-037; the doc carries the §25 mock-path convention),
  a transcription linked to one audio, and a mock conversation.
  Returns `{ data: { seeded: { users,
  branches, reports, audios, transcriptions, conversations } } }`.
- `POST /mock/wipe` (access; development only): deletes the
  caller's own mock rows (session-safe, per user — never other
  users'). Returns counts.
- Both are **session-safe** (ADR-018): the whole mock write/
  delete set commits atomically; a mid-wipe failure aborts
  cleanly.

### 40.3 Fixture composition (per §25)

- Reports carry real-shaped visits/branches snapshot blocks;
  the `raw`/`latest` on `reviewed`/`completed` fixtures = the
  §25 mock content (Amharic, §7.6-sane: content Amharic,
  chrome English); `audio_attached` fixtures hold audio rows,
  `transcribed`/`reviewed` hold transcription rows with equal
  `raw`/`latest` (BR-11 shape), `completed` fixtures hold
  accepted content.
- The mock conversation holds `(provider, model, reasoning)`
  triples from the §11.4 registers (never invented strings).
- Wipe deletes exactly what seed created for this user; rerun
  of seed without wipe is idempotent-by-wipe (no unique-index
  collisions beyond the user's own rows — the §25.3 user
  fixtures are the exception: upserted on email, and their
  wipe is skipped when another user still references them).

### 40.4 Session safety

Both endpoints wrap the full write/delete set in the §27.7
template (startSession → ... → commit). The controller never
commits incrementally; the `mock` routes mount their own
`ensureMockEnabled` guard (§40.5) before the chain.

### 40.5 Environment gating

`ensureMockEnabled`: allowed **only** when `NODE_ENV` is
`development` (asserted at boot; the constants file exposes it
as frozen config, §26.2). Any other environment gets 404 with
the §60 catalog copy ("Mock data is only available in
development"). Grep gate: no mock route registration in
production builds (the route module is conditionally mounted by
`routes/index.js` per the env flag — not by string env checks
strewn through code).

### 40.6 States & edge cases

- Seed after wipe / wipe without seed → both are no-ops that
  return `{ seeded: zeros }` / `{ wiped: zeros }` (200, not
  errors) — deterministic for the dev loop.
- A mid-development user with real data: wipe removes only mock
  rows (mock rows are flagged by the fixture signature per §25
  — the report/branch rows carry the §25 convention; real rows
  are untouched by wipe: wipe matches the same user + the §25
  signature).
- Audio mock rows carry no physical files: the §32 play
  endpoint 404s for them (documented mock behavior — the UI
  shows the §60 message; the §54/§51 surfaces survive).

### 40.7 Verification usage

- Grep gates: `mock/` never imported by models (§18.8); no seed
  call outside `mock.routes.js`; `node --expose-gc` not needed;
  no `isProduction` checks other than the guard; no physical
  files written by mock (metadata-only, ADR-037).
- Cross-section checks: mirrors §25 (content rules), §19–§24
  (models), §18.5 (sessions), §27 (envelope), §62 (sweeper for
  leftovers), §7.6 (copy), §13/§11 (constants).
- §40 introduces no constant (§11 unchanged), no path beyond
  §15.4, and no package; it references only specification
  sections.

**End of Part C (backend).** Sections 26–40 close the backend
specification in dependency order: foundation and concerns
(§26–§27), identity (§28), validation (§29), the domain APIs
(§30–§31), the media pipeline (§32–§33), the AI services
(§34–§35), conversation and export (§36–§37), and the
aggregation surfaces (§38–§40), each standing on Parts A/B's
locked decisions (ADR-001–038) exactly as §12.11 and the
BR-01–BR-19 catalogue require.

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
React Router's lazy form (`Component` + lazy property) with a
**literal import specifier per route** — Vite's static import
analysis must stay intact (a variable specifier helper is never
used). The guard wrappers (`PublicRoute`, `ProtectedRoute`) are
synchronous redirects and ship **statically as elements** — the
third static route participant with `AppErrorPage` and `NotFound`
— so a branch can never render unguarded inside a lazy-loading
window. **The `*` catch-all is the one lazy exception**:
`NotFound` ships statically (like `AppErrorPage`) so an unmatched
URL — deep-link reload or SPA navigation — renders the §59.4 404
instantly and never enters a lazy-loading window (where the pending
leaf renders `null` and only bare layout chrome would show).

The route set is decided here and detailed by the page sections:

| Path | Component | Guard | Section |
| --- | --- | --- | --- |
| `/` | Landing page | Public (browsable by all; authed sessions see the Logout bar, §41.5) | §48.2 |
| `/login` | Login page | Public | §48.3 |
| `/register` | Register page | Public | §48.4 |
| `/dashboard` | Dashboard page | Protected | §49 |
| `/reports` | Reports page (list/grid toggle) | Protected | §50 |
| `/reports/new` | Report Creation Wizard | Protected | §52 |
| `/reports/:reportId` | Report Details page | Protected | §51 |
| `/branches` | Branches page | Protected | §56 |
| `/branches/:branchId` | Branch Details page | Protected | §56.5 |
| `/profile` | Profile page | Protected | §57 |
| `*` | 404 page | Public | §59 |

Routes are kebab-case (§9.3); the only route parameters are
`:reportId` and `:branchId` (§9.3 — a bare `:id` is never used).
This table is the complete page set: AI chat (§55), audio recording
(§53), transcription review (§54), export flows (§58), and global
search (§59) are **embedded surfaces** of the pages above — they are
never routes. The rationale for each page's existence, and for those
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
  unauthenticated — the lower-case status enum is
  `initializing | authenticated | guest`; "guest" is the resolved
  unauthenticated value (the §41.5 enum lock, first enforced at
  P3) — renders `<Navigate to="/login" replace
  state={{ from: location }} />` (locked decision 4) — the login
  page reads `state.from` for post-login navigation (§48.3). When
  authenticated, renders `<Outlet/>`.
- **`PublicRoute`.** The inverse — but it gates **Login and
  Register only**: authenticated → `<Navigate to="/dashboard"
  replace />`; unauthenticated → `<Outlet/>`. Landing (`/`) sits
  **outside** this guard (its own `PublicLayout` route): it is
  browsable by both guests and authenticated sessions — the
  auth-aware bar then shows the Logout action (§47.2). The
  redirect targets are fixed strings (`/login`, `/dashboard`) —
  never recomposed by callers; the 401 expiry path that *lands* on
  login is the §42 reauth chain's responsibility, not a guard's.
  Login, and Register are public by lock (decision 4).

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
every other component in `components/<domain>/` (e.g. `auth/`,
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
  because the session lives in httpOnly cookies (§28, §12.7).
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
   original request without a toast. The expiry redirect applies
   to an **authenticated** session whose credentials just died
   (authenticated → request → 401 → one retry → on failure,
   session cleared, landing on `/login`); anonymous and
   `initializing` probes fail through silently — guests are
   already gated by §41.5 and never bounce, so public pages do
   not reload-loop on failed boot probes.
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
  the tag families are the six domain families of §41.6
  (`Reports`, `Branches`, `Audio`, `Transcription`,
  `Conversation`, `Me`).
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
stays quiet, and the empty ruled desk as the one repeated identity
motif.

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
  primary, completed → success **— and branch states: active →
  success, archived → default**, §56.3) — derived from the role
  palette, never new colors.

**Type roles (normative).**

- Chrome (shell, navigation, labels, buttons, validation messages,
  helper text, table headers): **Inter** 300–700 (§13.4
  `@fontsource/inter`).
- Content (report body, transcription text, chat messages — the
  §7.6 content surfaces): **Noto Serif Ethiopic** — the
  `@fontsource/noto-serif-ethiopic` dependency of §13.4, installed
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
renders the *ruled dictation desk*: a cardless, hairline-ruled
expanse — the paper for the day's report, waiting — with a single
restrained animation: a low-opacity waveform line traced once across
the rules ("the spoken report") that obeys `prefers-reduced-motion`
(§45.7; under reduced motion it renders fully drawn, statically) and
persists after its first display. This is the only decorative motion
in the product; every other transition in §44–§59 is a MUI default
or an explicit functional micro-interaction.
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
  and registers exactly one installed package in §13.4
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

**Landscape-height qualifier (normative, spec-wide).** The clause
"landscape below 768px" (§45.3, §45.7, §46.15) is the single
allowed non-bucket viewport condition: viewports matching
`(orientation: landscape) and (max-height: 767.98px)`, expressed
as the CSS media query it is (no other height literal appears
anywhere in the spec; §9.6). Bucket statements always win over it
where both apply (a ≥600px landscape viewport is `sm`+ for width
rules, with the height clause only relaxing the icon-only rule).

### 45.3 Icon-only rule

Per §12.6: an element bigger than an icon is always accompanied by
its label at **xs and sm**, and at **md and above in landscape
below 768px** where the rule applies (§9.6). A
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
  (§9.6); `Grid` uses the `size` prop, never
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
  (**false**), `loadingPosition` (**center**), `loadingIndicator`
  (replaces the default spinner), `startIcon`,
  `endIcon`, `fullWidth`, `disabled`, `children`, `onClick`, `sx`,
  `type`; icon-only buttons stay raw `@mui/material/IconButton`
  (never MuiButton) (§44.2).
- **States:** default / hover / focus-visible (§45.8) / pressed /
  disabled / loading (MUI's native loading prop: indicator per
  `loadingPosition`, always in the DOM). The customization's
  root-level `&.Mui-disabled` rule clears the ink gradient
  (`backgroundImage: none`) so disabled text stays readable via
  `action.disabled` (contract: variants never override disabled
  appearance). Submit buttons:
  `size="small"`,
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
- **Props:** `label`, `placeholder`, `type` (**text**), `size`
  (**small**), `required`,
  `disabled`, `multiline`, `rows`/`maxRows`, `fullWidth`,
  `error` + `helperText` (validation surface), `startAdornment`,
  `endAdornment` (the password eye overrides it), `slotProps`,
  `sx`, standard passthrough; `forwardRef` forwards the ref to the
  **real `<input>` element** (via MUI's `inputRef` — MUI's own
  TextField ref lands on the root slot), the RHF/imperative
  contract.
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
  `label`, `size` (**small**, FormControl + Select),
  `startAdornment`/`endAdornment` (reached through the Select's
  `other` spread onto the OutlinedInput),
  `fullWidth`, `disabled`, `error`/`helperText`;
  `MenuProps={{ slotProps: { paper: { sx: { maxHeight: 300 } } }
  }}` — the fixed dropdown height; `forwardRef` exports the input
  ref.
- **States:** empty (label + placeholder), focused, error,
  disabled, open; empty-option behavior is the owning form's
  validation concern (§48–§57).

### 46.6 MuiDatePicker & `ethiopianDate.js`

- **Files:** `components/reusable/MuiDatePicker.jsx`,
  `utils/ethiopianDate.js` and `utils/ethiopianDateAdapter.js`
  (§15.5).
- **Purpose:** the Ethiopian-calendar date picker with English
  day/month names (§43.6, ADR-011/ADR-032) — built on
  `@mui/x-date-pickers` community (no Pro features). When the
  section needs a time value, the same component file renders the
  matching `MuiTimePicker` behavior — a 12h AM/PM input surface
  (`h:mm A`): selecting 12:00 keeps 12:00 with an explicit meridiem
  on the dial; the stored dayjs value stays absolute, so domain
  rendering keeps the 24h `HH:mm` convention (§43.6).
- **Field display** (`utils/ethiopianDateAdapter.js`, §15.5): the
  picker runs its own `LocalizationProvider` with
  `EthiopianDateAdapter extends AdapterDayjs`, which re-maps the
  `DD`/`MM`/`YY`/`YYYY` section tokens to the Ethiopian parts
  (v9 formats each field section per token —
  `buildSectionsFromFormat`). The field therefore shows the
  Ethiopian `DD-MM-YY` (e.g. `12-05-18`), never the Gregorian
  equivalent; the internal value and the day grid keep the
  proleptic-Gregorian-equivalent model, and typed section edits
  operate on that internal model (§43.6).
- **Conversion contract** (`ethiopianDate.js`):
  `ethiopianToGregorian(ethDate) → JS Date` and
  `gregorianToEthiopian(jsDate) → { day, month, year }` — a
  lightweight local utility, no npm package (§13.4); 13-month
  structure (Meskerem … Pagume); Pagume renders as "Pagume" in
  chrome headers (§43.6); input/display value `DD-MM-YY` numeric.
- **Props:** `value`, `onChange` (value arrives via the picker's
  custom onChange — **`Controller` is required**, with a
  justification comment, §46.2), `label`, `size` (**small**, into
  the TextField slot), `views` (day/month/year if the owning form
  narrows modes — §52.3; the §50 filter date range waits on
  OQ-009), `startAdornment`/
  `endAdornment` (merged into the TextField's input slot),
  `slotProps` (user values merge under the picker's own —
  contract fields win; the picker forces
  `desktopTrapFocus.disableEnforceFocus` and `dialog.disableEnforceFocus`
  — the focus-trap fight fix, §46.6), `slots` (the Ethiopian
  `CalendarHeader` mounts via `slots.calendarHeader` — the v9
  API; user `slots` win), `disabled`, `error`/
  `helperText`; `forwardRef` on both pickers.
- **CalendarHeader interaction:** the Ethiopic chrome label shows
  the Ethiopian month name + year and behaves exactly like v9's
  `handleToggleView` — 2 views → the other view, 3+ views →
  alternating first two; no-op when `views.length === 1`,
  `!onViewChange`, or `disabled` (the label shows an
  `ArrowDropDown` hint only when toggle is possible). The slot
  renders its own `ChevronLeft/ChevronRight` month arrows via
  dayjs ±1 month (`onMonthChange`), since the default arrows live
  inside the header we replace.
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
  live in `components/columns/*.jsx` — `reports.jsx` (§50),
  `branches.js` (§56).
- **Purpose:** every data table (the Reports list §50, the
  Branches list §56 — the dashboard charts of §49 are not a
  data grid).
- **Props/contract:** `columns` (from the domain column file),
  `rows`, `loading`, `rowCount` (**= server `totalDocs`**),
  `getRowId={(row) => row._id}` (key doctrine §9.3 — never an
  `id` field),
  `paginationMode="server"`, `page`, `pageSize`, `onPaginationModelChange`, `onRowClick`, `checkboxSelection` (**true**),
  `disableRowSelectionOnClick` (**true**), `onSelectionModelChange`,
  `slots`, `slotProps` (the v9 built-in toolbar's options —
  `csvOptions`, `printOptions.disableToolbarButton`), `sx`
  (default height 400, overridable); `pageSizeOptions={[10, 25, 50,
  100]}` — the §11.5 `PAGINATION_*` mirrors.
- **Toolbar:** the v9 built-in toolbar via `showToolbar` (columns
  toggle, filter, density, CSV export of the **selected rows**) —
  the legacy `GridToolbar*` component imports are deprecated
  (§46.8); CSV export of selected rows is the §58 export surface
  of the lists.
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
- **Anatomy (normative):** `DialogTitle` (when `title` given) →
  `DialogContent` with `dividers` (**top and bottom dividers**,
  MUI requirement) → `DialogActions` (when `actions` given); the
  body `children` always render inside `DialogContent`.
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
- **Props:** `status` (**required** for the report variant) — one of
  `REPORT_STATUSES` (§11.4): `draft` | `audio_attached` |
  `transcribed` | `reviewed` | `completed`; or `branchActive`
  (Boolean, required for the branch variant, §56.3) — renders the
  chrome labels "Active" / "Archived" (§7.6).
- **Color mapping (normative):** report `draft` → default;
  `audio_attached` → warning; `transcribed` → info; `reviewed` →
  primary; `completed` → success; branch `active` → success;
  branch `archived` → default — all derived from the §43.2 role
  binding, never new colors.
- **Usage:** Report Details header (§51), Reports grid/list cells
  (§50), wizard step headers (§52), Branches grid Status cell
  (§56.3).

### 46.14 LoadingSpinner & skeleton variants

- **File:** `components/reusable/LoadingSpinner.jsx`.
- **Purpose:** centered `CircularProgress` for full-page,
  section-level, and route-transition loading.
- **Props:** `message` (optional, `text.secondary`), `minHeight`
  (**`100vh`** default; sections override, e.g. `400px`).
- **Usage:** guards §41.5, page loads §49–§59, dialog loads, and the
  route-transition swap in the layouts: while
  `useNavigation().state === "loading"` (§47.2/§47.3 — lazy module,
  loader, and middleware fetch) the scrollable content area renders
  `<LoadingSpinner message="Loading…" minHeight="100%"/>` in place
  of the `<Outlet/>`; chrome stays mounted.
- **Skeleton variants (the §45.7 batch surfaces):**
  `TableSkeleton`, `ListSkeleton`, `FormSkeleton`,
  `MessageSkeleton` (`components/reusable/*Skeleton.jsx`) —
  §46.14-styled placeholders for the reports list (rows), the
  dashboard KPIs, the wizard steps (per-field), the conversation
  (message rows), and table surfaces; pages render these at
  their §45.7 loading slots and never duplicate skeleton markup.

### 46.15 GlobalSearchDialog

- **File:** `components/reusable/GlobalSearchDialog.jsx` (UX in
  §59; standalone — does not use MuiDialog's actions slot).
- **Props:** `open`, `onClose` only — the dialog is fully
  self-contained (query state, state machine, driven by the §39
  endpoint through the §42 layer).
- **Behavior contract:** search field (belt `MuiTextField`) with
  start adornment (**`ArrowBackIcon`** — clears the field, resets
  results, closes the dialog) and end adornments: a clear button
  (**`CloseIcon`**) and the search action (**`SearchIcon`** —
  fires the search); React Hook Form `register('search')` —
  **typing renders nothing**: the field is uncontrolled and the
  clear button's visibility flips natively via the
  `input:placeholder-shown` pseudo-class (empty input →
  `visibility: hidden` on the reserved slot, no re-render, no
  layout shift); search fires on Enter or on click of the action —
  **no debounce** (§9.6); results grouped by entity
  (Reports, Branches) in MuiAccordion sections; the content area is
  **full-height** and shows the two `MuiEmptyState` variants
  (§46.17): the search prompt while idle, "No results found" when
  a completed run has no hits; loading state (§46.14 spinner);
  **fullscreen below md (900px)** — xs and sm are edge-to-edge with
  no border radius (the app's small-screen convention, §44.4; the
  centered paper exists only on md+); below 768px landscape stays
  fullscreen too (radius 0); centered at 900–1200px
  (80vh / 600px) and above 1200px (70vh / 720px); closes via back
  arrow, Escape, or click outside.
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

- **MuiEmptyState** (`components/reusable/MuiEmptyState.jsx`) — the
  belt empty-state surface implementing §60.2 state 2: centered
  icon (`action.active`) + title + description column, optional
  inline primary action slot; copy always from the owning section
  (§60.7). Props: `title` (required), `description`, `icon`,
  `action`, `minHeight` (`100%` default). Used by §46.15
  (prompt + no-results) and every page's empty state (§50, §56,
  §60.2).
- **MuiAudioPlayer** (`components/reusable/MuiAudioPlayer.jsx`) —
  clip playback; drives §53 (recording review) and §54 (clip
  playback during review). Props: `audio` (**the metadata-only
  DTO of §22.7 — no `filePath` ever reaches the client**), URL
  via the §32 audio endpoint, `onEnded`; states loading/playing/
  paused/ended/error; the play button is the recorder's only
  interactive cue with icon-only labels below 600px (§45.3).
- **MuiRecorder** (`components/reusable/MuiRecorder.jsx`) — the
  device recording strip: a circular record/stop button (the
  §44.4 icon-button treatment; the record button sits in a
  Tooltip `span` wrapper — it can be disabled), a live `MM:SS`
  timer, and after
  stop a per-clip chip with re-record (discards the take — the
  §52.6 label binding, never an upload) and **Add** (appends
  the take as a clip of the labelled visit, §32). MediaRecorder
  API; states idle/recording/has-take/error (permission denied
  renders the §60 error toast + the MuiFileInput fallback hint);
  icon-only labels below 600px (§45.3). The resulting clip then
  plays through MuiAudioPlayer.
- **MuiFileInput** (`components/reusable/MuiFileInput.jsx`) —
  the multi-file audio upload input: a dashed drop-zone surface
  (`accept` = the §32 `AUDIO_ALLOWED_MIME_TYPES` mirror, never
  a hard-coded list), `multiple`, start-adornment icon, file
  selection + drag-drop (both accepted), per-file size limit
  (the §11.3 constant mirror) with reject messages in the §60
  toast + inline helpers, repeated-pick dedupe (same file
  picked twice = skipped with an inline note), disabled state;
  each accepted file becomes a clip of the labelled visit
  (§52.6) via the §42 create-clip call. Props: `accept`,
  `multiple`, `onFiles`, `disabled`; no private copy of the §32
  MIME list (single source §11.3/§32 — mirrors only, §14.3
  ADR-032).
- **MuiStatCard** (`components/reusable/MuiStatCard.jsx`) — the
  Dashboard KPI card (§49): `label` (small-caps eyebrow), `value`
  (h3), `icon` (start adornment, role color), optional `trend`
  caption; plain card surface (§44.6).
- **MuiStepper** (`components/reusable/MuiStepper.jsx`) — the
  wizard step indicator (§52): the §44.5 dot style, step labels,
  `activeStep`, `onStepClick` (only to visited steps), completed
  check; responsive: step labels collapse to dots below 600px.
- **MuiRegistrationValue** (`components/reusable/
  MuiRegistrationValue.jsx`) — the single renderer for
  registration-bearing values (the §21.10 registry surfaces):
  renders the **registration text/label exactly as stored in
  the registry** — never reformatted, never translated (the
  label is data, §7.6); on tombstones (§17.4) the stored label
  still renders; a missing registry key renders the §46.4
  not-applicable dash. ADR-033: no second registration renderer
  anywhere.

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
  "Logout") when authenticated); 2) the content area — scrollable
  (`overflow-y: auto`); during a route transition
  (`useNavigation().state === "loading"`, §46.14) it renders the
  transition `LoadingSpinner` in place of the `<Outlet/>`; the
  outer wrapper applies
  `height: 100vh; overflow: hidden` (§45.4). The content area
  renders a passed `children` in place of the `<Outlet/>` when one
  is given — the §59.4 composition contract (NotFound selects this
  layout by auth and hands it the 404 card as children).
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
  see §47.5; **no title text**; below md the leading slot carries
  the navigation hamburger — the only sidebar opener on xs/sm;
  on md+ there is no hamburger in the app-bar, the menu icon lives
  in the sidebar header, §47.4); 2) the page header, rendered by
  each page (§46.12 — not a reusable view here); 3) the content
  area — scrollable (`overflow-y: auto`); during a route
  transition (`useNavigation().state === "loading"`, §46.14) it
  renders the transition `LoadingSpinner` in place of the
  `<Outlet/>`. The content area renders a passed `children` in
  place of the `<Outlet/>` when one is given — the §59.4
  composition contract (NotFound selects this layout by auth and
  hands it the 404 card as children). Outer wrapper:
  `height: 100vh;
  overflow: hidden` (§45.4).
- **Responsive:** the content column resizes to the sidebar mode
  (§47.4); on xs/sm the sidebar is an overlay (§47.4).

### 47.4 AppSidebar

- **File:** `components/layout/AppSidebar.jsx`.
- **Props:** `open` (boolean), `onClose` (function), `sidebarMode`
  (`'full'` | `'mini'`), `onToggle` (function).
- **Header:** the §43.2 report-header motif + logo + app name
  (**"Report Builder"** — `VITE_APP_NAME`, §10.5). On the
  **permanent** drawer (md+) the header also shows the menu icon,
  which toggles full/mini; the **temporary** overlay (xs/sm)
  header shows the logo only — no menu toggle (the app-bar
  hamburger owns xs/sm, §47.3 — the sidebar is not visible
  before it opens).
- **Nav items** (top, `flexGrow: 1`): **Dashboard, Reports,
  Branches, Profile** — each a `MuiListItemButton` with icon +
  label and a link to its route (§41.3). Bottom: `MuiDivider` +
  **Logout** (`MuiListItemButton`, icon + label; resting state
  neutral; hover styled via `error.main` tint, §44.2/§47.6).
- **Theming (normative, §44):** default `backgroundColor:
  transparent`, `color: text.secondary`; hover `backgroundColor:
  action.hover`, radius 8; **selected**: `backgroundColor: primary.main
  + 0.08`, `color: primary.main`, `fontWeight: 600`, `borderLeft:
  3px solid primary.main`; icon selected `color: primary.main`,
  otherwise `color: action.active`; Logout hover:
  `backgroundColor: error.main + 0.08`, `color: error.main`.
- **Responsive (normative):**
  - xs (< 600px) and sm (600–899px): **temporary overlay** drawer
    (240px) — opened by the app-bar hamburger (§47.3), closes on
    backdrop click, nav selection, or Escape (§45.6/§46.10). The
    mini mode never appears below md.
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
  (`/reports/new`), report details (`/reports/:reportId`), and
  branch details (`/branches/:branchId`) do **not** mark their
  parent nav item as selected (page-context rule), unless the
  section chooses a different rule explicitly.
- `useNavigate` is the only navigation mechanism for actions;
  `Link` is used for nav items and inline links (§44.5).
- Logout clears the `authSlice` state **after** the §28 logout
  call succeeds; a failing logout still clears local state and
  navigates (§42 handles refresh/expiry independently).

### 47.7 Verification usage

- Grep gates: the four nav items and their paths match §47.4
  verbatim; no second app-bar/title inside `AppShell` content; the
  `100vh` wrapper and `overflow-y: auto` patterns appear in both
  shells (§45.4); no hamburger in the protected app-bar above md
  (on xs/sm the app-bar hamburger is the only sidebar opener,
  §47.3).
- Cross-section checks: mirrors §12.6/§12.7 (shell and auth),
  §44.5/§44.2 (drawer/button styles), §45 (buckets and drawer
  modes), §46.11/§46.15 (bar and search contracts), §41.3/§41.5
  (routes and guards), §59 (search UX).
- §47 introduces no constant (§11 unchanged — "Report Builder"
  is `VITE_APP_NAME`, §10.5), no path, and no package; it is
  standalone — it references only specification sections.

---

## 48. Pages — Auth (Landing, Login, Register)

### 48.1 Purpose & scope

§48 owns the three public pages and their shared behaviors — the
only surfaces an anonymous visitor may reach (§3.2.1, §4.4): the
Landing page (`/`), the Login page (`/login`), and the Register
page (`/register`). Landing renders inside `PublicLayout`
(§47.2) on its own route — browsable by guests and authenticated
sessions alike (authed visitors see the Logout bar, §47.2/§41.5);
Login and Register render behind `PublicRoute` (§41.5). Reasons of existence: the
supervisor must learn what the product does before signing up
(Landing), must enter the session (Login — also the converge
point of the guard redirect `state.from`, §41.5, and of the §42
expiry redirect), and must create an account with no admin path
(Register — self-service registration, F1, §19.2/§28).

- **Owned here (normative).** The Landing page and its signature
  hero (§48.2); the Login page and its form (§48.3); the Register
  page and its form, including the post-registration decision
  (§48.4); the shared auth behaviors — links, the Google OAuth
  entry, presentation (§48.5).
- **Owned elsewhere — deliberately not repeated here.** The
  account-creation contract, auto-extraction of names, and the
  Google OAuth flow = §19.2/§28 (Part C); cookies and reauth =
  §42/§28; the public app-bar = §47.2; guards and redirects =
  §41.5; form mechanics = §46.2/§9.6; toasts and the §60 protocol;
  the 404 page = §59.
- **Explicitly out of scope §48.** No amendment to the §19/§28
  contracts (e.g. no extra registration fields — the form collects
  exactly `email` and `password`); no new constant (§11/§10
  unchanged — page copy is authored text, not code constants); no
  path beyond §15.5 (`pages/`, `components/auth/`,
  `components/landing/`); no package.

### 48.2 Landing page (`/`)

**File:** `pages/Landing.jsx`; domain components in
`components/landing/`. Renders inside PublicLayout's scrollable
Outlet (§47.2); no reauth surface beyond the public app-bar.

**Purpose & composition.** Phone-call-as-sale: a single job —
explain the product and route to Register/Login (§4.4). Sections
top to bottom: 1) **Hero** (the signature, §43.2); 2) **Branches
strip** (the branch-management promise — the visitor's own names
live in his reports, managed from Branches); 3) **How it works**
(the §1.5 loop in chrome copy); 4) **CTA band**; 5) footer (product
name `VITE_APP_NAME`, §10.5; copyright line). The composition is
provisional under **OQ-008** (§69) — an owner decision may revise
it after P8; until then it ships as delivered.

**Hero (normative, locked decision of §43.2).** The ruled dictation
desk: a hairline-ruled expanse with no card — no frame, no fill, no
radius — the paper for the day's report, waiting. Over it, the
"spoken report" waveform trace (the §43.2 signature animation —
disabled under `prefers-reduced-motion`, §45.7; shown statically
fully drawn, and persisting after its first display). English
eyebrow and headline beside the desk ("Daily supervision reports,
in Amharic"); two CTAs: **Sign up** (contained, §46.3) → `/register`,
and **Log in** (outlined) → `/login`. The desk carries no text —
no Amharic strings in chrome (§7.6 boundary: content lives on the
auth/report surfaces, never in the hero).

**Breakpoint matrix (regions × buckets):**

| Region | xs <600 | sm | md | lg | lg+ |
|---|---|---|---|---|---|
| Hero block | stacked full-width, headline + CTAs above the desk | same, max-width 560px centered | two-column: copy left, ruled desk right | same | same, max-width 1100px |
| Ruled desk | ~130px tall, full-width lines | same | ~170px tall | same | same |
| Branches strip | icon row wraps | icon row | one row, between hairlines | one row | one row |
| How-it-works | vertical stack | vertical stack | 3 columns | 3 columns | 3 columns |
| CTA band | full-width buttons | full-width | contained center | contained | contained |

**States.** Public page — no loading/empty data states beyond the
fixed sections; the CTAs render statically; navigation failure
surfaces via the §60 toast only on the destination.

### 48.3 Login page (`/login`)

**File:** `pages/Login.jsx`; form component
`components/auth/LoginForm.jsx`.

**Purpose & composition.** Session entry; also the target of the
§41.5 guard redirect (`state.from`) and the §42 expiry redirect.
Composition: centered card (paper surface, §43.2/§44.6) inside
PublicLayout; page header eyebrow "Welcome back" + title "Log in"
(§46.12); the `LoginForm`; the OAuth entry; the sign-up link
(§48.5).

**`LoginForm` (full specification — the §46.2 form pattern):**

| Field | Input (§46) | Start adornment | Placeholder | Required | Manual-resolver rule | Error copy |
|---|---|---|---|---|---|---|
| `email` | MuiTextField `type="email"` | Email icon | `you@example.com` | yes | empty → required; `^[^@\s]+@[^@\s]+\.[^@\s]+$` → format | "Email is required" / "Enter a valid email address" |
| `password` | MuiTextField `type="password"` (internal eye toggle, §46.4) | Lock icon | — | yes | empty → required | "Password is required" |

- **Submit:** MuiButton "Log in", `size="small"`, full-width, MUI
  `loading` ("Logging in…") while `isSubmitting`; `flexShrink: 0`
  (§46.3, §9.6).
- **Empty-submit behavior (normative):** `handleSubmit` runs the
  manual resolver on the empty form — both fields render
  `error` + `helperText` (§46.4), focus moves to the first
  invalid field (`email`), nothing is submitted, no toast fires.
- **Success:** the §28 login contract through the §42 layer; then
  navigate to `state.from` when present (same-site, decoded), else
  `/dashboard`; toast "Welcome back" (decision 10, §41.2).
- **Failure:** backend failures (wrong credentials, missing
  account, inactive session) surface as toasts with the §27
  `message` ("Please login again" for expiry-family errors per
  §12.5) — `setError` is never used for server errors (§9.6,
  §42.4). A 401 here is a login rejection, not a session expiry —
  it follows the §28 login contract's error shape and is toasted.
- **Validation mode:** `onBlur` (§9.6); no debounce; no `watch`.

**Google OAuth entry.** The "Continue with Google" button below the
form: Google icon **start adornment**, outline variant, full-width;
on click it begins the §28 Google OAuth flow (currently the §28
stub per OQ-004) and shows the MUI loading spinner until the flow
resolves or fails; failure → toast with the §27 message. Chrome
copy only (§7.6).

**Breakpoint matrix:**

| Region | xs | sm | md | lg | lg+ |
|---|---|---|---|---|---|
| Card | full-width, p2, rounded, centered | 420px centered | 420px centered | 480px centered, right of a brand panel | 480px centered |
| Brand panel (hero motif, static) | hidden | hidden | hidden | visible left column | visible left column |
| Field labels | above fields | above | above | above | above |
| Submit + OAuth | stacked, full-width | stacked, full-width | stacked | stacked | stacked |
| Sign-up link | below OAuth | below | below | below | below |

**States & edge cases.** Public page: no reported data states;
submit loading; OAuth loading; form errors inline; empty-/repeated-
submit idempotent (no duplicate requests while `isSubmitting`);
session-expiry redirect arriving here does **not** toast (401
silent-rule, §42.3); "Remember me" does not exist (no such
decision anywhere — not added).

### 48.4 Register page (`/register`)

**File:** `pages/Register.jsx`; form
`components/auth/RegisterForm.jsx` (same domain folder).

**Purpose & composition.** Self-service registration (F1); the
form collects **only `email` and `password`** (§3.2.2, §19.2) plus
a confirm-password field on the client side. Composition: same
centered card pattern; eyebrow "Create your account" + title
"Sign up"; `RegisterForm`; OAuth entry; login link (§48.5).

**`RegisterForm`:**

| Field | Input (§46) | Start adornment | Placeholder | Required | Manual-resolver rule | Error copy |
|---|---|---|---|---|---|---|
| `email` | MuiTextField `type="email"` | Email icon | `you@example.com` | yes | empty → required; format regex | "Email is required" / "Enter a valid email address" |
| `password` | MuiTextField `type="password"` | Lock icon | — | yes | empty → required; min 8 chars | "Password is required" / "Password must be at least 8 characters" |
| `confirmPassword` | MuiTextField `type="password"` | Lock icon | — | yes | empty → required; `validate: (value) => value === getValues('password')` | "Please confirm your password" / "Passwords must match" |

- Helper text under `email`: "Your name is taken from your email
  (for example, beza.ayalew@gmail.com becomes Beza Ayalew)." —
  English chrome (§7.6), matching the §19.2 auto-extraction
  contract.
- **Empty-submit behavior:** the manual resolver marks all three
  fields, focus moves to `email`, nothing submits, no toast.
- **Success (locked decision 11, §41.2):** the §28 account-creation
  contract call; on success → toast **"Account created — please
  log in"**; navigate to `/login`. The client never auto-enters
  the application after registration.
- **Failure:** 409/duplicate email → toast with the §27 message
  (field errors are not routed through `setError`, §42.4);
  network failures → §60 error toast; the form stays filled (no
  `reset()` on failure), with `isSubmitting` released.
- Password confirmation is client-only — the §28 contract never
  receives it (§46.2 cross-field rule).

**Breakpoint matrix:** identical to §48.3's (card pattern, brand
panel from lg, stacked full-width actions).

**States & edge cases.** Submit loading ("Creating account…");
OAuth loading; inline errors; disabled submit while submitting
(§9.6); double-click guarded by `isSubmitting`; registration from
`state.from` is ignored — post-register always lands on `/login`.

### 48.5 Shared auth behaviors (normative)

- **OAuth entry** — one component (`GoogleOAuthButton`-pattern in
  the auth domain folder), reused by both pages (§46.2; spinner on
  click; §28/OQ-004 stub contract).
- **Cross links** — Login footer link "Don't have an account?
  Sign up" → `/register`; Register link "Already have an account?
  Log in" → `/login` (§44.5 link styling).
- **Presentation** — paper background (§43.4), centered card,
  hairline header strip (§46.12); all chrome copy English (§7.6);
  the §43.2 paper-desk tokens; no marketing imagery beyond the
  §48.2 hero.
- **Error protocol** — every server error → toast (§60) with the
  §27 plain-language message; inline errors (client rules) via
  `helperText`; neither page calls `setError` (§9.6).
- **Session leak** — an authenticated visitor arriving at these
  routes is redirected by `PublicRoute` (§41.5); the pages
  themselves perform no auth checks.

### 48.6 Verification usage

- Grep gates: the register form's field set is exactly `email`,
  `password`, `confirmPassword`; no "Remember me", no name field,
  no profile-picture capture on Register; "Account created —
  please log in" appears exactly once; no `setError` for server
  errors (§42.4); every field row lists an adornment (§46.2).
- Cross-section checks: mirrors §3.2.1/§3.2.2/§4.4 (anonymous
  surface), §19.2/§28 (account contract), §41.5 (guards and
  `state.from`), §42.3/§42.4 (401 silence and error shape), §9.6
  (form mechanics), §7.6 (chrome language), §43.2/§43.5 (hero and
  faces), §45 (buckets), §46 (components), §60 (toasts).
- §48 introduces no constant (§11 unchanged), no path beyond
  §15.5, and no package; it is standalone — it references only
  specification sections.

---

## 49. Page — Dashboard & Analytics UI

### 49.1 Purpose & scope

§49 owns the authenticated home page (`/dashboard`, §41.3) — the
first view after login and the logo target (§47.5). Its job: the
day-level state of the supervisor's reports — how many reports, at
which statuses, across which branches — plus the two quick actions
that start the working loop. It exists because the supervisor's
first question on opening the app is "what is open and what did I
finish", which the Reports list answers only after navigation.

- **Owned here (normative).** The KPI set (closing the §69 OQ-005
  open item, recorded here), the chart set (§49.4), the page
  composition and actions (§49.2/§49.5), states and the breakpoint
  matrix (§49.6).
- **Owned elsewhere — deliberately not repeated here.** The
  analytics data contract and endpoints = §38 (Part C); the KPI
  card and chart reuse = §46.17 MuiStatCard and §44.9 charts;
  navigation = §47; empty/success/error presentation = §60.
- **Explicitly out of scope §49.** No endpoint shape, no analytics
  join logic (§38), no new constant (§11 unchanged), no new path,
  no package (@mui/x-charts already in §13.4).

### 49.2 Page composition

Order (top to bottom) inside AppShell's Outlet (§47.3), with the
per-page header first (§46.12): eyebrow "Overview", title
"Dashboard", subtitle "Your supervision reports at a glance";
`actions` slot hosts the primary action — "New report" (contained,
success — the §46.3 create color, owner decision) → `/reports/new`
(§52). Then: **KPIs** — Row of four
`MuiStatCard`s (§46.17); **Charts** — the §49.4 chart trio in a
responsive Grid (`size` prop, §46.2); **Latest reports** — a
compact read-only list (reportDate, branch snapshot names,
`MuiStatusBadge`, updatedAt) of the five most recent reports,
each row linking to `/reports/:reportId` (§51); the query passes
`isArchived=false` so the band is always **active-only** (archived
rows never surface here); when a row set is
empty the section shows the §60 empty state.

### 49.3 KPI set (normative — closure of OQ-005)

OQ-005 (open in §69) is closed here by decision. The four cards:

| Card label (chrome copy) | Value (from the §38 analytics payload) |
|---|---|
| Reports this month | report count for the current Ethiopian month |
| In progress | count of `draft` + `audio_attached` + `transcribed` + `reviewed` (+ any §31 open-state set the §38 contract exposes) |
| Completed | count of `completed` reports |
| Active branches | count of active branches (the §20/§38 branch surface) |

Every value is served by the §38 analytics endpoint via the §42
layer — no client-side aggregation over full lists (ADR-034). KPI
labels are chrome copy (English, §7.6); trend captions ("vs last
month") may render when the §38 payload provides them — anything
absent renders no caption (no invented numbers, §69).

### 49.4 Charts

Three charts from @mui/x-charts (§13.4) in the §44.9 styling,
driven by the §38 payload and rendered from server aggregates —
never from client-side datasets (ADR-034):

- **Status distribution** — a donut of the five `REPORT_STATUSES`
  counts (labels = English status names from the §11.5 mirror).
- **Activity by branch** — a horizontal bar of report counts per
  active branch snapshot name (top N per the §38 contract).
- **Issues trend** — a line of issue-related count over the recent
  days the §38 contract provides (the §6.11 vocabulary when
  authored — pending contract).

Charts degrade to the §60 empty state when their series is empty,
and show a compact loading skeleton while pending (§49.6).

### 49.5 Quick actions

- **"New report"** (header action, §49.2; contained, success) →
  `/reports/new`.
- **"Open latest report"** — the Latest-reports section's first
  row: navigates to its details page (§51).

### 49.6 States & breakpoints

- **States (ADR-033).** Loading — KPI skeletons + chart skeletons;
  error — §60 toast on the §38 fetch failure and a compact inline
  retry on the chart band; empty — **no account-level empty band**
  (owner decision, R3-fix): each chart degrades to its own §60
  empty state when its series is empty (zero-slice donut keeps its
  slices — §38.4) and the Latest-reports band renders its own
  empty ("No reports yet — record your first day", §60 voice);
  success — full render.
- **Breakpoint matrix:**

| Region | xs | sm | md | lg | lg+ |
|---|---|---|---|---|---|
| Page header | eyebrow+title stacked | same | actions inline right | inline right | inline right |
| KPI cards | 1 column (stacked) | 2 columns | 4 columns | 4 columns | 4 columns |
| Charts | stacked (1 column each) | 1 column | status donut + bars side by side, trend below full-width | 3 per grid row, equal thirds | equal thirds |
| Latest reports | list rows (compact) | list rows | list rows | list rows | list rows |

Icons-only below 600px for header chrome actions (§45.3); charts
keep fixed minimum heights to avoid reflow (§45.5).

### 49.7 Verification usage

- Grep gates: exactly four KPI labels; no client-side aggregation
  over report lists (ADR-034); all chart series named from the §38
  contract; no invented metric beyond §49.3's table; no amharic
  chart labels (§7.6).
- Cross-section checks: mirrors §38 (analytics data owner), §46.17
  (MuiStatCard), §44.9 (chart styling), §45 buckets, §60 states,
  §11.5 (`REPORT_STATUSES` mirror), §69 (OQ-005 closed here).
- §49 introduces no constant (§11 unchanged), no path, and no
  package; it is standalone — it references only specification
  sections.

---

## 50. Page — Reports List

### 50.1 Purpose & scope

§50 owns the Reports page (`/reports`, §41.3) — the management
surface of the daily workflow: listing, filtering, opening,
creating, and lifecycle actions on reports. It exists because
BR-05 (the wizard as the only creation path) and BR-06 (the status
machine) require a place to enter the wizard and to act on every
state, and because the report is the unit the supervisor manages
(§3.1.2 F6). The page is a **list/grid toggle** on one route —
there is no separate list page (§15.8).

- **Owned here (normative).** Filters and the list/grid toggle
  (§50.3); the grid and its columns (§50.4); the card grid mode
  (§50.5); row actions and confirm dialogs (§50.6); pagination and
  toolbar (§50.7); states and edge cases (§50.8).
- **Owned elsewhere — deliberately not repeated here.** List
  queries and pagination contract = §31/§27 (Part C); transitions
  and guards = §31; retention = §62; status presentation =
  §46.13; grid mechanics = §46.8; columns = `components/columns/
  reports.jsx` (§15.6); exports of the selection = §58; toasts and
  empty/error/success = §60; the wizard entry = §52.
- **Explicitly out of scope §50.** No endpoint shapes (§31), no
  transition rules (§31), no new constant (§11 unchanged — the
  §11.5 mirrors are consumed), no new path beyond §15.5, no
  package.

### 50.2 Page composition

Inside AppShell (§47.3), with page header first (§46.12): eyebrow
"Reports", title "Reports", subtitle "Your daily supervision
reports" — **the header renders on md+ only** (below md the app-bar
already owns the chrome; the page never repeats it). Then a single
**action button group** (§46.3) owns the actions band in the
header's place: **Filter** (start icon with the active-filter
count badge), **List** / **Cards** (the §50.3 view toggle —
md+ only), **Create** (contained, success — the §46.3 create
color → `/reports/new`), every button icon + text. Beneath it
the `MuiDataGrid` (§50.4, md+) or the card grid (§50.5 — the only
view below md, 1/2/3 columns).

### 50.3 Filter dialog & the list/cards toggle

- **Filter dialog — provisional (OQ-009, OPEN).** The Filter
  button opens a dialog whose full implementation is **TBD**: what
  to filter (a status/branch/archived set was the working
  hypothesis), branch single vs multi-select, server pagination of
  filtered results, and date vs date-range (or both) are open
  questions registered in §69 (OQ-009). Until they resolve, the
  dialog renders the TBD surface (`MuiEmptyState` with the OQ-009
  note) and the page holds **no filter state at all** — the list
  query is `page`/`limit` only. The Filter button's badge shows
  the active-filter count once filters exist (zero, hidden, while
  none are set).
- **Toggle** — "List" / "Cards" buttons of the action group
  (§50.2), **md+ only**: below md the page renders cards only
  (the data grid never appears on xs/sm). List = the MuiDataGrid;
  Cards = the ReportCard grid (§50.5) — 1 column xs, 2 columns sm,
  3 columns md, 4 columns lg. No preference is persisted (no
  localStorage surfaces, §53.4 rule — nothing is persisted
  client-side).

### 50.4 Grid mode (MuiDataGrid)

Contract §46.8 with `components/columns/reports.jsx` (per-domain
column set, §15.6, ADR-034):

| Column | Content | Notes |
|---|---|---|
| Date | `reportDate` as `DD-MM-YY` (§43.6) | falls back to `—` while uncaptured |
| Branch(es) | `branches[].name` snapshot values, joined, ellipsized (§45.5) | tombstone-safe (§17.4/§20) |
| Status | `MuiStatusBadge` (§46.13) | from `status` |
| Updated | `updatedAt`, `DD-MM-YY` | |
| Actions | View / Edit / Archive / Restore / Delete (§46.8) | per §50.6 |

**No owner/supervisor column exists** (per-user model §9 — the
user only ever sees and acts on their own resources; `supervisorName`
is report content, shown in the details, never a list column).

Row click (with `disableRowSelectionOnClick`) opens details
(`/reports/:reportId`, §51); Edit re-enters the wizard at the
status-matched step (§52.3); checkboxes enable the selection-based
actions (§50.7).

**Responsive column priority (below 900px):** Updated, then
Branch collapse in that order (icons retain their
tooltips, §45.3/§46.8).

### 50.5 Card grid mode

`components/report/ReportCard.jsx` (the `report/` domain folder,
§15.5): the §44.6 card, containing reportDate (title line),
branch snapshot names (ellipsized), `MuiStatusBadge`, Updated
caption, and the same action icon row as
§50.4 (§46.8 icon styling) — **no owner/supervisor caption**
(per-user model §9). Grid: responsive Grid (`size` prop,
§46.2) — 1 column xs, 2 columns sm, 3 columns md, 4 columns
lg; cards are not selectable (selection is a grid-mode feature,
§50.7).

### 50.6 Row actions & confirm dialogs

- **View** — icon `VisibilityIcon` (`sx={{ color: 'primary.main'
  }}`), tooltip "View", navigates to `/reports/:reportId`.
- **Edit** — `EditIcon` (`warning.main`), tooltip "Edit",
  re-enters the wizard (§52).
- **Archive / Restore** — toggling `isArchived` (§21.6);
  MuiConfirmDialog copy: "Are you sure you want to archive this
  report?" / "Restore this report?"; confirmColor `primary`; the
  §31 guard governs availability (a `completed` report archives
  — §21/§31 — nothing here invents a restriction).
- **Availability per row state.** Active rows
  (`isArchived: false`) offer **Archive**; archived rows offer
  **Restore or Delete** — the row's state decides the offered
  actions in both views (§50.4 grid column and §50.5 card,
  identical sets): archived → Restore / Delete; active → Archive.
  A fresh page (no filters — OQ-009) lists what the list
  contract returns; the dev adapter lists **all** rows absent
  `isArchived` (§66.10 clause), so archived rows and their
  actions are reachable before the filter dialog exists.
- **Delete** — the §31 delete path: on the **archived** row it
  is the final-removal intent (retention-window semantics §17.4,
  BR-15; the dev adapter simulates by permanent removal with
  retention copy, §66.10); on an **active** row the endpoint
  itself is the archive step of the two-path lifecycle (§31.7) —
  the page never offers Delete on active rows;
  MuiConfirmDialog confirmColor `error`, copy "Delete this
  report? It will be permanently removed after the retention
  period."; on success → toast (§60) and the row leaves the
  cache (tag invalidation, §42.6).
- After a mutation the cache updates via the §42.6 invalidation
  tags (`Reports`) — no manual refetch (ADR-033).

### 50.7 Toolbar, pagination & selection

- Grid toolbar (§46.8 GridToolbar): columns toggle, filter,
  density, and **CSV export** operating on the **selected rows**
  (the §58 export surface). When cards mode: no toolbar (the
  PDF/CSV export entry for card rows lives on the details page,
  §51).
- Pagination per §46.7/§46.8: server-driven (`page`, `limit`
  from the §11.5 `PAGINATION_*` mirrors; `pageSizeOptions
  [10, 25, 50, 100]`).

### 50.8 States & edge cases

- **Loading** — the grid overlay loading state (§46.8) / card
  skeletons.
- **Empty** — the custom `noRowsOverlay` (§46.8) / cards empty:
  "No reports yet — create your first report" with the inline
  "New report" action; the group's **Create** button stays
  available in every state.
- **Error** — §60 toast + inline retry over the grid.
- **Edge cases (enumerated).** An archived branch name still
  renders through the snapshot (tombstone rule, §17.4/§20); the
  no-rows overlay fills the grid body height (§46.8 — the overlay
  is sized viewport minus header/footer, so the empty content
  never paints a fixed stub); delete on the last page
  re-fetches the current page (tag invalidation covers the cache —
  page index clamps server-side per §31); deep links to a report
  that was deleted land on the §59 404 or a §60 toast per the
  §31 detail contract.

### 50.9 Verification usage

- Grep gates: no client-side paging math (ADR-034 — `totalDocs`/
  `totalPages` only); action icons colored via `sx` (§44.2); the
  action-group buttons hold icon + text and the view toggle
  labels "List"/"Cards" (md+ only — below md no List/Cards
  buttons exist and the data grid never renders); no
  owner/supervisor column or caption in the §50.4/§50.5 surfaces
  (per-user model §9); no `reportId` document field (only the
  route params and cache keys, §9.3).
- Cross-section checks: mirrors §15.8 (the list/grid forward gate),
  §31 (guard reuse and delete), §17.4/§21.6 (archive visibility),
  §20 (branch snapshot), §11.5 (status/pagination mirrors), §46.7/
  46.8/46.13 (components), §58 (selection export), §60 (states).
- §50 introduces no constant (§11 unchanged), no path beyond §15.5,
  and no package; it is standalone — it references only
  specification sections.

---

## 51. Page — Report Details

### 51.1 Purpose & scope

§51 owns `/reports/:reportId` (§41.3, §50.4 View action) — the
single-report surface and the **hub** of the status machine
(§12.4: details → wizard → transcription review → report review
are thin views over the §30–§35 services). It exists because a
report's artifacts (header, visits, clips, transcriptions,
conversation §24, content slots §21.2) exceed any list surface, and
because almost every lifecycle action happens here: edit, accept,
archive/restore/delete, export, correction, and the per-report
conversation.

- **Owned here (normative).** The page composition and header
  (§51.2); the content/editor surface and corrections entry (§51.3);
  the metadata sections — visits, clips, transcription state,
  conversation launcher (§51.4); the action toolbar and lifecycle
  flows (§51.5); states, edge cases, and the reject/accept rules
  (§51.6).
- **Owned elsewhere — deliberately not repeated here.** The status
  machine, guards, and the accept/reject transitions = §31 (Part C)
  — this page renders actions **per the §31 transition-guard
  table**, reused identically (BR-06); export flows = §58; modes =
  §54 (transcription) and §51.3 (report body); chat = §55; wizard
  re-entry = §52; DTOs and fetch = §31/§42; sanitization = §61;
  toast and state protocol = §60.
- **Explicitly out of scope §51.** No transition rule, no delete-
  cascade shape (§31), no new constant (§11 unchanged), no path
  beyond §15.5 (`pages/`, `components/report/`), no package.

### 51.2 Composition & header

Inside AppShell (§47.3), page header first (§46.12): eyebrow
"Report", title "Daily Report — {`reportDate` as `DD-MM-YY`}"
(falls back to "New report" while uncaptured), subtitle =
`supervisorName` snapshot (§21.2, the `ስም` value — called by its
chrome label "Supervisor"); `actions` slot per §51.5. Below the
header, a **status band**: `MuiStatusBadge` (§46.13) + the
Type-1/Type-2 label derived per §6.4 (§21.2 — **derived, never
stored**): "Type-1" (single visit) / "Type-2" (two or more) +
report `status` in English chrome copy. Then the body sections
(§51.3) and metadata sections (§51.4).

### 51.3 Content surface & corrections entry

- **Before first generation** (`raw`/`latest` null, §21.2): the
  body renders the §60 empty state — "This report has no generated
  content yet" — with the primary action **"Continue in wizard"**
  (§52 re-entry at the status-matched step).
- **After generation:** the body is `MuiEditor` (§46.16) in
  **read-only** mode rendering `latest` sanitized (§61) — the
  read-only reference view; switching to editing happens through
  the **Edit** action of §51.5 or the §52 wizard (BR-05 — the
  wizard is the capture path).
- **Corrections entry (report body):** a "Correct" action (toolbar)
  opens the correction panel beside/below the body — the Modes
  1–3 surface of §54 applied to the **report content**
  (Mode-1 Save = the §35 PATCH endpoint; Mode 2/3 Accept/Revert =
  the §35 correction flow; the raw/latest single-undo contract of
  §21.5 applies identically at report level). The panel reuses the
  §54 components verbatim — no second implementation (§12.4).
  After a successful Mode-1 save or Mode-2/3 accept, the page
  refreshes the body via tag invalidation (§42.6).
- **Sanitized render rule:** any HTML the head renders (`latest`,
  conversation messages) passes the §61 sanitize-on-render pipeline
  of `MuiEditor`/mission display components — `dangerouslySetInnerHTML`
  only post-sanitize (§46.16).

### 51.4 Metadata sections

- **Visits** — a compact table (per-visit): `visitNo`, `branchName`
  (snapshot, tombstone-safe §17.4/§20), "Clock in", "Clock out"
  (`HH:mm`, required per visit — §21.2). Derived day start/
  exit and the header line never render as stored fields (§21.2 —
  only `visits[]` is data).
- **Audio clips** — the clip group per visit (from the §32 audio
  surface via §42; metadata DTO of §22.7 — **no `filePath` ever
  reaches the browser**): `MuiAudioPlayer` (§46.17) per clip,
  MIME/size/duration captions, and the clip's visit binding label.
  When the report holds audio, the clip list supports the
  **Re-transcribe** entry of §54 (visible for every clip at every
  status **except** `completed`; at `reviewed` the §23.4/§31
  rewind rule governs the transition — the button remains
  available and the §31 guard applies).
  **Last-clip deletion warning:** deleting the last audio of an
  `audio_attached`/`transcribed`/`reviewed` report triggers the
  §17.4 rewind — the confirm dialog names the consequence ("This
  is the last clip — the report will return to `audio_attached`
  (or `draft`)", per the §31 rewind declaration).
- **Transcription state** — per clip: `raw` vs `latest` status
  (initial equal pair, §23.2), the per-clip review state (the
  §6.10/§6.11 vocabulary when authored — rendered as UI state
  chips, never a `TRANSCRIPTION_STATUSES` constant), and the
  **Restore original** action (copy `raw` → `latest`, the single-
  undo of §23.2/BR-11).
- **Conversation launcher** — a "Correction chat" entry that opens
  the §55 panel (per-report conversation, §24.2 unique ref).

### 51.5 Action toolbar & lifecycle flows

Header `actions` (right-aligned, §46.12), enabled per the §31
transition-guard table — the page never codes its own guard:

| Action | Trigger | Flow |
|---|---|---|
| **Edit** | always (per §31 guard) | → `/reports/:reportId` wizard re-entry at the status-matched step (§52.3) |
| **Correct** | when content exists | opens the report-body correction panel (§51.3/§54) |
| **Chat** | always | opens the §55 conversation panel |
| **Export** | when `latest` exists | the §58 export menu |
| **Accept** | per the §31 table (the reviewed → completed path) | runs the §31 accept; on success → toast "Report completed" + status band refresh (§42.6) |
| **Archive / Restore** | per §31/§21.6 | MuiConfirmDialog per §50.6 copy; restores re-appear as active (Edit/Correct/Export/Accept reappear) |
| **Delete** | per §31 | MuiConfirmDialog `confirmColor="error"`, "Delete this report? It will be permanently removed after the retention period." (§17.4, BR-15 — restore stays possible inside the §11.3 window; no instantaneous permanent delete); on success → toast → navigate to `/reports` (§50) |

**Completed-report posture (§21.5/§17.4):** at `completed` the
report remains editable via Mode-1 Save and corrections (BR-11),
Re-transcribe and Accept are hidden (the §31 table), and audio
deletion is storage hygiene only (no rewind) — the §51.4 clip
surface states this in its confirm copy.

### 51.6 States & edge cases

- **Loading** — page-level `LoadingSpinner` (§46.14); **error** —
  the §31 detail contract failure → §60 toast; a 404/
  not-found → the §59 404 surface; **success/empty** per §51.3.
- **Edge cases (enumerated).** Unauthorized ownership (403, BR-13)
  → §60 toast + redirect to `/reports`; archived report → a
  read-only banner with the Edit/Correct/Export hidden per §31 and
  only Archive/Restore/Delete visible; direct navigation to a
  `draft` report (no wizard use) → the §51.3 empty state with the
  wizard continuation; concurrent edits — the cache refreshes via
  invalidation, and the §27 error surface reflects any server-side
  version/reject (per the §31/§35 contract) as a toast, never a
  silent overwrite; the conversation panel state is §55's.

### 51.7 Verification usage

- Grep gates: no guard table duplicated in this section (only
  "per the §31 transition-guard table"); no `acceptedAt`/
  `exportedAt` field anywhere (§21.5); no stored Type-1/Type-2
  field (derived only, §21.2); the Accept action never renders at
  `completed`; no `filePath` surface on the clip list (§22.7); no
  `TRANSCRIPTION_STATUSES`.
- Cross-section checks: mirrors §31 (guards, accept, rewind, hard
  delete), §21.2/§21.5/§21.6 (registry, accept, archive), §17.4/
  §17.6 (rewind and presence), §22.7/§32 (clip metadata DTO),
  §23.2/§23.4 (raw/latest and re-transcription), §24.2/§55
  (conversation), §54 (modes reuse), §58 (exports), §61
  (sanitization), §60 (states), §12.4 (thin views).
- §51 introduces no constant (§11 unchanged — `reportId` is a
  route parameter, §9.3), no path beyond §15.5, and no package; it
  is standalone — it references only specification sections.

---

## 52. Page — Report Wizard (New / Edit)

### 52.1 Purpose & scope

§52 owns `/reports/new` and `/reports/:reportId/wizard` (§41.3)
— the single creation and editing path (BR-05). It exists
because §3.1.2 F1–F5 require the supervisor to record and correct
data through a structured flow, and BR-02 put one working loop at
the center of the product. The wizard is **one component, two
modes** (Add / Edit) driven by the same state machine — no
duplicate flows (ADR-033).

- **Owned here (normative).** The step model and navigation
  (§52.2); the Add and Edit entry modes (§52.3); the step-by-step
  content — Basic info, Visits, Audio, Transcription, Report —
  including the §6.3 field application (§52.4-§52.9);
  validation and its stop points (§52.10); states, edge cases,
  and the leave-guard (§52.11).
- **Owned elsewhere — deliberately not repeated here.** DTOs and
  the lifecycle endpoints = §30–§35 (Part C); the Type-1/Type-2
  day derivation = §6.4; the branch model = §20; the
  transcription surface (§54.3 Modes 1–3) = §54
  (reused, not re-implemented); sanitized generation = §21; export
  print = §58; toasts = §60; existing components = §46.
- **Explicitly out of scope §52.** No endpoint shapes, no
  derivation logic, no role model (§28), no new constant (§11
  unchanged — wizard fields come from the §6.3 field list), no
  new path beyond §15.5, no package.

### 52.2 Step model & navigation

Steps in order (labels are chrome copy, §7.6): **1. Basic info →
2. Visits → 3. Audio → 4. Transcription → 5. Report**. The
**step list replicates the creation order of §31.2-1 through
§31.2-5** (fields per §6.3) — the wizard is the correct
client side of that order; one ListItem per step (lead +
trailing) leading to the section index (`data` from the form
values when valid, `Sequential` stepper §46.5).

- **Nav rules:** Prev/Next buttons (text buttons with start/
  end icons); Next is blocked when the current step is
  invalid (completion strategy §46.5); the stepper shows which
  steps are complete; the **leave guard** of §52.11.
- **Final CTA (Add mode):** last button = "Create" (contained;
  loading state on submit, §46.3).

### 52.3 Add vs Edit entry modes

- **Add** (`/reports/new`): steps 1–3 draft → next creates the
  report through §31.2-1; then step 4/5 appear (post-creation,
  BR-05). After create → navigate to §51 with the new `reportId`
  (no autosave on the client — §31.2-1 owns creation; each
  completed step saves through its endpoint, §52.10).
- **Edit** (`/reports/:reportId/wizard`, §50.4/§51.5 Edit):
  enters the wizard at the **status-matched step** — draft →
  step 1; audio_attached → step 2 (the visits step of an
  untouched report); transcribed → step 4; reviewed → step 3
  (audio can still be added/removed and re-transcription and all
  three correction modes are open, §23.4/§34.7); completed →
  step 5 (the final-report surface — the three correction modes
  stay available via §35/§54; audio and transcription are frozen,
  BR-12 end) — computed from the §31 status index. The current
  report's `latest` content (§21.2) fills the step forms. Editing
  posts through the §35 PATCH (Mode-1 Save) on each completed
  step.

### 52.4 Step 1 — Basic info

Consumes `supervisorName`, `reportDate` (the §6.3 field list),
rendered with the §46.4 form fields (labels = the §7.6 chrome
copy of the fields).

- **supervisorName** — the `ስም` header value (§6.3 field 3):
  initial value = the `user` display name (§28), editable;
  Enter-name placeholder.
- **reportDate** — the `ቀን` value (§6.3 field 1): the §46.6
  Ethiopian date picker (`MuiDatePicker` + `ethiopianDate.js`),
  stored as a UTC `Date` at the boundary (§21.2), never a free
  text field. The step collects no coordinates — no `lng`/`lat`
  field exists in any model (§21.2, §31.2-1); wizard chrome never
  posts one.

### 52.5 Step 2 — Visits

The MuiDataGrid of §46.8 with the domain columns from
`components/columns/visits.jsx` (§15.6): **#**, **Branch** (select
from **active branches only**, §20), **In** / **Out**
(`HH:mm` time inputs with the §43.6 dual binding), **Actions**
(remove row). Inline add row via the row icon button
  (`AddIcon`) / keyboard shortcut (the grid slot props, §46.8);
  a row's branch displays its snapshot name (tombstone-safe,
  §17.4/§20).

Validation: each visit requires a branch (required), both the
"In" and "Out" times are required per row — the **day clock
rule of §6.3 field 4/§21.2**: on a Type-1 (single-visit) day the
row pair is the day pair (auto-set — the derived day start/exit
of §6.4 equals the row's values, shown as helper text), on a
Type-2 day every visit carries its own pair — times are `HH:mm`
(§43.6), and the derived day start/exit (first In, last Out,
§6.4) render as an under-grid helper line. `clockIn`/`clockOut`
are never null in the submitted block.

### 52.6 Step 3 — Audio

Upload & recording components of §46.17 (`MuiFileInput` +
`MuiRecorder`): multiple file upload and device recording,
**labelled per visit** (clip bindings, §32) — **one recording
tab per visit proved by §6.10's binding model, with no
global/all tab** (a Type-1 day shows no tab: binding is
implicit, §6.10). The grid
mirroring = MuiDataGrid per visit of clips (mirror + file
inputs icon). Play/re-download/delete of a clip is §32's surface,
reused (§46.17). **Non-audio files** render the placeholder/
reject copy of §32's MIME gate — the step accepts only
`AUDIO_ALLOWED_MIME_TYPES` (§11.3), never `.mp4`.

### 52.7 Step 4 — Transcription

The step hosts the §54 Modes 1–3 surface (audios list / accept
selected / instructions on selected) **within step mode** —
reused verbatim components, same services (§33/§35), same copy
conventions (§7.6/§60) — no second implementation (§12.4,
ADR-033). The Modes-2/3 accept/reject reading views replace the
wizard's generic step UI — the wizard step is the §54 handler's
host.

### 52.8 Step 5 — Report

The step hosts the **§54 report-mode** surface (Mode-1 Save =
§35 PATCH on completion; the finished report view; navigation to
§51 on finish). Read-only until the §21.4 generation exists. At
`completed` the step stays editable through the §54 Modes 1–3
(corrections only, BR-10) and becomes the **final-report
surface**: the finished-report view with the §58 print/export
actions; audio and transcription changes are frozen (BR-12 end,
§31.4). "Create" (Add) / "Finish" (Edit) completes the flow →
§51.

### 52.9 Field contract application (normative)

The wizard renders the §6.3 field list — `reportDate` (field 1),
`supervisorName` (field 3), and the `visits[]` block (field 4) —
with the §46.4 form fields and §43.6 date/time formatting, and
steps in §31.2's creation order; **no string label or rule is
hardcoded in the wizard implementation** (labels are the §7.6
chrome copy). Both modes consume the same field contract. Fields
added to §6.3 in the future render as the wizard evolves in
lockstep with the format section — the format section is the
source of truth.

### 52.10 Validation & stop points

Validate on demand (step completion / field blur), governed by the
None→error protocol of §46.4 (a top summary line: "This section
has issues, review them below" — the error summary rule).

- **Server rule mirror strategy (leave-guard):** on **Next**, the
  client posts through the §31.2/§35 call of the completed step;
  on success → next step; on a validation failure → step stays,
  toast (§60) shows the server's message, fields focus
  (§46.4). This is the **Bespoke-by-default** check of §43.7 —
  the client holds no validation-config copy; the only client-side
  mirrors of server rules are the §46.4 required-field protocol
  and the visits day-clock pair rule (§6.3 field 4/§21.2), needed
  for the day start/exit derivation.

### 52.11 States, edge cases & leaving

- **Loading** — the wizard fetching the report (Edit) shows the
  §46.14 spinner; guard until loaded.
- **Error on create** — §60 toast, stays on step 1 with the
  server message applied to the fields.
- **Leaving mid-flow** — unsaved changes are silently dropped
  when navigating away from step 1 in Add mode (nothing exists on
  the server yet). When a report exists (Edit; or Add past step
  1), exiting the wizard → the server owns the saved state (each
  completed step posts its write); the browser back button / app
  navigation leaves naturally. No confirm dialogs, no
  unsaved-changes prompts — per-step saves mean there is never
  unsaved wizard state.
- **Add-mode recovery:** if the user closes the browser after a
  create but before navigation, the draft report remains a
  `draft` (server truth, §17) — re-entry via the Reports list
  (§50) or the §49.2 recent list.

### 52.12 Verification usage

- Grep gates: the only client-side validation mirrors are the
  §46.4 required-field protocol and the visits day-clock pair
  rule (§6.3 field 4); no `saveMode`, no coordinate or country
  rules, no step/field labels inline in the wizard (labels are
  §7.6 chrome); only one wizard component (Add/Edit shared); no
  validation code duplicated from §29/§54; **no autosave on the
  client** (every completed step posts its write).
- Cross-section checks: mirrors §31.2/create + §35 (patch),
  §31 (status-matched step mapping), §21.2 (latest fill, clock
  pair), §54 (modes reuse), §6.3/§6.4 (day clock rule), §46.6
  (date picker), §43.7 (bespoke default).
- §52 introduces no constant (§11 unchanged — `reportId` is a
  route parameter), no path beyond §15.5, and no package; it is
  standalone — it references only specification sections.

---

## 53. Component — Editor Components

### 53.1 Purpose & scope

§53 owns the **editor-component set** used by §54's correction
modes and by the report/transcription review surfaces: the
writing surface over the report content (Mode 1), the read-only
renderer, the fixed toolbar, and the `±`-token display rule. The
editor core itself is §46.16's single `MuiEditor` (TipTap +
DOMPurify, ADR-038) — this section never defines a second editor.

- **Owned here (normative).** The writing-surface structure
  (§53.2); the MuiEditor usage contract and the `±`-token display
  rule (§53.3); the read-only renderer (§53.4); editor chrome &
  the Save/Accept strip (§53.5); the state-sharing rule (§53.6);
  verification (§53.7).
- **Owned elsewhere — deliberately not repeated here.** The
  editor core, toolbar scope, and HTML contract = §46.16/§14.4;
  the content slots and field types = §21.2; the correction
  endpoints and the `±` protocol's owner = §31.6/§35.3; the
  audio/recorder components = §46.17; validation and error
  protocol = §46.4/§60; sanitized rendering = §61; the
  transcription segment = §23.4.
- **Explicitly out of scope §53.** No HTML generation, no
  typography transformation, no route, no constant (§11
  unchanged), no package (the editor deps of §46.16, §13.5).

### 53.2 Writing-surface structure

The surface, when editing report content or a transcription
review segment (the Mode-1 hosts, §54), renders in this order:

1. **Surface header** — chrome: the edited object (report body /
   transcription), the report's status badge (§46.13), and the
   "back to report" affordance (§51).
2. **MuiEditor** (§53.3) — the writing surface, seeded with the
   current `latest` content (§21.2).
3. **`±`-token strip** — the §35.3 guidance rendered as a subtle
   helper ("±: leave this token untouched — it maps to official
   text"); it renders whenever the current content contains a
   `±` token (never resolved client-side).
4. **Field validation** — the §46.4 error protocol applied; the
   error message under the editor.
5. **Toolbar** (§53.5) — the §46.16 ADR-038 set.
6. **Save / Accept** — the Mode-1 Save (PATCH via §35) and, on
   the review surfaces, the §54 Accept/Revert strip (the wiring
   is §54's — this section only specifies the affordance).

### 53.3 MuiEditor usage contract & the ±-token display rule

- **Single implementation:** the only rich-text editor is
  `MuiEditor` (§46.16, `components/reusable/MuiEditor.jsx`).
  Usage contract:
  - Props per §46.16 (`value` HTML, `onChange`, `readOnly`,
    `minHeight`, `id`); `value` is always the current `latest`
    (§21.2) — never `raw`.
  - Toolbar = exactly the §46.16 ADR-038 scope (**Bold, Italic,
    Font size, Text color**) — no other toolbar actions exist.
  - HTML in/out (TipTap → HTML, §14.4); `DOMPurify` sanitizes on
    **write and on render** (§61); no JSON-document storage
    (§14.4).
  - The OQ-007 storage format (plain text vs rich-text HTML in
    `raw`/`latest`) is decided at the editor phase (§46.16,
    §21.2, §66) — MuiEditor emits and consumes HTML either way.
- **`±`-token display rule (normative):** the `±` prefix marks
  official/entitled text the user must not freely alias (§35.3).
  The client renders `±` strings **as-is** — never strips,
  never resolves, never translates them (resolution is
  server-side at export: §37/§64). The strip of §53.2 item 3
  carries the guidance; no other typing rule exists (there is no
  linear-write mode, no line-break policy, no syntax highlighting
  in this product's editor).
- **Typing guidance (chrome text):** the editor shows a helper
  line "Type naturally — we'll handle the formatting". State
  persists per editing session (shared through the §54 surface;
  never persisted client-side, §53.6).

### 53.4 Read-only renderer

- The finished-report and print views render through the **same
  sanitized surface** (§46.16 MuiEditor in `readOnly`, §61) — no
  client-side HTML construction, no second renderer (ADR-033).
- `±` tokens render verbatim in read-only mode (the §53.3 rule).
- Empty content renders the §60 empty-state convention, never a
  placeholder fabricated client-side (BR-19).

### 53.5 Editor chrome & Save/Accept strip

- The toolbar is the §46.16 fixed scope; the editor chrome also
  carries: the content-state label (staged vs saved, from the
  §54 surface state), the `±`-guidance toggle, and the
  read-only indicator.
- **Save** (Mode 1) — triggers the §35 PATCH; loading state on
  the button (§46.3); success → toast (§60) + the report's
  `latest` refresh (§21.2); failure → §46.4 error + §60 toast.
- **Accept / Revert** strips (the review surfaces, §54) — the
  affordances only; the wiring is §54's.

### 53.6 State sharing

The editor states (current segment, current draft, the host
"current edit") are held by the **surface handler** (§54 hosts
it) and passed to the editor and strips — one `currentEdit`
object per host; every segment reads/writes it. Any client state
is session-scoped memory (ADR-034, §12.2-10) — never persisted
(localStorage/IndexedDB are out of scope everywhere).

### 53.7 Verification usage

- Grep gates: no second editor implementation (only `MuiEditor`
  (§46.16) and its read-only renderer); the toolbar contains
  exactly the §46.16 ADR-038 set; no client-side `±`-resolution;
  no localStorage/IndexedDB in the editor surface; no client-side
  HTML generation (the server transforms, §61).
- Cross-section checks: mirrors §21.2 (content slots), §35.3
  (± protocol), §46.16/§14.4 (editor core), §54 (modes and
  strips), §46.4/§60 (errors), §61 (sanitized rendering),
  §12.2-10 (ephemeral state).
- §53 introduces no constant (§11 unchanged), no path, and no
  package; it is standalone — it references only specification
  sections.

---

## 54. Component — Correction Modes (Correction Modes 1–3)

### 54.1 Purpose & scope

§54 owns the **correction-modes components** — the shared
components behind the three correction modes (§35.2, BR-08/BR-09)
that both the report body (§51.3) and the wizard transcription
step (§52.7) reuse: Mode 1 (typed save over `latest`), Mode 2
(typed instruction → staged partial edit), and Mode 3 (voice
instruction → staged partial edit). The machinery is **driven by
the §35 service through the §31.6 endpoints** — the client stages
and renders; the server decides and persists (ADR-034).

- **Owned here (normative).** The mode components and their reuse
  map (§54.2); the common hooks — the `±` token display, the
  reason vocabulary, the staging rule (§54.3); Mode 1 — typed
  save (§54.4); Mode 2 — typed instruction (§54.5); Mode 3 —
  voice instruction (§54.6); the mode state machine (§54.7);
  states & edge cases (§54.8); verification (§54.9).
- **Owned elsewhere — deliberately not repeated here.** The
  correction engine and its contracts = §35; endpoints and guards
  = §31.6; transcriptions = §23; the editor = §53; the
  conversation/chat = §55; the editor step/accept wiring of the
  wizard = §52.7; record/audio components = §46.17;
  validation/error/toast = §46.4/§60; sanitized rendering = §61.
- **Explicitly out of scope §54.** No endpoint shapes (§31.6), no
  engine behavior (§35), no new constant (§11 unchanged), no new
  path, no package.

### 54.2 Mode components & reuse map

| Component | Purpose | Reused by |
|---|---|---|
| **Mode-1 surface** | `reports/edit-content/` — the §53 writing surface over `latest` (save = §35 PATCH) | §51.3 (report body), §52.7 (transcription step), §52.8 (final-report step) |
| **Instruction panel** | `reports/correct-instruction/` — the Mode-2 typed instruction input (textarea, §46.4) | §51.3, §52.7 |
| **Voice-correction panel** | `reports/correct-voice/` — the Mode-3 MuiRecorder strip (§46.17) | Mode-2/3 hosts |
| **Corrected-strip** | `reports/corrected-strip/` — the staged `changed[]` slots rendered read-only with server reasons + Accept / Revert | Modes 2/3 surfaces |
| **Accept/reject strips** | the §31.6 accept actions — per-clip transcription accept; the report Accept (`reviewed → completed`) | §51/§52 surfaces |
| **Unassigned panel** | `reports/unassigned-panel/` — the §6.11 rule-4 surface: digest items with `attributionBasis: "unassigned"` (the `unassignedItems[]`) rendered for one-tap branch assignment (moves the item into the branch's list with `user-assigned`) | §51.3, §52.8 (accept-gate routing) |

Each is its own component; **no implementation is duplicated in
reviewers/editors/wizards/chats** (ADR-033); the same component/
service pair serves every host (the §51.3/§52.7/§52.8 hosts).

### 54.3 Common hooks (normative)

- **`±` token display** — every rendered content keeps `±`
  strings as-is (§35.3): never stripped, never resolved, never
  translated (resolution is server-side at export: §37/§64). The
  writing surface shows the §53.3 guidance; staged results keep
  the tokens verbatim (the §35.3 diff verification guarantees
  it).
- **Reason vocabulary** — staged slots carry server-returned
  reasons (the §35.4 reason vocabulary); the client renders them
  verbatim in English chrome copy (§7.6) — never invented, never
  translated client-side.
- **Staging rule** — a Mode-2/3 correction is **staged, not
  written**: the engine returns the partial content, the
  client stages it (the Corrected-strip), `latest` is persisted
  only on Accept (§35.5). **Revert** discards the staged copy or
  restores `raw` → `latest` while they differ; staging never
  persists client-side (ADR-034).
- **Item status editing (the §6.11 vocabulary)** — activities
  and issues render editable `status` chips (`reported` /
  `in_progress` / `completed`, §6.10) and comments an optional
  `rating` 0–5; the review surfaces mirror the digest items by
  `itemId`; edits persist through a Mode-1 save (§31.6 content
  PATCH clears the digest — §6.11) — never as a separate
  endpoint.
- **Clip review-chips (UI state only)** — the transcription
  review lists mark clips `reported → in_progress → completed`
  (§6.10) feeding the §31.6 per-clip accept gesture; the chips
  are session state — never a persisted field (§23.2).
- **Strict boundary:** a Mode-2/3 correction touches only the
  addressed part (BR-09); whether the result is the official text
  is the server's decision (§35.3, §64) — the client never judges
  content.

### 54.4 Mode 1 — Typed save

- The user edits the current `latest` content directly in the
  §53 writing surface (MuiEditor). **No AI** — on Save the full
  edited content posts through `PATCH /reports/:reportId/content`
  (§31.6); sanitized on the server (§61); `latest` replaced,
  `raw` untouched (BR-11).
- Validation through the §46.4 protocol in the writing surface;
  re-validated server-side (§29). Success → the §53 strip +
  toast (§60); the report status never changes (BR-06, BR-10).
- Allowed at every status **including `completed`** (BR-10;
  §31.6).

### 54.5 Mode 2 — Typed instruction

- The instruction panel holds the typed instruction (textarea);
  it may name the exact §6.3 field/§6.7 content class (§35.2).
  Submit → `POST /reports/:reportId/correct` (§31.6).
- The engine returns the staged partial (`changed[].{ section,
  field, content, reason }`, §35.4) → rendered read-only in the
  Corrected-strip.
- **Accept** — the Accept action of §31.6 persists the merged
  content to `latest` and completes the correction turn (§35.5);
  **Revert** discards the staged copy or restores `raw`
  (single-undo, BR-11). The instruction may be quoted into the
  §36 conversation as the user's correction turn (audit trail,
  §35.6).

### 54.6 Mode 3 — Voice instruction

- The voice-correction panel records the instruction with the
  §46.17 recorder and submits `POST /reports/:reportId/correct`
  (multipart, `mode` = `voice`); the clip is transcribed through
  the §33 pipeline (§35.6) — **the Mode-3 clip is ephemeral**,
  never stored as an Audio row (§32 DTO gate).
- Result: the Mode-2 engine runs against the transcribed
  instruction; the staged flow (Corrected-strip, Accept/Revert)
  is identical to Mode 2's (§54.5).

### 54.7 Mode state machine

`mode` ∈ {`mode1`, `mode2`, `mode3`}; a single lifted state per
surface (§53.6 `currentEdit`); entering the surface → the host's
initial mode (report body and wizard transcription step start in
Mode 1; Modes 2/3 chosen by the user); leaving/saving →
accept/revert per the strip; the surface shows its mode chip
(chrome: "Edit", "Instruction", "Voice"). The machine is §53.6's
host state — no persisted mode (ADR-034).

### 54.8 States & edge cases

- Loading (server call pending) — the strip's spinner (§46.14) +
  disabled accept; error — §60 toast, the typed text/instruction
  retained; offline-save — server reject, the strip shows the
  error and re-validates on retry.
- **Stale `latest` while a mode is open** (e.g., a regeneration
  or a concurrent correction changed the content) → the
  Corrected-strip renders a "Content changed — please review"
  inline notice and returns the surface to Mode 1; the staged
  copy never silently overwrites a newer `latest` (conflict
  toast, §27.5).
- A mode surface edits one segment at a time (the §53.6
  `currentEdit`); concurrent writes are the server's concern
  (§27).
- **Accept-gate routing (§31.6/§6.11)** — when report Accept
  returns the unassigned-gate 422 (with the unassigned item
  texts), the surface routes to the Unassigned panel: the
  supervisor assigns each item to a branch (rule 4, one tap) or
  edits the content via Modes 1–3, then Accept is retried; the
  panel never drops an item silently.

### 54.9 Verification usage

- Grep gates: no HTML generation in the client components (the
  server transforms, ADR-034); no `±`-resolution client-side;
  the components are exactly the four of §54.2 (no second
  implementation anywhere); the mode chip labels fixed ("Edit"/
  "Instruction"/"Voice"); no second `currentEdit` store; no
  validator copied into the components (§29 owns validation).
- Cross-section checks: mirrors §35 (engine), §31.6 (endpoints,
  accept/revert), §51.3/§52.7/§52.8 (hosts), §53 (editor), §55
  (conversation), §42 (server-call protocol), §21.2/§23.4
  (accept/revert single undo), §46.17 (recorder), §60 (errors).
- §54 introduces no constant (§11 unchanged), no path beyond §15.5,
  and no package; it is standalone — it references only
  specification sections.

---

## 55. Component — Conversation Bubble & Chat UI (UI only)

### 55.1 Purpose & scope

§55 owns the **client-side conversation surface** that the
§51.4 launcher opens — the chat bubble/panel — strictly as UI
over the **server-side conversation of §24** (Part C). The §24
server owns the message store, ordering, and role/content
semantics; this section owns placement, layout, interaction,
sending, and rendering (on the report body surface and the
transcription surface). The surface is built on **MUI X Chat**
(`@mui/x-chat`, §13.4; ADR-023 — the correction/chat interface).
Explicitly **out of scope**: the conversation model and API = §24
(Part C); any tone evaluation is a server-side detail of §24/§8 —
this section renders the conversation verbatim.

- **Owned here (normative).** The bubble/panel and its hosts
  (§55.2); the messages panel (§55.3); sending & Modes-state
  wiring (§55.4); states & edge cases (§55.5); verification
  (§55.6).
- **Owned elsewhere — deliberately not repeated here.** Data/
  endpoints/ordering = §24; message sanitization = §61; the
  launcher and the conversation loading = §51.4; the
  conversation state of the correction surface = §54; signing and
  sessions = §28; the MUI X Chat dependency itself = §13.4/§14.3
  (ADR-023, ADR-032).

### 55.2 Bubble & hosts

- The conversation panel renders as a **floating panel** wherever
  the hosts (the report body §51.3, the transcription surface
  §23.4, the report-content correction surface §54) place it. The
  panel composes MUI X Chat's building blocks per §13.4 (message
  dividers, typing indicator, scroll-to-bottom) over the §24
  data — no hand-rolled chat internals.
- The panel is **collapsible and dismissible**; it restores a
  min-height (no reflow jump, §45.5); the header is chrome copy:
  "Correction chat" plus the report's `ቀን` (Ethiopian date,
  §43.6) and a "close" icon. No conversation name, mission label,
  or read/unread states exist anywhere (§24 has none).

### 55.3 Messages panel

- Renders the §24 messages verbatim: per-message role (from the
  §24 contract — the rendered text is the server's, never
  reconstructed) and timestamp (relative, §43.6).
- The message text passes the §61 sanitize rule before render
  (messages are HTML/rich from the server) — no raw HTML.
- Typing indicator, scroll-to-bottom on new, and date dividers
  come from MUI X Chat (§13.4) styled per §44.

### 55.4 Sending & wiring

- Sending a message → the §24 POST; optimistic append with
  rollback on error (§60 toast); the input is disabled while
  awaiting server confirmation (one writer at a time per report;
  §24 concurrency).
- **Modes-state wiring:** when the §54 Mode-2/3 strip is open in
  the same panel, the strip narrows the input to the accept/
  revert actions (the §54 strip is the only writer then) — no new
  state invented; the surface's current mode (§53.6/§54.7)
  governs.

### 55.5 States & edge cases

- Loading (messages fetch) → skeleton rows; error → §60 toast +
  inline retry; empty conversation → "Start the conversation"
  hint with the first input focused.
- Message from a deleted/archived branch ref → the §24 contract
  resolves it (tombstone text per §17.4); the client renders it.
- No unsent-draft persistence: the input's draft is lost on
  panel close (session memory only, ADR-034; no localStorage —
  the global rule of ADR-034).

### 55.6 Verification usage

- Grep gates: the conversation UI is the only surface of the §24
  contract in the client (no second message list); MUI X Chat
  components are the only chat implementation (no hand-rolled
  message list, no custom bubble state — ADR-023/032); no
  client-side tone evaluation (server-only, §24/§8); no HTML
  construction of messages (sanitize-then-render, §61); no
  conversation name / read-unread client state; no persist of the
  input draft.
- Cross-section checks: mirrors §24 (data), §51.4 (launcher),
  §54 (mode state), §61 (sanitization), §44 (theming), §13.4
  (@mui/x-chat), §60 (toasts).
- §55 introduces no constant (§11 unchanged), no path, and no
  new package beyond the §13.4 manifest (ADR-023); it is
  standalone — it references only specification sections.

---

## 56. Page — Branches

### 56.1 Purpose & scope

§56 owns the Branches page (`/branches`, §41.3) — the
management surface for the supervisor's branches: listing,
creating, editing, and the two-path lifecycle actions
(archive → restore → permanent delete, BR-14/§30). It exists
because branches are the report's primary dimension (§20, §30)
and F2 names branch management as a first-class capability.

- **Owned here (normative).** Page composition (§56.2); the
  grid and its columns (§56.3); filters & toolbar (§56.4); the
  Branch Details page (§56.5); row actions and confirm dialogs
  (§56.6); states & breakpoints (§56.7); verification (§56.8).
- **Owned elsewhere — deliberately not repeated here.** Branch
  schema/tombstone/snapshot = §20; endpoints, guards, and the
  two-path deletion = §30; envelope/errors = §27; pagination =
  §46.7/§27.6; grid mechanics = §46.8; the column set =
  `components/columns/branches.js` (§15.6); toasts/empty states
  = §60; the registration display component = §46.17; the
  branch options in the report wizard/filters = §31.2-2/§50.3.
- **Explicitly out of scope §56.** No endpoint (§30), no
  transition rule (§30), no snapshot write (§20/§21), no new
  constant (§11 unchanged), no new path beyond §15.5, no
  package.

### 56.2 Page composition

Inside AppShell (§47.3), page header first (§46.12): eyebrow
"Branches", title "Branches", subtitle "Your supervision
branches"; `actions` slot: **"New branch"** (contained, §46.3)
which opens the branch create dialog (§56.4). Below: the filter
band and the `MuiDataGrid` (§56.3).

### 56.3 Grid & columns

`MuiDataGrid` per §46.8 with `components/columns/branches.js`
(§15.6; ADR-034 — server-driven data):

| Column | Content | Notes |
|---|---|---|
| Name | `name`, truncation per §45.4 | the report snapshot's source value |
| Location | `location`, ellipsized | management/display only; never snapshotted into reports (§20) |
| Status | `MuiStatusBadge` (`branchActive` variant — "Active" / "Archived", §46.13) | from `isArchived` — chrome copy, §7.6 |
| Archived | `archivedAt` as `DD-MM-YY` | `—` for active rows |
| Created | `createdAt` as `DD-MM-YY` | |
| Actions | Edit / Archive-or-Restore / Delete (§46.8 icon row) | per §56.6 |

Responsive: below **md** (900px, §45.2) the Location and Created
columns drop (icons keep tooltips, §45.3); the grid always reads
page slices — never a full dataset (§45.7/ADR-034). The row's
**Name** cell links to the Branch Details page
(`/branches/:branchId`, §56.5).

### 56.4 Filters, toolbar & the create/edit dialog

- **Filter band** (inline, not URL): an "Show archived" switch
  (default off — active-only, §30.2) and a text filter on `name`
  (client-side matches against the current page is allowed for
  display-only narrowing; server-side `q` goes through §39 if
  used) — the authoritative filter remains `isArchived`.
  Filter change resets to page 1 (server pages, §46.7).
- **Toolbar:** `GridToolbar` subset per §46.8 (columns toggle,
  density, filter, CSV export of selected rows through the §58
  export surface).
- **Create/Edit dialog** — `MuiDialog` (§46.17) with the §46.4
  form: fields `name` (required, 1–100) and `location`
  (required, 1–200), labels in chrome English (§7.6), validated
  client-side per §29's mirror rules with the §46.4 error
  pattern; submit posts §30.3/§30.4 via the §42 layer; success
  → toast (§60) + cache invalidation (§42.6 tags: `Branches`).

### 56.5 Branch Details page (`/branches/:branchId`)

**File:** `pages/BranchDetails.jsx`; domain components in
`components/branches/`.

**Purpose & composition.** The per-branch detail surface — the
branch's identity, its reports, and its analytics — reached from
the Branches grid (Name link, §56.3) and from global search
results (§59.3). Inside AppShell (§47.3):

1. **Page header** (§46.12): eyebrow "Branches", title = the
   branch `name`, subtitle = `location` with the `MuiStatusBadge`
   (`branchActive` — "Active" / "Archived", §46.13); no actions
   slot (edit/archive/delete stay on the grid rows of `/branches`,
   §56.6).
2. **Reports of this branch** — the §50 report list surface
   (list/grid toggle, status badges, §60 states) served **server-
   filtered by `branchId`** via the §39 query path — never a
   client-side subset of a shared page.
3. **Analytics** — the §38 per-branch analytics (reports per
   status over the §38 window, recent activity) rendered with the
   §49.4 chart conventions; loading/empty/error per §60.

**States & edge cases.** Loading — grid overlay/skeleton rows;
error — §60 toast + inline retry band; branch with no reports —
§60 empty state ("No reports yet for this branch"); unknown or
removed `:branchId` — the §30 `GET /branches/:branchId` 404
contract surfaces the §60 toast and the page renders an inline
not-found band with a "Back to branches" button (the §51.6
detail-route precedent: the §30 404 resolves **before** the
global 404). A tombstone branch (§17.4) renders its tombstone
surface with the same back link.

**Route note.** `/branches/:branchId` does **not** mark the
Branches nav item as selected (§47.6 page-context rule); the
page is fully built in the P4 pages phase (§66.9 P4); P3 ships
the route + placeholder only.

### 56.6 Row actions & confirm dialogs

- **Edit** — `EditIcon` (`warning.main`), tooltip "Edit", opens
  the §56.4 dialog pre-filled; allowed for archived branches
  too (§30.4).
- **Archive / Restore** — toggles `isArchived` (§30.5);
  MuiConfirmDialog copy: "Archive this branch? Reports keep
  their data." / "Restore this branch?" (confirmColor `primary`).
  409 from the §30 API renders the §60 toast and leaves the row
  as server truth.
- **Delete** — the two-path step 1 (§30.6): MuiConfirmDialog
  confirmColor `error`, copy "Delete this branch permanently?
  This archives it; it is removed after the retention period."
  On success → toast (§60) + tag invalidation; the row leaves
  the active list immediately (the sweeper removes the row per
  §62).
- Mutations never touch report snapshots (BR-14) — the grid
  read path is tombstone-safe (§17.4: a removed branch's
  reports still render their snapshot names in §50/§51).

### 56.7 States & breakpoints

- Loading — grid overlay loading (§46.8)/skeleton rows;
  error — §60 toast + inline retry band; empty (no branches
  yet) — §60 empty state with the "New branch" action inline
  ("No branches yet — add your first branch"); empty filtered —
  "No branches match these filters." + clear-filters button
  (chrome copy, §7.6).
- Breakpoint matrix (the §45.2 five buckets):

| Region | xs | sm | md | lg | lg+ |
|---|---|---|---|---|---|
| Page header | stacked | stacked | inline right | inline right | inline right |
| Filter band | stack (switch above grid) | inline row | inline row | inline row | inline row |
| Grid columns | Name, Status, Actions | Name, Status, Location, Actions | full | full | full |
| Create dialog | full-width (maxWidth sm) | sm | sm | sm | sm |

### 56.8 Verification usage

- Grep gates: no branch DTO field beyond the §20 serialized
  surface; no hard-delete call in the page (only archive, §30.6);
  no snapshot rewrite on any branch action; the archived default
  is hidden (active-only serve, §30.2); labels chrome English
  (§7.6).
- Cross-section checks: mirrors §20 (model), §30 (endpoints/
  guards), §15.6 (column set), §46.7/§46.8/§46.13/§46.17
  (components), §27 (envelope), §60 (states), §58 (CSV export),
  §31.2-2 (branch options source).
- §56 introduces no constant (§11 unchanged), no path beyond
  §15.5, and no package; it is standalone — it references only
  specification sections.

---

## 57. Page — Profile

### 57.1 Purpose & scope

§57 owns the Profile page (`/profile`, §41.3) — the single
account surface: identity fields, avatar, password-less profile
data, the session list with forced logout, and the logout
action. It exists because F1 makes profile fields and session
control part of the register-model (§3.2.2, §19).

- **Owned here (normative).** Page composition (§57.2); profile
  fields & avatar (§57.3); sessions list & forced logout
  (§57.4); logout (§57.5); states & breakpoints (§57.6);
  verification (§57.7).
- **Owned elsewhere — deliberately not repeated here.** User
  schema/derivation = §19; auth endpoints, tokens, sessions,
  avatar serving = §28; the avatar upload validation = §29;
  toasts/empty states = §60; components = §46 (avatar menu,
  MuiFileInput, MuiConfirmDialog); the login/register pages =
  §48.
- **Explicitly out of scope §57.** No token mechanics (cookies
  are §28's), no role/permission UI (ADR-036), no user
  deletion (§19 — none exists), no new constant (§11
  unchanged — `AVATAR_MAX_SIZE_BYTES`/`AVATAR_ALLOWED_MIME_TYPES`
  exist), no new path beyond §15.5, no package.

### 57.2 Page composition

Inside AppShell (§47.3), page header first (§46.12): eyebrow
"Profile", title "Profile", subtitle "Your account details";
`actions` slot: **"Logout"** (outlined, §46.3) — §57.5. Body:
a profile card (§44.6) with the avatar and identity, the profile
form (§57.3), and the sessions card (§57.4).

### 57.3 Profile fields & avatar

- **Identity block** — avatar (**48px** — the Profile-page avatar
  size, owned here; distinct from the §46.11 app-bar avatar
  32/36px) with an edit affordance (camera overlay) opening
  `MuiFileInput` (§46.17) accepting `AVATAR_ALLOWED_MIME_TYPES`,
  sized ≤ `AVATAR_MAX_SIZE_BYTES` (§29 mirror; client-side
  pre-check with the §60 toast on violation); plus `fullName`
  (§19 virtual) as the display title.
- **Form** (§46.4) — `position` (free string, display-only,
  ADR-036) and `firstName`/`lastName` (editable; the §19
  derived names unlock after a manual rename — nothing else
  changes) — submitted via `PATCH /auth/profile` (§28.5).
  Success → toast (§60) + the login-surface name refresh
  (session display name is §28's surface; snapshots in reports
  are unaffected, BR-14).
- Validation mirrors §29 (lengths 1–100 for names, 1–200 for
  position) with the §46.4 error pattern; the avatar upload
  needs no save button (files save on selection through §28.5).

### 57.4 Sessions & forced logout

- The sessions card lists `GET /auth/sessions` (§28.3) rows:
  device/issued caption per the §28 token bookkeeping (chrome
  copy English; idle tidbits minimal), each row with a **"Log
  out"** icon action → `DELETE /auth/sessions/:sessionId` behind
  the §46.17 MuiConfirmDialog ("End this session?"); success →
  toast + refreshed list. The current session's row is labeled
  "This session" (chrome) with the action disabled for it
  (logout clears it, §57.5).
- Empty sessions list → §60 empty state ("No other active
  sessions").

### 57.5 Logout

Header "Logout" Action → `POST /auth/logout` (§28.3) → clears
cookies server-side; the client drops the §42 auth state and
navigates to `/login` (§41.5 guard). No confirm dialog (the
action is reversible by logging in again — §7.6 copy keeps it
plain).

### 57.6 States & breakpoints

- Loading — `GET /auth/me` + `GET /auth/sessions` pending ⇒
  page-level `LoadingSpinner` (§46.14); error — §60 toast +
  inline retry per card; success — full render. A failed
  profile PATCH keeps entered values (no silent reset, ADR-033).
- Breakpoint matrix (the §45.2 five buckets, single-column
  profile layouts):

| Region | xs | sm | md | lg | lg+ |
|---|---|---|---|---|---|
| Identity + form | stacked, single column | stacked | profile card + sessions side by side (equal thirds) | same as md | same as md |
| Sessions card | below the form | below the form | beside the form (third) | same as md | same as md |

### 57.7 Verification usage

- Grep gates: no `role` field in any DTO the page touches
  (ADR-036); no token in the client (cookies only, §28.2); the
  avatar input enforces only the §11.3 constants; no report
  snapshot rewrite from this page (BR-14); "Logout" is the only
  logout affordance (avatar menu's item opens this page).
- Cross-section checks: mirrors §19 (schema/vitual), §28
  (endpoints/sessions/avatar), §29 (validation), §48 (auth
  flow), §46 (components), §60 (states), §45.4 (sizes).
- §57 introduces no constant (§11 unchanged), no path beyond
  §15.5, and no package; it is standalone — it references only
  specification sections.

---

---

## 58. Feature — Print-to-PDF & Client-side Exports

### 58.1 Purpose & scope

§58 owns the client-side export/print surfaces: the CSV export of
the Reports grid selection (§50.7) and the **print-to-PDF of the
report's read-only content** (the official text the server
produces). It exists because supervisors must deliver the day's
report in paper/digital form (export is §3.1.2 F7's surface).

- **Owned here (normative).** The export entry points (§58.2);
  the ReportPrint surface & what prints (§58.3); CSV export rules
  (§58.4); states & edge cases (§58.5); verification (§58.6).
- **Owned elsewhere — deliberately not repeated here.** The
  report content that prints = §21 (`latest`); the §37.5
  content surface feeds every client format; the grid selection
  = §46.8/§50.7; the export menu affordance = §51.5; toasts =
  §60; the `±`-resolution and the official-text decision =
  server-side §35.3/§64; branch-aware item filtering of what
  the §38 item surface exports = the §6.11 filtering contract
  (exports render report text; the format is unchanged).
- **Explicitly out of scope §58.** No server-side export logic
  (Google Docs and the content surface = §37), no file storage
  on the client, no new constant (§11 unchanged), no path beyond
  §15.5, no package (the print API is the browser's).

### 58.2 Export entry points

- **Reports grid:** GridToolbar's Export menu → "Export selected
  as CSV" (§50.7); disabled when no rows are selected.
- **Report details:** the §51.5 Export action → a small menu:
  **"Print / Save as PDF"** (the report body, §58.3),
  **"Download TXT"** and **"Download XLSX"** (client-side
  formats over the §37.5 content surface — the browser formats
  `latest` into the target file; BR-18/SC-5), and "Export
  selected table as CSV" when the current report has a
  table/section view.
- TXT/XLSX honor the same rules as print: they serialize the
  `latest` content the §37.5 surface returned, `±` tokens
  verbatim (the resolution stays §35.3/§64's), and the §43.6
  DD-MM-YY strings (never Excel numbers).
- **Naming (OQ-006, closed here by decision; §69).** TXT and
  XLSX downloads follow the CSV naming rule of §58.4:
  `reports-YYYY-MM-DD.txt` and `reports-YYYY-MM-DD.xlsx`
  (current date). The PDF path uses the browser's own
  Save-as-PDF naming: the print document title is set to the
  report date during print (§58.3), so the saved PDF inherits
  that title — no client PDF library exists to force a name
  (§13.4, ADR-034).

### 58.3 ReportPrint surface & print contract

`components/print/ReportPrint.jsx` renders the **read-only**,
sanitized (§61) `latest` content of the report with print styling:

- **What prints:** the report content exactly as the server
  authored it (the official text — no re-layout, no wrapping by
  client logic); a header block with reportDate, supervisor name,
  and the visit summary (branch snapshot names) in print chrome.
  The print document title is set to the report's DD-MM-YY
  `reportDate` (OQ-006 naming rule, §58.2), so the browser's
  Save-as-PDF filename inherits the report date.
- **How:** `window.print()` over a hidden print container
  (CSS `@media print` styles; the A4 width, margins, the app
  chrome hidden) — the browser's Print/Save as PDF dialog; **no
  client PDF generation library** (§13.4 unchanged; ADR-034).
- The `±` tokens print **verbatim** (the §37.5 surface returns
  them as-is; resolution is server-side §35.3/§64 — this print
  is the delivery copy of `latest`; the official-format export
  decision is §64's, referenced).

### 58.4 CSV export rules

- The grid's export serializes the **visible/selected rows** from
  the current grid state (columns per `components/columns/
  reports.jsx`, English headers), with `\r\n` line endings and the
  standard RFC 4180 quoting for the branch text (the ellipsized
  branch is **not** exported truncated — the full snapshot string
  is). Download is a client-side Blob; filename `reports.csv`
  current date (`reports-YYYY-MM-DD.csv`).
- No dates as Excel numbers — the DD-MM-YY strings stay strings.

### 58.5 States & edge cases

- No content (draft, no `latest`): the Export action is disabled
  (§51.5) — nothing prints.
- Print failure (browser block) → §60 info; the Export menu stays
  open; CSV with zero selected rows → disabled affordance (never
  a silent empty file).
- Custom dates/branches print from the snapshot values (tombstone
  rule §17.4) — the print shows what the record holds, not live.

### 58.6 Verification usage

- Grep gates: the only PDF path is `window.print()` — no pdf/js or
  pdfkit dependency; the export builds its CSV from the selected
  rows map, not from a destination endpoint; no `print` role in
  MUI grids beyond the affordance; ± tokens untouched in the print
  surface (no client resolution).
- Cross-section checks: mirrors §21/§22 (content), §51.5/§50.7
  (entries), §17.4 (tombstones), §61 (sanitized), §60 (toasts),
  §69 (OQ-006 closed here by decision).
- §58 introduces no constant (§11 unchanged), no path, no package;
  it references only specification sections.

---

## 59. Feature — Global Search & 404 Page

### 59.1 Purpose & scope

§59 owns two app-level surfaces: the **global search** in the
AppShell header (finding reports — of every status — and
branches by date/branch name/content, §39) and the **404 page**
for unmatched or invalid routes (§14.2 fallback).

- **Owned here (normative).** The search dialog surface (§59.2);
  the result groups and navigation (§59.3); the 404 page (§59.4);
  states & edge cases (§59.5); verification (§59.6).
- **Owned elsewhere — deliberately not repeated here.** The
  search API/index = §39 (server search), referenced; report
  routes and the machinery = §41.2/§15.5; the AppShell header =
  §47.4; toasts = §60; empty state = §60.
- **Explicitly out of scope §59.** No client-side index (search
  is server-side, §39); no route change on search text; no new
  constant (§11 unchanged), no package.

### 59.2 Search dialog surface

- Trigger: the header search icon (and `Ctrl/Cmd + K` when the
  header is visible) opens `GlobalSearchDialog` (§46.15) — a
  MuiDialog containing a search field with a clear button; search
  fires **on Enter or on click of the action — no debounce**
  (§46.15, §9.6) — calling the §39 search endpoint via §42; the
  result list is grouped by kind: **Reports** (all statuses,
  drafts included) and **Branches** — each group shows the
  entity's key display text (reportDate, branch name) plus its
  status badge where applicable.
- The dialog keeps focus in the field, closes on `Esc` or the
  back-arrow, and its state is wholly ephemeral (§12.2-10; never
  persisted). When the header is hidden by the active layout
  (§47.4), the search is not mounted.

### 59.3 Result groups & navigation

- Clicking a result navigates: reports (any status, including
  drafts) → `/reports/:reportId` (§51); branches → the Branch
  Details page `/branches/:branchId` (§56.5). All navigation
  honors the app-level navigation model (§47).
- When the entity is a tombstone (§17.4), the result still
  renders and navigates — the detail page shows the tombstone
  surface.

### 59.4 404 page

- The route-not-found fallback (§41.3's `*` route), rendered
  **inside whichever layout is active** — the AppShell for
  authenticated users, PublicLayout for unauthenticated ones
  (no AppShell chrome for anonymous users): the page selects the
  layout by `authSlice` status and hands the 404 card to it as
  `children`, which the layout renders in place of its `<Outlet/>`
  (§47.2/§47.3 composition contract — a composed `children` is
  never routed through an Outlet, which would sit beneath the
  `*` leaf with nothing left to render). A centered **Box**
  (bgcolor `background.default` + divider border + radius — **no
  Paper/Card surface**, user-directed standing rule) holding the
  `notFound_404.svg` illustration, **"Page not found"** (title,
  chrome copy §7.6), a subtitle "This page doesn't exist or was
  moved", and two actions in a centered row (`flex gap 1`, wraps):
  **Home** (contained, `HomeOutlined` start icon) → `/` (landing,
  browsable by all, §41.5) and **Back** (outlined, `ArrowBackOutlined`
  start icon) → `navigate(-1)`. No dashboard/login-targeted routing —
  the target depends on the user's history and the Home landing.

### 59.5 States & edge cases

- Search: empty query → no results band ("Type to search");
  loading → skeleton rows; no matches → "No results for
  \"{query}\"" (chrome copy); server error → §60 toast + the
  dialog keeps the last results (only mention). Keyboard: `Esc`
  closes, `Enter` on a highlighted result navigates. Clearing the
  query resets the groups instantly.
- 404 with a seeded route param mismatch (a deleted report deep
  link): the detail-route machinery (§51.6) already handles the
  §31 404 surface **before** the global 404 — the global 404 only
  renders for unmatched paths.

### 59.6 Verification usage

- Grep gates: the search dialog is the only surface of the §39
  search endpoint; the 404 page is the only route fallback
  (§14.2 single `*` entry); no client-side search index; no
  localStorage/IndexedDB for the search state.
- Cross-section checks: mirrors §39 (search), §47 (shell/header),
  §51.6 (detail 404), §14.2 (router), §60 (empty/error copy),
  §12.2-10 (ephemeral state).
- §59 introduces no constant (§11 unchanged), no path beyond §15.5,
  and no package; it references only specification sections.

**End of Part D (client).** Sections 41–59 close the client
specification in dependency order: page shells (§44–§47), the
page inventory (§49–§52), the editing components and conversation
(§53–§55), and the feature surfaces (§58–§59, together
with the profile and branches pages §56–§57), each standing on part C's engines exactly as
§12.4 gates and BR-05–BR-08 (with the closing of OQ-005 at
§49.3) require.

# Part E — Cross-Cutting

## 60. Universal UX — States Protocol, Toasts & Feedback

### 60.1 Purpose & scope

§60 opens Part E (cross-cutting mechanics, §60–§65 per §12.1)
and owns the **universal UX contract** that every Part D page
and Part C error path cites: the four-state protocol (ADR-033),
the toast/feedback primitives and the single trigger API, the
**toast catalogue** (every message string used across the app,
single-sourced), the empty/error copy conventions (chrome
English, §7.6), and the error-boundary rule — extended with the
states protocol every Part D page cites. Part E closes with §65
deployment; delivery follows in Part F (§66 implementation
phases, §67 risks & mitigation, §68 glossary, §69 open questions
& assumptions).

- **Owned here (normative).** The states protocol (§60.2); the
  toast components & trigger API (§60.3); the variant model
  (§60.4); placement, stacking & semantics (§60.5); the toast
  catalogue (§60.6); empty/error/success copy conventions
  (§60.7); error boundary (§60.8); verification (§60.9).
- **Owned elsewhere — deliberately not repeated here.** Backend
  error shape and status codes = §27; validation errors = §29
  (422 shape); the component belt = §46.17; skeletons = §46.14;
  themes = §44.5; motion = §45.6.
- **Explicitly out of scope §60.** No server-side copy, no new
  constant (§11 unchanged), no package (§13.4 unchanged —
  react-toastify only).

### 60.2 States protocol (ADR-033)

Every page/component enumerates the same four states,
implemented identically:

1. **Loading** — §46.14 skeleton/spinner at the §45.7 slot;
   never a blank render.
2. **Empty** — the empty-state copy (§60.7) + the page's
   primary action inline; never an error or a toast. The surface
   is the belt `MuiEmptyState` (§46.17) — pages and the search
   dialog (prompt + no-results variants, §46.15) reuse it; no
   page re-implements the empty layout.
3. **Error** — the §60.3 error toast (server errors, including
   all backend 4xx/5xx per §27.5) + an inline retry affordance
   on the failing region; the retry re-runs the same §42 call.
4. **Success** — the full render, plus exactly one success
   toast (§60.5) on user-initiated mutations.

State transitions never skip: loading → (empty | error |
success); retry re-enters loading. `setError` is never used for
server errors (§9.6 rule) — the toast pipeline is the only error
surface.

### 60.3 Toast components & trigger API

- **`AppToastContainer`** (react-toastify, §13.4) — the **single
  mount** of the toast surface, placed in `App.jsx` (§41.4, item
  4); one container, no second mount anywhere.
- **`showToast(variant, title, message = options)`** is the
  **single trigger API** — every listener (service responses,
  §27 error mapping, page mutations) calls it; **no other toast
  API exists** (ADR-033). The catalogue strings come from
  §60.6. Every call passes react-toastify `icon: false` — the
  variant meta icon (§60.4) is the toast's only icon surface,
  so a default toast icon never renders.
- **`MuiToast` feedback components** (success/error/info/
  warning/loading variants) live in the §46.17 belt, themed
  §44.5/§44.4. **Wrapping rule:** both the title and the message
  lines break long strings (`overflowWrap: anywhere`) — a long
  server message passed as the title (e.g. `showToast("error",
  result.error.message)`) never overflows on one line.

### 60.4 Variant model

| Variant | Copy/tones | Icon/sx |
|---|---|---|
| success | green check — message from the §60.6 catalogue | `CheckCircleOutlined`, `success.main` |
| error | red — message from §60.6 | `ErrorOutlined`, `error.main` |
| info | neutral — message from §60.6 | `InfoOutlined`, `info.main` |
| warning | amber — message from §60.6 | `WarningAmberOutlined`, `warning.main` |
| loading | spinner icon + message; auto-dismisses on completion; never duplicated on retry | spinner |

### 60.5 Placement, stacking & semantics

- Anchor: bottom-right (desktop); full-width top (xs < 600px),
  respecting the AppShell heights; max stack 4 (older auto-
  dismiss); auto-dismiss 5 s (success) / 8 s (error, warning);
  manual close icon; `role=status` per density; reduced-motion
  honored (§45.6). Window blur never auto-dismisses.
- **Success-message rule:** exactly one success toast per
  user-initiated mutation (create, save, accept, archive,
  restore, delete, export, login, logout, correction save);
  never a toast for read-only auto-refresh.
- **Error/retry rule:** retries re-show the error toast once
  (no duplicate spam); confirm dialogs show no toast of their
  own (the orchestrated dialog's result toasts once).

### 60.6 Toast catalogue (normative — single source)

Every message string below is a single-sourced constant (one
occurrence in the code); chrome copy in English per §7.6. Samples (the complete set is the catalogue
file's content, verified by greps):

| Key | Copy |
|---|---|
| `toast.report.created` | "Report created" |
| `toast.report.completed` | "Report completed" |
| `toast.report.archived` | "Report archived" / "Report restored" |
| `toast.report.deleted` | "Report deleted" |
| `toast.branch.created` | "Branch created" / "Branch updated" |
| `toast.branch.archived` | "Branch archived — reports keep their data" / "Branch restored" |
| `toast.branch.deleted` | "Branch deleted — it will be removed after the retention period" |
| `toast.clip.deleted` | "Clip deleted" (+ the rewind sentence when the last clip, §51.4) |
| `toast.transcription.ready` | "Transcription ready" |
| `toast.generation.ready` | "Report generated — please review" |
| `toast.correction.accepted` | "Correction accepted" / "Correction reverted" |
| `toast.export.ready` | "Export ready" |
| `toast.auth.loggedOut` | "You have been logged out" |
| `toast.auth.loggedIn` | "Welcome back" |
| `toast.auth.accountCreated` | "Account created — please log in" |
| `toast.session.ended` | "Session ended" |
| `toast.error.generic` | "Something went wrong — please try again" |
| `toast.error.offline` | "You appear to be offline" |
| `toast.search.noResults` | "No results for \"{query}\"" |

Server messages (422 details, §27.5/§29) render in the toast
body after "Please check the highlighted fields" — the field
errors appear inline (§46.4).

### 60.7 Empty/error/success copy conventions

- Empty states carry chrome English copy + the page's primary
  action (samples used across §49–§57: "No reports yet —
  record your first day", "No branches yet — add your first
  branch", "No results found", "No other active sessions").
- "This section has issues, review them below" is the fixed
  form-summary line (§52.10/§46.4).
- Error copy never leaks backend internals (§27.5 — the
  message is user-facing); a 404 route renders the §59 page,
  a 403 lifecycle blocker toasts the §60.6 or context copy.

### 60.8 Error boundary

A single React error boundary (`react-error-boundary`, §13.4) at
the `App.jsx` level (§41.4): on an uncaught render error it
renders the §46.14 fallback screen ("Something went wrong" +
"Reload" button) and logs the error reference; it never unmounts
the AppShell chrome (§47.3 rule). Error-boundary fallbacks are
not toasts (toasts are for recoverable flows).

### 60.9 Verification usage

- Grep gates: only `showToast` calls the toast API; every
  catalogue string appears exactly once (single-sourced); no
  toast on auto-refresh; react-toastify appears only at the
  §41.4 mount and `showToast`; one error boundary; no `setError`
  for server errors (§9.6).
- Cross-section checks: mirrors §13.4 (react-toastify,
  react-error-boundary), §41.4 (mount), §27 (server errors), §29
  (422), §46.17 (components), §46.14 (skeletons), §45.6 (motion),
  §49–§57 (usage), §61 (sanitization of toast bodies — never
  rendered as HTML).
- §60 introduces no constant (§11 unchanged), no path, and no
  package; it references only specification sections.

---

## 61. Security & Reliability Requirements

### 61.1 Purpose & scope

§61 is the security and reliability home of the whole system: the
threat-model-driven control map that satisfies SC-7 (§2.4), the
rich-text HTML sanitization policy (the ADR-038 double gate), the
data-handling rules that define what never leaves the server, and
the reliability requirements every consumer section points to. It
exists because the product persists and renders server-authored
HTML in several surfaces (§46.16 MuiEditor read-only, §51 details,
§52 Step 5, §54 correction strips, §55 chat, §58 print).

- **Owned here (normative).** The threat model & controls map
  (§61.2); the rich-text HTML sanitization policy (§61.3); the
  sanitizer configuration & validation integration (§61.4); data
  handling & secret hygiene (§61.5); reliability requirements
  (§61.6); edge cases (§61.7); verification (§61.8).
- **Owned elsewhere — deliberately not repeated here.** The fixed
  middleware chain and rate-limit tiers = §27 (ADR-029/ADR-035);
  authentication, dual-token session and cookie attributes = §28
  (ADR-004); field validation = §29; upload allowlists and multer
  limits = §32; provider credential handling and the backend-only
  proxy = §16.3; safe logging and the deny list = §9.5 (ADR-019);
  error shape and user-facing messages = §27.5; the sanitizer
  runtime (`dompurify`, planned §13.5) and its editor consumer =
  §46.16/§53; retention/confinement = §62; deployment hardening =
  §65.
- **Explicitly out of scope §61.** No new middleware, no new
  environment variable (§10 unchanged), no new constant (§11
  unchanged), and no package (only the already-approved planned
  dependency of §13.5). Backups and disaster recovery stay out of
  scope per §12.9; their residual risk is registered in §67.

### 61.2 Threat model & controls map

| Threat | Control | Owner |
|---|---|---|
| Stored XSS — server-authored HTML rendered in client surfaces | §61.3 double-gate sanitization (sanitize-on-write + sanitize-on-render); `dangerouslySetInnerHTML` only on already-sanitized input; toasts are never HTML | §46.16, §53, §54, §55, §58 |
| Session hijacking / CSRF | httpOnly + `SameSite` cookies; dual-token JWT with rotation (access 15 min, refresh 7 days); no bearer material in localStorage, Redux, or client logs | §28, §27 (CORS `CLIENT_ORIGIN`, `credentials`) |
| Operator/query injection | `express-mongo-sanitize` in the fixed chain (ADR-035), applied to every user input before query building; §29 validators as the field-level enforcement gate | §27.2, §29 |
| Secret exposure | Keys only in `backend/.env` (§10.2); frozen env object (§10.3); backend-only proxy (§16.3); deny-list logging (§9.5); keys never in Vite env, client code, localStorage, Redux, or client logs (SC-7) | §10, §16, §9.5, §26 |
| Upload-borne attack | Allowlist MIME types and size caps (`AUDIO_ALLOWED_MIME_TYPES`, `AUDIO_MAX_SIZE_BYTES`, `AVATAR_*`, §11.3) enforced by multer before processing; binaries stored as files with metadata-only docs (§22.5); no `filePath` ever reaches the client | §32, §28, §29 |
| Credential brute force | bcrypt with `BCRYPT_SALT_ROUNDS` (12); the three rate-limit tiers (ADR-029); single-attempt reauth | §28, §27.3 |
| Provider compromise / forged output | Backend-only proxy (the browser never holds provider credentials); every provider response validated against the §34/§35 schema before storage; "best effort" text never stored | §16, §34, §35 |
| Information leak via errors | User-facing messages only (§27.5); internals, stack traces and provider names stay server-side (§42.4) | §27, §42 |
| Infrastructure shadowing | Production static serving never shadows `/api/v1` or the health endpoint | §65.3 |

### 61.3 Rich-text HTML sanitization policy (normative)

Every HTML string that enters or leaves the system passes **both
gates**; no surface may rely on only one:

1. **Sanitize-on-write (server).** HTML the server persists — the
   Mode-1 content save (`PATCH /reports/:reportId/content`,
   §31.6) and any accepted content write — is sanitized with the
   §61.4 configuration **before** the write, in the same request
   path as the §29 validation. The server is the last writer of
   stored content.
2. **Sanitize-on-render (client).** Every render of stored HTML
   re-sanitizes with the same §61.4 configuration before it
   touches the DOM: `MuiEditor` read-only (§46.16), the details
   body (§51), the generation review surface (§52 Step 5), the
   correction strips (§54), chat messages (§55.3), and the print
   surface (§58.3). Double sanitization of the same string is not
   an error — it is the policy.

- **`dangerouslySetInnerHTML`** is used only on already-sanitized
  input (ADR-038, §14.4): the sanitize call happens on the value
  before the prop is passed; no raw-HTML passthrough exists.
- **Toast bodies are never HTML** (§60) — the catalogue strings of
  §60.6 are plain text rendered as text.
- **The §37.5 content surface returns raw text, not HTML** (§37.5),
  sanitized server-side; the client formats of §58 serialize that
  text verbatim.
- **Degradation under both OQ-007 branches** (§21.2, §69): if the
  `raw`/`latest` slots stay plain text at the editor phase, the
  gates remain as defense in depth (a format no-op); if the slots
  become rich-text HTML, the gates are the enforcement. Neither
  branch changes this policy; the decision lands at the §66 editor
  phase.
- **No runtime is assumed before installation:** sections never
  rely on the sanitizer's runtime behavior until `dompurify` is
  installed by the §66 editor phase (§13.5); until then, the only
  rendered content is server-authored text and the no-raw-HTML
  rule above still holds.

### 61.4 Sanitizer configuration & validation integration

- **Single configuration point.** The allowlist (elements,
  attributes, CSS properties) matches exactly the ADR-038 editor
  scope — bold, italic, font size, text color — with no
  `script`, `style`, event-handler attributes, `iframe`, or
  embedded media. Server write gate and client render gate consume
  the same configuration; the configuration lives with its
  implementer (§46.16/§53) and §61 pins only the normative rule
  that both gates share it.
- **Content is preserved.** Amharic/Ethiopic text, the `±`
  prefix tokens of §64, and plain-text structure pass through the
  sanitizer unchanged — it strips markup, never content
  characters. `±` is content vocabulary (§64.5), not markup.
- **Validation layering.** §29 validators enforce shape and
  length; the sanitizer enforces markup; both run in the §31.6
  content write path — validators never trust sanitizer output and
  the sanitizer never trusts validator input.

### 61.5 Data handling & secret hygiene (what never leaves the server)

- Provider API keys never reach client code, Vite env variables,
  localStorage, Redux state, or client logs (SC-7, §10.2).
- Audio binaries: the client receives only the metadata DTO of
  §22.7 and plays through the §32 authenticated endpoint;
  `filePath` is server-side-only and never serialized.
- Transcription and report text never appear in logger calls
  (§9.5, §26.7); client logs never print cookies or tokens
  (§42.4).
- The Google OAuth token (when OQ-004 closes) lives server-side,
  user-scoped, and never in the browser (§37.4).
- The refresh token is httpOnly — no JavaScript-visible refresh
  material exists (ADR-004).
- No `lng`/`lat` coordinate data exists anywhere (§21.2).

### 61.6 Reliability requirements

- **Provider calls** obey §16.5: `AI_TIMEOUT_MS`-bounded, retried
  on the 1 s → 2 s → 4 s schedule (`AI_PROVIDER_RETRIES`,
  `AI_PROVIDER_BACKOFF_BASE_MS`), then fallback (ADR-014). A
  failed provider never stores "best effort" text (§16.5 accuracy
  gate). Provider-exhaustion surfaces as 502 with the §60 copy.
- **Upload failures** are confined before processing: multer
  limits enforce the §11.3 caps (§32); aborted uploads leave only
  temp files that the §62 orphan sweep reclaims.
- **Client resilience:** the §60.8 error boundary and the offline
  toast (§60) are the client faces of reliability; retries
  re-run the same §42 call.
- **Background work is logging-only:** the sweeper (§62) never
  throws into request paths; its lifecycle is bound to the server
  (§26.6, ADR-013).
- **Sessions make writes atomic:** every multi-document write runs
  in the §27.7 session template (ADR-018); a failure aborts the
  whole write — the store never holds half-applied state.

### 61.7 Edge cases

- Malicious HTML already present in storage → the render gate
  strips it before DOM insertion; the surface shows the text
  content, never a blank page and never an error page.
- Sanitizer-stripped-to-empty markup → treated as empty content
  by the §21/§31.6 content rules (never "invisible executing"
  content).
- `±`-only or Amharic-only segments → pass through unchanged
  (§61.4).
- Oversized markup (huge font-size values) → bounded by the §29
  content-length validation and the four-action toolbar scope of
  ADR-038; no URL, no image dimensions, no `style` attributes
  beyond the allowlist.
- Content authored before the editor phase (plain text in
  `raw`/`latest`) → renders through the same surfaces as text;
  sanitize-on-render is a no-op for plain text.

### 61.8 Verification usage

- Grep gates: `dangerouslySetInnerHTML` appears only in the §46.16
  sanitized surfaces (MuiEditor and its read-only renderer);
  exactly one sanitizer configuration consumed by both gates; no
  HTML construction of toast bodies; no `filePath` in any client
  DTO; no provider key token in `client/`; no `GOOGLE_*` env
  reads (§10.4 closed); deny-list terms absent from logger call
  sites (§9.5).
- Cross-section checks: mirrors §13.5 (`dompurify` planned),
  §14.4 (ADR-038 standing), §27 (chain, tiers, error shape),
  §28 (session), §29 (validators), §32 (uploads), §34/§35
  (provider paths), §46.16/§53 (editor), §55.3 (chat render),
  §58 (print), §62 (retention), §69 (OQ-007 branch).
- §61 introduces no constant (§11 unchanged), no path beyond
  §15.4/§15.5, and no package (dompurify is the approved planned
  dependency of §13.5); it references only specification
  sections.

---

## 62. Sweeper, TTL & Data Retention

### 62.1 Purpose & scope

§62 is the authority for *when and how* data is permanently
removed (BR-15/BR-16 mechanics): the two-pass in-process sweeper
(ADR-015), the `ARCHIVED_TTL_SECONDS` retention window, the TTL
safety net, and the orphan sweep. It exists because the two-path
lifecycle (§17.4) defers physical removal to this section; every
DELETE endpoint in §30/§31 only archives (step 1), and removal
happens here (step 2).

- **Owned here (normative).** The retention window & TTL safety
  net (§62.2); pass 1 — expired-archive hard delete (§62.3);
  pass 2 — the orphan sweep (§62.4); ordering, idempotency &
  race rules (§62.5); seeded fixtures & retention (§62.6);
  boundaries (§62.7); the edge-case table (§62.8); verification
  (§62.9).
- **Owned elsewhere — deliberately not repeated here.** The
  two-path lifecycle decisions and tombstone rule = §17.4; the
  per-model `archivedAt` anchors and TTL declarations = §18.3,
  §20.4, §21.3, §22.4, §23.4, §24.4; archive/restore/delete
  endpoints = §30.5, §31.7; the sweeper timer lifecycle (start,
  interval, clear on shutdown) = §26.6; seeded data rules = §25,
  §40; read-path tombstone handling = §21.7, §17.4.
- **Explicitly out of scope §62.** Log rotation (owner §9.5/§26,
  `LOG_RETENTION_DAYS`); backups (§12.9 — residual risk §67);
  exported artifacts (client exports are ephemeral, §58; Google
  Docs files live in the user's Drive, §37, and are never
  touched by the sweeper); user-account removal (none in scope,
  §19/§28); no new constant (§11.3 already ships
  `ARCHIVED_TTL_SECONDS` and `SWEEPER_INTERVAL_MS`).

### 62.2 Retention window & TTL safety net

- **Window.** Physical removal begins when `archivedAt` is older
  than `ARCHIVED_TTL_SECONDS` (2592000 — 30 days, §11.3). The
  same window applies to both lifecycle-bearing models — Report
  (§21.3) and Branch (§20.4). Audio, Transcription and
  Conversation documents have **no windows of their own**: they
  live and die with their parent report (§17.4).
- **Safety net.** Exactly two TTL indexes exist — Report and
  Branch, each on `archivedAt` with `expireAfterSeconds`
  `ARCHIVED_TTL_SECONDS` (§18.3). The index fires only when the
  sweeper missed a deadline; it runs server-side without cascade
  or session, so its dependents are left for the orphan sweep
  (§18.3, §62.4). No other TTL index exists on any model.
- **The sweeper wins races:** it deletes the parent inside a
  transaction first, so the TTL index never fires for that
  document (§12.2).

### 62.3 Pass 1 — expired-archive hard delete

The sweeper's primary pass (`jobs/`, §15.4; interval
`SWEEPER_INTERVAL_MS`, started after the server is listening,
§26.6) removes every expired-archived parent:

- **Report removal.** For each expired `isArchived` report: one
  session-transaction (§27.7) deletes the report row and
  cascades its Audio documents, Transcription rows, and the
  ChatConversation row; audio binaries are unlinked **after**
  commit (`fs.unlink`; §31.7 order). Unlink failures are logged
  and retried by pass 2.
- **Branch removal.** For each expired archived branch: one
  session-transaction deletes the branch row. Report history is
  never touched — the embedded snapshot survives (BR-14) and
  `branches[].branch` refs become tombstones (null joins,
  §17.4/§21.7); the orphan sweep never deletes a report because
  its branch is gone.
- **Consumption rules.** Removal is per-parent in its own
  session; the run never removes a row whose window has not
  elapsed, and never removes active (non-archived) rows.
- **Restore-after-deadline.** A row whose window has elapsed but
  which the sweeper has not yet reached: restore returns 409
  with the window message (§30.5/§31.7 semantics); the row is
  removed on the next run. The user can no longer rescue it —
  this is the retention contract (BR-15).

### 62.4 Pass 2 — the orphan sweep

- **Failed-unlink retry.** Audio documents whose binary unlink
  failed in pass 1 (or in the §32 controller cleanup) and whose
  parent is gone: retry the unlink, then delete the document.
- **Sweeper-race orphans.** Dependents (Audio docs, Transcription
  rows, Conversation rows) whose parent no longer exists — the
  TTL index fired before the sweeper, or a manual removal path
  left them: remove them without touching anything whose parent
  still exists.
- **Multer temp leaks.** Files left in the §32 temp area by
  failed/aborted uploads that never became Audio documents:
  unlink (bounded by the §32 temp convention).
- **Guard rails.** The orphan sweep never deletes a report (or
  any live parent) — it only cleans dependents and files; every
  action is logged (§9.5) and nothing throws into request paths
  (§61.6).

### 62.5 Ordering, idempotency & race rules

- **Order within a run:** pass 1 (parents) before pass 2
  (dependents), each parent committed before the next; pass 2
  then sees true orphans.
- **Double-delete:** the second request targeting an already-
  swept row → 404 with BR-13 semantics; the UI toasts the §60
  copy and refreshes.
- **Restore/delete racing the sweeper:** restore before the
  deadline always wins; after the deadline the 409 of §62.3
  applies; delete-after-sweep → 404 (same handling).
- **Idempotency:** a run over a clean store is a no-op — log
  lines only, no error path.
- **Crash mid-run:** removals are per-document session-based; a
  crash leaves completed removals committed, and the interrupted
  parent is retried on the next run (its window is still
  elapsed).
- **Conflict with concurrent writes:** a report being edited
  while its window elapses is still removed — retention is
  deadline-based, not activity-based; the UI's open views
  resolve through the existing 404 behavior (§51/§50).

### 62.6 Seeded fixtures & retention

Seeded archived rows (§25/§40 fixtures — e.g. the archived
branch and any archived report fixtures) enter the same window
as production rows and are swept normally once expired; there is
no fixture exemption from retention. The §40 wipe contract
remains the deterministic reset for the development loop (wipe
removes the caller's mock rows immediately, §40.2); this
explicitly closes the §40.7 cross-check on sweeper leftovers.

### 62.7 Boundaries

- No log-file deletion — log rotation is §9.5/§26's
  (`LOG_RETENTION_DAYS`).
- No backups — §12.9; the two-path lifecycle plus tombstones is
  the only deletion safety mechanism; the no-backups residual
  risk is registered in §67.
- No exported artifacts — client exports produce no server
  files (§58); Google Docs documents live in the user's Drive
  (§37).
- No notifications — the sweeper is silent by design; the UI
  learns about removal through normal 404 handling (§60.7).
- No user-account removal — no account deletion exists (§19,
  §28).

### 62.8 Edge-case table

| Case | Behavior |
|---|---|
| Restore after deadline, before the sweep | 409 with the window message; removal on the next run (§62.3) |
| TTL fires before the sweeper | Pass 2 removes the dependents on the next run (§62.4) |
| Branch swept, reports still reference it | Tombstone joins; reads use the snapshot name; never an error (§17.4) |
| Binary missing at removal | The doc is still removed with its parent; the missing file is logged, not retried |
| Unlink permission failure | Logged; retried on the next run (§62.4); bounded by §9.5 |
| Run overlapping an upload | Temp files are reclaimed by the multer-temp rule (§62.4); the upload controller owns its final move (§32) |
| Window elapsed during an edit | Retention is deadline-based; removal proceeds (concurrency rule, §62.5) |

### 62.9 Verification usage

- Grep gates: exactly two TTL declarations in the codebase
  (Report, Branch — `expireAfterSeconds` = `ARCHIVED_TTL_SECONDS`);
  no `deletedAt` anywhere; the sweeper uses only
  `SWEEPER_INTERVAL_MS` and `ARCHIVED_TTL_SECONDS` (no magic
  durations); no hard delete outside the sweeper (`DELETE`
  endpoints archive only, §30.5/§31.7); pass-2 matching follows
  the §32 temp conventions.
- Cross-section checks: mirrors §11.3, §12.2, §17.4, §18.3,
  §20.4, §21.3, §22.4, §23.4, §24.4, §26.6, §30.5, §31.7,
  §40.7 (now closed), §60 (404 copy).
- §62 introduces no constant (§11 unchanged), no path beyond
  §15.4 (`jobs/`), and no package; it references only
  specification sections.

---

## 63. Testing & Verification Strategy

### 63.1 Purpose & scope

§63 is the enforcement map for §2.6 Definition of Done and the
success gates of §2.4 (SC-6/SC-7): it replaces automated test
suites — a locked exclusion (§4.3, §2.5) — with a manual,
gate-based verification strategy, and gives every phase of §66
its run points. Verified behavior is the product of the gates
below, not of a test harness.

- **Owned here (normative).** The gate taxonomy (§63.2); build &
  syntax gates (§63.3); the global grep-gate inventory (§63.4);
  cross-section owner-mirror checks (§63.5); the manual
  acceptance matrix (§63.6); SC-8 metric discipline (§63.7);
  verification (§63.8).
- **Owned elsewhere — deliberately not repeated here.** The
  build/lint commands and hygiene checklist = §9.7; the DoD
  items = §2.6; SC-6/SC-7 gates = §2.4; per-section grep gates
  live in each section's Verification usage (referenced at
  §63.4); phase run points = §66.
- **Explicitly out of scope §63.** No automated test framework
  and no CI infrastructure (deployment ops = §65); no invented
  quantitative targets (SC-8, §63.7); no new constant (§11
  unchanged), no path beyond §15, no package.

### 63.2 Gate taxonomy

| Gate | What it proves | When |
|---|---|---|
| Build & syntax gates (§63.3) | The code compiles and passes lint | Every change (§9.7) and phase-gate (§66) |
| Global grep-gate inventory (§63.4) | The spec-conventions are structurally enforced | Phase gates P5/P7/P8 (§66) |
| Cross-section owner-mirror checks (§63.5) | A change's sections and their mirrors stay in sync | Same-change review (§9.7, §15.7) |
| Standalone claims | A section introduces only what its Verification usage claims | Every authored section |
| Manual acceptance matrix (§63.6) | SC-1…SC-5 behaviors with real artifacts | Named §66 phase gates |

### 63.3 Build & syntax gates

- `node --check` on every backend file (§9.7).
- `npx vite build` on the client with 0 errors; delete `dist/*`
  after the check always (§9.7).
- `npx eslint src/` passes (§9.7).
- Lockfiles stay in sync with the manifests after any install
  (§13.7 rule 2); manifest changes land with their owning phase
  (§13.5/§66).

### 63.4 Global grep-gate inventory (normative)

The consolidated gate set every phase gate re-runs; the owning
section is the rule's authority:

| Gate | Rule | Owner |
|---|---|---|
| Logger | No `console.log` in the backend — Winston only | §9.5, ADR-019 |
| Status codes | No numeric HTTP codes — semantic `httpStatus.js` names only | §11.6, §9.7 |
| Magic values | No literals outside §10/§11 frozen objects | §11.2, §10.3 |
| Key doctrine | No `.id` property access; primary keys are `_id` | §9.3, §9.7 |
| Paths to the client | No `filePath` in any client DTO | §22.7, §32 |
| Non-existent fields | No `saveMode`, `half-day`, `lng`, `lat` anywhere | §9.3, §21.2, §52 |
| Transition authority | Exactly one status transition-guard table | §31.4 |
| Editor surface | The only editor implementation is `MuiEditor` (§46.16) | §53, §14.4 |
| ± discipline | No client-side `±`-resolution; tokens verbatim | §53.3, §58, §64 |
| Toast API | Only `showToast` triggers the toast surface | §60.3 |
| Network layer | `fetch`/`axios` appear only in `features/apiSlice.js` | §42.7 |
| Mock gating | No mock registration outside the §40.5 guard | §40.5 |
| Sweeper timing | Only `SWEEPER_INTERVAL_MS`/`ARCHIVED_TTL_SECONDS` | §62 |
| TTL count | Exactly two TTL indexes (Report, Branch) | §18.3, §62 |
| Secret hygiene | No provider keys in `client/`; deny-list terms absent from log sites | §9.5, §61.8 |

### 63.5 Cross-section owner-mirror checks

Every section's Verification usage mirrors the sections it
consumes (§11 constants, §13 packages, §15 paths, §10 env). A
change is reviewed against the mirrors of the sections it
touches: an endpoint change re-checks its §30–§39 owner and every
§49–§59 consumer; a schema change re-checks §19–§24 and the
§30/§31 contracts; a constants change re-checks §11's `Used by`
column (§11.1). Same-change discipline binds these pairs (§15.7,
§13.7, §14.5) — a mirror update lands in the same commit as its
source.

### 63.6 Manual acceptance matrix (SC-1 … SC-5)

| Success criterion | Manual check | Run point (per §66) |
|---|---|---|
| SC-1 — transcription accuracy | Real Amharic audio walk through the §52 wizard: chunk-attach → transcribe → review; re-transcription available and working (§33) | P7 backend validation; DoD item 4 (§2.6) |
| SC-2 — format & tone match | Generated output compared against the §6.8 samples (structure + tone, Type-1 and Type-2) | P7, then P8 regression |
| SC-3 — surgical corrections | Mode-1/2/3 correction on one section; the §35 diff verification leaves unrelated sections byte-identical | P7 (service), P8 (UI) |
| SC-4 — full loop, both types | End-to-end record → transcribe → review → generate → correct → accept → export for a Type-1 day and a Type-2 day (§6.4) | P7 |
| SC-5 — five-format export | PDF (print), TXT, CSV, XLSX reproduce the report content; Google Docs shows the ENABLED-flag stub behavior (§37.3) or the live document | P8 |
| SC-6/SC-7 — engineering & security gates | The §63.3/§63.4 gates pass; key locations verified | Every phase gate, full sweep at P5/P8 |

### 63.7 SC-8 metric discipline

This specification asserts no numeric performance or accuracy
targets that the requirements did not supply; the only invoked
bounds are the requirement-derived constants of §10/§11 (timings,
sizes, tiers) and the retention window of §62. Any future
quantitative success metric (accuracy percentage, latency target,
throughput figure) is **registered in §69 first** and adopted only
after registration (SC-8, §2.4; §69.2 mechanics).

### 63.8 Verification usage

- This section *is* the gate taxonomy: the §66 phase gates run
  §63.3/§63.4/§63.6 at their named points; the §9.7 hygiene
  checklist re-applies per change.
- Grep gates: no test-framework package in either manifest
  (§13.3/§13.4 remain test-free); the §63.4 table is the only
  consolidated inventory (per-section gates stay with their
  sections).
- §63 introduces no constant (§11 unchanged), no path, and no
  package; it references only specification sections.

### 63.9 Specification-integrity audit (the standalone gate)

This document is the **single source of truth**: it must remain
fully readable and implementable with no supporting planning
material beside it. A read-only audit verifies that, and the exit
freeze after any pruning of working notes re-runs it. Six checks:

1. **C1 — Internal links closed.** Every `§N` citation has a
   matching heading; `§N.M` sub-citations resolve to authored
   subsections. Zero unresolved, zero pending.
2. **C2 — No work-note leaks.** The body contains no name or path
   of any planning note, no repository-relative path, and no
   document-format suffix; only the sanctioned source-of-truth
   lines (the manifest transcripts of §13, the `httpStatus.js`
   naming rule) may carry such tokens.
3. **C3 — TOC injected.** The TOC placeholder marker is gone and a
   real link list exists.
4. **C4 — No reserved anchors.** No "reserved anchor" bullet
   remains: every anchor promised by an earlier pass is now an
   authored subsection (§6.10, §6.11).
5. **C5 — No external dependence.** No paragraph or decision
   references material that lives outside this document; pruned
   working notes leave no dangling pointer.
6. **C6 — Sign-off.** All of the above hold with zero pending at a
   single run ⇒ the single-source-of-truth milestone; subsequent
   changes to this document keep the audit green (run at every
   §66 phase gate).

The audit is exercised through the tooling kept with the planning
notes (read-only; it never modifies this document) and through the
grep sweeps of §63.4.

---

## 64. Performance & Scale (+ official-± resolution)

### 64.1 Purpose & scope

§64 carries the two cross-cutting mandates §12.1 assigns it: the
**performance & scale posture** (how the system stays bounded
without invented benchmarks) and the **`±`-token vocabulary of
the official format** with the **official-format resolution
decision boundary** (who resolves `±`, where, and when).

- **Owned here (normative).** Performance posture (§64.2); the
  bounded resource rules (§64.3); concurrency posture (§64.4);
  the `±`-token vocabulary (§64.5); the resolution decision
  boundary (§64.6); edge cases (§64.7); verification (§64.8).
- **Owned elsewhere — deliberately not repeated here.** The
  skeleton labels the vocabulary anchors to = §6.3; the
  correction engine's `±` behavior = §35.3; the export-time
  resolution implementation = §37.3; the §37.5 content surface
  and the client formats = §37.5/§58; the editor display rule =
  §53.3; the constants home = §11.
- **Explicitly out of scope §64.** No streaming or realtime
  transport (locked §12.2-3; D2 re-admission = new §66 phase);
  no quantitative performance targets (SC-8 — bounds only);
  no new constant beyond the single §11.3 token prefix added by
  this pass; no path, no package.

### 64.2 Performance posture

The system is **synchronous request/response end-to-end**: clip
capture → upload → server-side processing → response. There is
no streaming transcription, no server-pushed state, no
WebSocket/SSE today (D2, §12.2-3). Performance is governed by
**bounds, not benchmarks**: every resource-consuming operation is
capped by a §11/§10 constant or a rate tier, and SC-8 forbids
inventing numeric targets. Scale is handled by the same bounds —
a single supervisor's data volume is bounded by the constants
below by construction.

### 64.3 Bounded resource rules

| Bound | Value (home) | Effect |
|---|---|---|
| Clip duration cap | `AUDIO_MAX_DURATION_SEC` = 900 (§11.3) | No unbounded recordings |
| Clip size cap | `AUDIO_MAX_SIZE_BYTES` = 52428800 (§11.3) | Upload memory/storage bounded at multer |
| STT chunk cap | `ADDIS_AI_STT_MAX_DURATION_SEC` = 60 (§11.3) | Chunked transcription keeps provider calls bounded (§33) |
| AI call timeout | `AI_TIMEOUT_MS` (default 30000, §10.4) | Requests never hang unbounded |
| AI retries | `AI_PROVIDER_RETRIES` = 3 at 1→2→4 s (§11.3) | Bounded retry window per §16.5 |
| Rate tiers | global 15 min/100 · auth 15 min/20 · AI 1 min/10 (§11.3, §27) | The app-level guard before provider quotas |
| Pagination | default 10, max 100, server-side (ADR-034, §11.3) | Lists never grow unbounded on the client |
| Route loading | lazy per route (ADR-025, §41) | No monolithic initial bundle |
| Retention | `ARCHIVED_TTL_SECONDS` = 2592000 (§62) | Storage stays bounded over time |

### 64.4 Concurrency posture

- Every write runs in the §27.7 session template (ADR-018) —
  no torn multi-document writes under concurrent requests.
- Reauth is single-attempt and concurrent-safe: one refresh in
  flight, queued requests resume on it (§42.3).
- No queues or worker pools; the only background work is the
  single in-process sweeper timer (§62, §12.5).
- The AI tier (1 min/10) is the primary guard against provider
  429 storms; provider-issued limits are honored secondarily
  with `Retry-After` (§16.5).
- The client never aggregates full datasets — every list and
  chart is server-driven (ADR-034, §38, §50).

### 64.5 `±`-token vocabulary (normative)

The `±` prefix (§35.3) marks **official/entitled text the user
must not freely alias**: the fixed structural labels of the
official report format. The vocabulary is:

| Token (prefixed `±`) | Official text it maps to | Home |
|---|---|---|
| `±ቀን` | Date line of the format | §6.3 field 1 |
| `±ብራንች` | Branch line (Type-1/Type-2 join) | §6.3 field 2 |
| `±ስም` | Supervisor name line | §6.3 field 3 |
| `±ስራ የገባሁበት ሰዓት` | Work-start / per-branch time-range lines | §6.3 field 4 |
| `±የተሰሩ ስራዎች` | Completed-activities heading | §6.3 field 5 |
| `±መፍትሄ የሚፈሉ ጉዳዮች` | Issues-heading | §6.3 field 6 |
| `±አጠቃላይ አስተያየት` | General-opinion heading | §6.3 field 7 |
| `±ከስራ የወጣሁበት ሰዓት` | Work-exit line | §6.3 field 8 |

- The token prefix is a constant: `OFFICIAL_TOKEN_PREFIX` =
  `'±'` (§11.3, added in the same change as this section).
- **Vocabulary growth rule.** The set above is exhaustive. A new
  token is added only by amending §6.3 (the label owner) and
  this table in the same change, under the §14.5 discipline;
  nothing else may mint tokens.

### 64.6 Official-format resolution decision boundary

- **The server resolves — the client never does.** `±` tokens
  are resolved **by the backend, at export time, in the exported
  artifact only, and only in the Google Docs path** (§37.3):
  the service replaces each token with the official text of
  §64.5 in the document it creates. Resolution is **format-only**
  — stored content is never rewritten (BR-17: language
  unchanged); no resolution is ever persisted (no `exportedAt`
  or resolved-content field exists, §21.2).
- **Everything else keeps tokens verbatim.** The §37.5 content
  surface returns them as-is; the client formats of §58
  (print/TXT/XLSX/CSV) serialize them as-is; the editor and
  read-only surfaces render them as-is with the "leave this
  token untouched" guidance (§53.3); the correction engine never
  resolves, strips, or translates them and never deletes a `±`
  block silently (§35.3).
- **The decision boundary is single-sourced in this section.**
  Sections reference §64 for "the official-format decision" and
  implement the parts owned above — they never restate it.

### 64.7 Edge cases

- A `±` token whose field content is blank resolves to the empty
  value (the label with a blank line) — never to fabricated
  text (BR-19).
- A token outside the §64.5 vocabulary (e.g. legacy content):
  passes through verbatim everywhere — resolution never guesses
  an expansion.
- Tokens adjacent to punctuation or line breaks: the vocabulary
  maps the label text; surrounding formatting is preserved by
  the exporting surface (§37.3/§58).
- A corrected report whose instruction addressed a `±` block:
  handled by §35.3's explicit-naming rule — the boundary above
  is unaffected.

### 64.8 Verification usage

- Grep gates: no `±` construction or resolution call anywhere in
  `client/`; the server-side resolution exists only in the
  §37.3 export path; the vocabulary table of §64.5 and the §6.3
  label table are updated together (same-change); no stored
  content transformation outside §37.3.
- Cross-section checks: mirrors §6.3 (labels), §11.3
  (`OFFICIAL_TOKEN_PREFIX`), §35.3 (correction protocol), §37.3
  (resolution implementation), §37.5/§58 (verbatim surfaces),
  §53.3 (display rule), BR-17/BR-19 (§5), SC-8 (no invented
  targets).
- §64 introduces exactly one constant (`OFFICIAL_TOKEN_PREFIX`
  in §11.3, same change), no path, and no package; it references
  only specification sections.

---

## 65. Deployment

### 65.1 Purpose & scope

§65 is the production deployment contract: the single-process
topology, static serving with the SPA fallback, the production
environment, runtime operations, the Node LTS binding, the
release cadence, and the scope lines whose unknowns land in §67
and §69. It exists because §12.10 names the runtime topology and
§13.2 delegates the runtime binding to deployment.

- **Owned here (normative).** Production topology (§65.2);
  static serving & SPA fallback (§65.3); production environment
  (§65.4); runtime operations (§65.5); Node LTS binding (§65.6);
  deployment checklist & release cadence (§65.7); scope lines &
  residual risks (§65.8); verification (§65.9).
- **Owned elsewhere — deliberately not repeated here.** The
  runtime architecture and ops overview = §12.9/§12.10;
  environments and the env contract = §10 (frozen `env` object,
  fail-fast); boot/health/shutdown = §26; sessions and cookies =
  §28; mock gating = §40.5; the sweeper = §62; build/lint gates
  = §9.7/§63.
- **Explicitly out of scope §65.** No containers, no CDN, no
  orchestration (locked §12.2; platform scope §3.1.4); no
  staging environment until OQ-003 closes (§69); no backups
  (§12.9 — residual risk §67); no new constant (§11 unchanged),
  no path beyond §15, no package.

### 65.2 Production topology

One Express process serves the whole product:

- **API:** every `/api/v1` route module of §30–§39, mounted by
  the §26.5 registry, with the fixed middleware chain (§27) and
  the `GET /api/v1/health` endpoint (§26.6).
- **Client:** the built static bundle (`client/dist`, §9.7 build
  — Vite output) served by the same Express process (§12.10,
  §13.2). There is no separate static host.
- **Database:** MongoDB is external to both (Atlas/local per
  `MONGO_URI`, §10.4, §12.3); the backend connects with
  fail-fast at boot (§26.6).
- No reverse-proxy-dependent wiring: the deployment is a single
  origin; the client's production API base is the same-origin
  `/api/v1` (§10.5 note).

### 65.3 Static serving & SPA fallback

- Production (`NODE_ENV=production`) enables static serving of
  the built client with the SPA fallback (unknown non-API paths
  serve the client entry, §41 routing).
- **The fallback never shadows `/api/v1`** — API paths resolve
  through the §26.5 mount before any static/fallback handling;
  the health endpoint is equally protected (§26.6, §61.2).
- Static assets carry immutable caching where the build
  fingerprints them; `index.html` is never fingerprinted and is
  served fresh (standard Vite behavior).

### 65.4 Production environment

- The required variables of §10.4 are present and validated
  (fail-fast at boot — no partial startup).
- `NODE_ENV=production` flips cookie security: `Secure` cookies
  on the §28 session pair (development allows http://localhost,
  §10.5/§28).
- Mock routes are not mounted in production (the §40.5 guard is
  asserted at boot; the route module mounts only under
  `NODE_ENV=development`).
- `EXPORT_DOCS_ENABLED` stays `false` until OQ-004 closes
  (§11.3, §37.3) — production ships the stub behavior.

### 65.5 Runtime operations

- **Health:** `GET /api/v1/health` → 200 `{ success, message,
  data: { status, uptime } }` — unauthenticated, no database
  touch, excluded from rate-limit tiers (§26.6).
- **Shutdown:** the ADR-013 protocol on `SIGINT`/`SIGTERM` —
  stop accepting connections, clear the sweeper timer (§26.6,
  §62), close MongoDB, flush the logger, exit 0 (§26.6).
- **Logs:** rotation at `LOG_RETENTION_DAYS` (30, §9.5/§26);
  the deny list of §9.5 is active in production logging.

### 65.6 Node LTS binding

Deployment binds the runtime: the process runs on the **current
installed LTS of the environment** (§13.2 — neither manifest
pins a Node version). Upgrades to the LTS line are environment
maintenance; the repo never pins a Node version.

### 65.7 Deployment checklist & release cadence

- Feature branches per §9.8 (`phase-N-description`); `main` is
  the only deployable branch.
- Per-release checklist: §9.7 build gates pass (vite build 0
  errors, node --check, lint); the §63 gate sweep runs at the
  P8 phase gate (§66); required env present; health check
  returns `up`; one smoke walk of SC-4 and SC-5 (§63.6).
- Cadence is event-driven (a §66 phase completes and clears its
  review gate), not scheduled.

### 65.8 Scope lines & residual risks

- **OQ-003 blocks production sign-off** (§69): the deployment
  target (host, domain, production MongoDB) is open; until it
  closes, §65 is satisfied by the topology contract here, and
  the §66 P8 deployment work runs against the development
  environment only. Staging appears only if OQ-003 decides so.
- **No backups** (§12.9): the two-path lifecycle and tombstones
  (§17.4) are the only deletion safety; the data-loss exposure
  is registered as a residual risk in §67 common-risk register.
- **Google Docs export** ships in stub mode until OQ-004 closes
  (§37.3) — a known, flagged gap (SC-5 partial).

### 65.9 Verification usage

- Grep gates: the SPA fallback matches only non-API paths (the
  `/api/v1` mount precedes it); one origin serves both API and
  statics; no mock route registration outside the §40.5 guard;
  `Secure` cookie attribute gated on `NODE_ENV=production`
  (§28).
- Cross-section checks: mirrors §12.9/§12.10 (topology),
  §10.4/§10.5 (env), §13.2 (Node LTS, processes), §26.5/§26.6
  (registry, health, shutdown), §28 (cookies), §40.5 (mock
  guard), §62 (sweeper on shutdown), §69 (OQ-003/OQ-004).
- §65 introduces no constant (§11 unchanged), no path, and no
  package; it references only specification sections.

**End of Part E (cross-cutting).** Sections 60–65 close the
cross-cutting specification in dependency order: universal UX
(§60), security & reliability (§61), retention mechanics (§62),
verification (§63), performance & official-± resolution (§64),
and deployment (§65); delivery follows in Part F (§66–§69).

---

## Part F — Delivery

## 66. Implementation Phases

### 66.1 Purpose & scope

§66 is the execution plan of the whole specification (ADR-027:
eight phases; ADR-028: feature branches): which sections are
built when, which dependencies are installed with which phase,
which decisions land at which gate, and — through §66.10 — how
the frontend is verified before any backend exists. It exists
because §4.2's re-admission conditions (§4.5) and the §13.5
planned dependencies both name phases in this section; §66 is
their single home.

- **Owned here (normative).** The phase protocol (§66.2); the
  phase working files (§66.3); the frontend-task practice
  (§66.4); the protocol chain (§66.5); same-change discipline
  (§66.6); the D1–D5 re-admission contract (§66.7); the
  uninstalled-behavior gate (§66.8); the eight phases (§66.9);
  the client-side dev mock adapter (§66.10); verification
  (§66.11).
- **Owned elsewhere — deliberately not repeated here.** The
  git protocol's six steps = §9.8 (consumed, never restated);
  success/engineering gates = §2.4 SC-6/SC-7; DoD = §2.6;
  planned dependencies and their entrance gates = §13.5; the
  standing editor replacement path = §14.4; the open-question
  mechanics = §69.
- **Explicitly out of scope §66.** No new package beyond the
  §13.5 plan (conditional NVIDIA helper at P7 per §16.4 — never
  proactive); no new constant (§11 unchanged); no path beyond
  §15; no automated tests (§4.3 — gates replace suites).

### 66.2 Phase protocol

Every phase follows the §9.8 six steps, in order:

1. **Pre-Git:** check status; create the feature branch
   (`phase-N-description`, ADR-028).
2. **Deep codebase analysis** of everything the phase touches.
3. **Analysis of all prior phases** (their commits and their
   working-files records, §66.3).
4. **Phase execution and validation:** the phase's task list
   (the tables of §66.9) is executed as sub-tasks, each closing
   with its listed validation.
5. **User review and explicit approval:** a hard gate — Step 6
   never runs without it. The reviewer is shown a diff summary
   and the phase's exit-gate results.
6. **Post-git:** stage, commit (`feat: phase N description`),
   push, merge, delete the branch (§9.8).

Commit message format and the no-amend rule: §9.8. A phase is
done when its tasks, its exit gates, and the step-5 approval all
hold — not when the code "looks finished".

### 66.3 Phase working files

Each phase maintains a small set of **working files** that travel
with the work across sessions: the **task plan** (the §66.9 task
list with per-task status), the **findings log** (everything
learned about the codebase and its history while executing), and
the **progress record** (what was done, what is next, what
blocked). They exist so that work survives context loss and
each new session starts from the record, not from memory. They
are updated continuously — a phase begins by reading them and
ends by updating them. They are **process artifacts**: never
imported by runtime code, and never named or located by any
section of this specification.

### 66.4 Frontend-task practice

Every frontend task (P2–P5, P8) follows the standing design
practice: the UI is built **deliberate and distinctive** — the
Ethiopic content typography of §43 first, then spacing, color
and form decisions that carry the product's identity; templated
default looks are not acceptable as a finish. A task is complete
only when the surface reads intentional: type scale, hierarchy,
and the shared chrome of §44/§47 applied, with every page
enumerating the §60 states.

### 66.5 The protocol chain

Execution order within every sub-task: the standing operating
instructions → this specification as the **sole behavioral
input** → logical reasoning → implementation. Nothing outside
the specification and the standing instructions decides
behavior; a conflict between them and an implementation habit is
resolved toward the specification, and a genuine gap becomes a
§69 registration — never local prose.

### 66.6 Same-change discipline

A task that changes a shared source of truth changes its mirrors
in **the same commit**: the §15.4/§15.5 tree with the sections
that name files (§15.7); the §13.3–§13.5 manifests with installs
and removals (§13.7); the §14.3 ADR index with owner-section
amendments (§14.5); the schema-era sections with model changes
(§18.9); the §11 constants with their consumers (§11.7). The
§63.5 owner-mirror checks are the review instrument.

### 66.7 Deferred-feature re-admission (D1–D5, §4.2)

A re-admission follows §4.5: the item is removed from §4.2, a
phase is added to §66.9 with the §4.2 re-admission conditions as
its tasks, the §4.3/§13.6 exclusions it touches are amended by
decision, and the move is recorded in the §69.4 register with
date and amendment citation. The rows below are the carrying
records; the conditions stay in §4.2:

| Feature | Re-admission conditions (from §4.2) | Costs it would add |
|---|---|---|
| D1 TTS | User request with concrete use case; new phase in §66; audio-output dependency added to §13 | new phase, §13 change |
| D2 Realtime | New phase in §66; streaming component in §12/§33; performance targets in §64 | new phase, §12/§33/§64 changes |
| D3 Native apps | New phase in §66; separate client (§41) and store deployment; §13 change | new phase, §41/§13 changes |
| D4 RBAC | New phase in §66; user model (§19) and auth (§28) redesign; ADR-036 reversal | new phase, §19/§28/§14 changes |
| D5 Translation | New phase in §66; translation provider design (§16) and language policy (§7) | new phase, §16/§7 changes |

### 66.8 Uninstalled-behavior gate

Until a §13.5 planned dependency is installed by its phase, no
code and no section may assume its runtime behavior (§13.5). In
particular, before the P4 editor phase: there is no rich-text
editing surface (content renders as text; `MuiEditor` is not
mounted), and the sanitizer (§61) is defense-in-depth only
(§61.3). The gate expires at the install; the install lands with
its owning phase in the same commit (§13.7, §66.6).

### 66.9 The eight phases

Each phase row lists its **owning sections** (built or consumed
in this phase), its **install & amend entries** (matching §13.5
entrance gates and §66.6 discipline), and its **exit gate**
(run at step 4, evidenced at step 5).

**P1 — Foundations & configuration.**

| Task | Sub-tasks | Owning sections |
|---|---|---|
| Repo standing | Verify the §15 trees match tracked files; clean untracked build artifacts; confirm manifests match §13.3/§13.4 | §15, §13 |
| Environment | `.env` contract per §10; fail-fast boot prototype (§26.2) | §10, §26 |
| Constants | `constants.js` + `httpStatus.js` skeletons per §11 with all §11 tables transcribed | §11 |
| Phase records | Initialize the §66.3 working files | §66.3 |

Install & amend: none (both manifests already hold the §13.3/
§13.4 base). Exit gate: §9.7 hygiene pass; §15 tree ↔ git diff
matches; env read only via the frozen `env` object.

**P2 — Design system & theme.**

| Task | Sub-tasks | Owning sections |
|---|---|---|
| Theme tokens | §43 palette/type/surfaces; Ethiopic content face; §44 overrides | §43, §44 |
| Responsive system | §45 breakpoints and motion | §45 |
| Component belt | The §46.1–§46.17 reusable components (belt first, pages later) | §46 |
| Favicon | Content decision + asset | §43, §15.5 |

Install & amend: `@fontsource/noto-serif-ethiopic` (theme phase,
§13.5); amend §13.4 and §15.5 in the same commit. Exit gate:
build 0 errors; MUI-only styling greps (§63.4); §46 component
states enumerate §60.

**P3 — Frontend foundation & network.**

| Task | Sub-tasks | Owning sections |
|---|---|---|
| Entry & routing | App shell, routes and lazy loading (ADR-025); guards §41.5 | §41, §47 |
| Network layer | `apiSlice` descriptor, reauth chain, envelope unwrap (§42) | §42 |
| Auth pages | Landing/Login/Register against the §28 contract | §48 |
| Mock adapter | The §66.10 adapter wired at the §42 boundary | §66.10, §40 |

Install & amend: none (the adapter is a plain module, §66.10).
Exit gate: auth flows, guards and §42.3/§42.4 rules verified
against the adapter with §40 fixtures.

**P4 — Frontend feature pages.**

| Task | Sub-tasks | Owning sections |
|---|---|---|
| Dashboard | KPIs/charts/latest per §49 | §49, §38 contract |
| Reports list & details | §50 grid, §51 details incl. editor read-only surface | §50, §51 |
| Wizard | §52 steps 1–5 incl. recorder and review | §52, §53 |
| Correction & chat | §54 Modes 1–3, §55 conversation UI | §54, §55 |
| Branches, profile, exports, search | §56, §57, §58 (print/TXT/XLSX/CSV), §59 | §56–§59 |
| Editor install | `MuiEditor` (TipTap + dompurify) + toolbar per ADR-038 | §46.16, §53, §14.4 |

Decision point: **OQ-007** lands here (editor phase, §69): the
`raw`/`latest` storage format (plain text vs rich-text HTML) is
decided and the §21.2 slots, §61.3 policy and §46.16 contract
are finalized in the same change. Install & amend:
`@tiptap/react` + `dompurify` (§13.5 editor phase); amend §13.4,
§15.5, and the OQ-007 row in §69 in the same commit. Exit gate:
every page enumerates the four §60 states; §63.4 grep gates;
SC-5 partial (client formats vs fixtures; Google Docs stays
stub, §37.3).

**P5 — Frontend integration readiness & hardening.**

| Task | Sub-tasks | Owning sections |
|---|---|---|
| Readiness sweep | Full §63.3/§63.4 gate run; every page walked through loading/empty/error/success with fixtures | §63, §60 |
| Manual walks | §63.6 SC-1…SC-5 fixture-driven pre-backend walks (SC-1 final only at P7) | §63.6 |
| Hardening | §61 client-side rules (sanitize-on-render where stored HTML exists), §64 no-client-± greps | §61, §64 |

Install & amend: none. Exit gate: step-5 review — the frontend
is declared **integration-ready**: every §42 contract has a
working consumer against the adapter, and no backend code exists
yet.

**P6 — Backend foundation & domain APIs.**

| Task | Sub-tasks | Owning sections |
|---|---|---|
| Foundation | §26 boot/logger/health/shutdown; §27 chain, tiers, envelope, sessions | §26, §27 |
| Models | §19–§24 with §18 conventions, indexes, TTL declarations | §19–§24, §18 |
| Identity | §28 auth, sessions, OAuth stub; §29 validators | §28, §29 |
| Domain APIs | §30 branches; §31 reports & status machine; §32 uploads; §33 STT; §34 generation; §35 correction; §36 chat | §30–§36 |
| Aggregations | §37 exports (content surface + docs stub), §38 analytics, §39 search | §37–§39 |
| Seeding | §40 mock seed/wipe endpoints | §40 |

Install & amend: none planned (backend manifest is final per
§13.3; the NVIDIA helper is P7-conditional, §16.4). §15.4 tree
amendments land same-commit (§66.6). Exit gate: `node --check`
passes; seed/wipe deterministic (§40.6); one transition-guard
table (§31.4); session template on every write (§27.7).

**P7 — Backend integration & transport.**

| Task | Sub-tasks | Owning sections |
|---|---|---|
| Real transport | Client switches to the real API through §42; the §66.10 adapter is **deleted** | §42 |
| Transport helper | Evaluate the §16.4 condition; install the NVIDIA multipart helper **only if** it holds — never proactively | §16.4, §13.5 |
| Retention live | §62 sweeper validated: archive → window → sweep; TTL safety net; orphan pass | §62 |
| Manual acceptance | §63.6 SC-1 real-Amharic walk; SC-3 surgical check; SC-4 full loop both types | §63.6 |

Install & amend: conditional helper per §16.4 (amend §13.3 in
the same commit if installed). Exit gate: SC-1/SC-3/SC-4 pass;
mock-adapter grep gate clean (§66.10).

**P8 — Deployment & hardening.**

| Task | Sub-tasks | Owning sections |
|---|---|---|
| Deployment | §65 contract executed (production sign-off waits on OQ-003; dev-env deployment otherwise) | §65, §69 |
| Security re-sweep | §61 hardening walk: XSS double-gate, secret hygiene, deny-list logging | §61 |
| Retention soak | Sweeper across development cycles; §62.8 edge cases exercised | §62 |
| Full gates | §63.6 full matrix incl. SC-5 five-format export; DoD items 1–4 | §63, §2.6 |

Install & amend: none beyond the approved plan. Exit gate: DoD
§2.6 complete; §63.4 full sweep; step-5 review closes the phase.

### 66.10 Client-side dev mock adapter

Before P7 there is no backend; the frontend is still verified
end-to-end through a **client-side development mock adapter**:

- A plain client module (no new package, §42 base untouched)
  implementing the **§42 query contracts** over **§40 fixture
  data** (§25 copy, report/branch DTO shapes, envelope and
  pagination surfaces) — it mirrors the DTO transforms of
  §17/§27 exactly, so page code cannot tell the adapter from the
  real API.
- **Boundaries the adapter keeps honest:** multipart uploads
  resolve with fabricated success; generation, correction,
  transcription and chat resolve with canned fixture responses
  per §40/§25 — the pages and their §60 states are exercised,
  while accuracy claims are explicitly deferred to P7 (SC-1).
- **Gating:** the adapter is wired at the §42 boundary under a
  dev-only condition; it never exists in a production build.
- **Dev conveniences (owner-approved, die with the adapter at
  P7):** (1) **auto-auth on boot** — when no live stored session
  exists at module load the adapter signs in the seeded supervisor
  user, so a page refresh never drops development out of
  authentication; a valid stored session (any seed user) always
  wins; registered accounts are in-memory only, so their sessions
  live for the page-load and are replaced by the seeded auto-auth
  on the next reload; real login/register flows stay reachable
  after an explicit logout. (2) **Report list default** — `GET
  /reports` returns **all** rows of the user when `isArchived` is
  absent (explicit `"true"`/`"false"` still filter), so archived
  rows and their Restore/Delete actions are exercisable before the
  §50 filter dialog exists (OQ-009); the §31.3 "default hidden"
  contract stays the real-backend rule, and surfaces that must be
  active-only (e.g. §49.2 Latest reports) pass `isArchived=false`
  explicitly. Restore/Delete on an archived row work against the
  two-path lifecycle; the adapter simulates the retention window
  (archive retention message; delete of an archived row removes it
  outright per §50.6's simulated path).
- **Deletion gate (P7):** the adapter is removed when the real
  transport lands; a grep gate (its module absent from the
  client tree) closes the record. The adapter is a phase
  artifact — it never becomes a runtime feature.

### 66.11 Verification usage

- Grep gates: no §66 phase table references a package outside
  §13.5; the adapter module is absent after P7; no mock
  behavior reachable in production builds; branch names and
  commit messages follow §9.8.
- Cross-section checks: mirrors §4.2/§4.5 (re-admission),
  §9.8 (six steps), §13.5/§13.7 (planned installs), §14.4
  (ADR-038 standing), §16.4 (conditional helper), §63 (gates at
  run points), §69 (OQ-003/OQ-007 decision points).
- §66 introduces no constant (§11 unchanged), no path beyond
  §15, and no package; it references only specification
  sections.

---

## 67. Risks & Mitigation

### 67.1 Purpose & scope

§67 is the qualitative risk register of the product: the risks
that could harm correctness, availability, or the user's work,
with the specification controls that already mitigate them and
the residual exposure that remains. It exists so that mitigations
are *owned by sections* (not by habits), and so that accepted
residuals are visible decisions rather than accidents.

- **Owned here (normative).** The risk register (§67.2); the
  standing mitigations (§67.3); the risk-response discipline
  (§67.4); verification (§67.5).
- **Owned elsewhere — deliberately not repeated here.** The
  controls cited in the register live in their owning sections
  (e.g. §16.5 timeouts, §61 sanitization, §62 retention) and are
  referenced, never restated; the open questions whose closure
  changes risk (OQ-003/OQ-004) = §69.
- **Explicitly out of scope §67.** No numeric probability/impact
  scoring (SC-8 — qualitative only); no new control text (every
  control is already normative in its section); no new constant
  (§11 unchanged), no path, no package.

### 67.2 Risk register

| ID | Risk | Existing controls (owner) | Residual | Risk owner |
|---|---|---|---|---|
| R-1 | AI provider outage or drift (paid-model drift) | Fallback chain ADR-014 (§16.6); retry schedule §16.5; schema gates §34/§35 | AI actions unavailable until a provider returns; manual report authoring | §34 |
| R-2 | Provider API contract drift (endpoint/schema changes) | Structured-output contracts §16.4; response validation §34/§35; adapters isolated | Re-point/version-pin at deploy (§16.8); brief breakage | §16 |
| R-3 | STT chunk failure | Per-chunk failure marking; fuse of succeeded chunks (§33/§16.5) | Partial transcription → re-record or re-transcription (§33) | §33 |
| R-4 | Provider rate-quota storms (429) | App AI tier primary guard (§27.3); `Retry-After` honor (§16.5) | Transient 502s with §60 copy; retry affordance | §27 |
| R-5 | Session-token theft on a shared device | httpOnly + `SameSite`; dual-token rotation (ADR-004, §28) | Logged-off sessions; re-login | §28 |
| R-6 | Reauth loops on expiry | Single-refresh rule; fail-through on the refresh call (§42.3) | Silent redirect to login (§42.3) | §42 |
| R-7 | Orphaned files / disk growth | Orphan sweep §62.4; upload caps §32 | Disk contention until next sweep (≤ interval) | §62 |
| R-8 | Permanent deletion after the retention window | 409 restore-window semantics (§62.3); two-path lifecycle §17.4 | Deletion is contractually permanent (BR-15) | §62 |
| R-9 | Corrupt or missing audio binary | Documented mock behavior; play 404 + toast (§32, §60) | Recording lost; re-record | §32 |
| R-10 | Aborted uploads | Multer limits §32; temp reclaim §62.4 | Temp bytes until reclaimed | §32 |
| R-11 | Offline connectivity | Offline toast (§60); retry re-runs the same §42 call | Work paused until connected | §60 |
| R-12 | Editor-choice reversal (TipTap/DOMPurify) | Standing replacement path (§14.4, §13.7) | Migration cost at the editor phase | §46 |
| R-13 | Rich-content XSS | Double gate §61.3/§61.4; no raw HTML (§46.16, §55.3) | Residual surface minimized; defense-in-depth | §61 |
| R-14 | MongoDB outage | Fail-fast boot (§26.6); health endpoint (§65.5) | Complete unavailability during the outage | §26 |
| R-15 | Concurrent-write conflicts | Session template (§27.7); conflict surfacing as 422/409 + §60 toast (§31.8) | One action loses; user retries | §18 |
| R-16 | Unbounded list growth | Server-side pagination (ADR-034); caps §11.3 | Deeper pages beyond max limits unavailable | §27 |
| R-17 | Data loss without backups | Two-path lifecycle + tombstones (§17.4); no-backups scope (§12.9) | **Accepted exposure:** permanent loss on infrastructure failure | §12.9 |
| R-18 | Node LTS EOL in the environment | LTS binding (§13.2/§65.6) | Upgrade lag on the host | §65 |
| R-19 | Deployment unknowns (OQ-003) | Topology contract §65; dev-env P8 execution | Production not deployed until closure | §69 |
| R-20 | Google OAuth open (OQ-004) | Stub + `EXPORT_DOCS_ENABLED` flag (§37.3, §28.6) | Google Docs unavailable; SC-5 partial | §37 |
| R-21 | Export fidelity (BR-18) | Verbatim serialization; DD-MM-YY strings §58 | Browser print variations (A4/paper) | §58 |

### 67.3 Standing mitigations

- **Provider dependency is the top external risk**: mitigated
  by the fallback chain (ADR-014), never by storing "best
  effort" text (§16.5 accuracy gate).
- **The user's work never silently disappears**: every delete is
  a two-phase lifecycle (§17.4); the only permanent path is the
  retention window's expiry (§62) and the accepted no-backups
  residual (R-17).
- **State never tears**: every multi-document write is a session
  (ADR-018); the client surfaces conflicts, never overwrites
  them (§31.8).
- **The register is read at every phase gate** (§66): a phase
  whose sections touch an R-row re-validates the control at that
  phase's exit gate (§63).

### 67.4 Risk-response discipline

- No quantitative scoring (SC-8); a risk whose mitigation needs
  a number registers the metric in §69 first (§63.7).
- A risk with **no decided control** becomes an open question in
  §69 — never silent prose here.
- Register changes (new rows, dropped controls) follow the
  §14.5 amendment discipline: the owning section changes first,
  this table is updated in the same change.

### 67.5 Verification usage

- Grep gates: every register control citation resolves to an
  authored subsection; no numeric likelihood/impact anywhere in
  §67; §69 carries any undecided control.
- Cross-section checks: mirrors §16.5/§16.6 (R-1…R-4), §28
  (R-5), §42 (R-6), §62 (R-7/R-8), §32 (R-9/R-10), §61 (R-13),
  §12.9 (R-17), §69 (R-19/R-20).
- §67 introduces no constant (§11 unchanged), no path, and no
  package; it references only specification sections.

---

## 68. Glossary

### 68.1 Purpose & scope

§68 is the exhaustive single-source term table of this
specification: every domain, format, lifecycle, pipeline,
frontend and administrative term used across §1–§67, in one
place, with its normative home. It exists so that any reader —
and any author of a later amendment — resolves a term's meaning
once and cites it uniformly.

- **Owned here (normative).** The glossary rules (§68.2); the
  term table (§68.3); administrative keys (§68.4); verification
  (§68.5).
- **Owned elsewhere — deliberately not repeated here.** Full
  normative definitions live in the cited homes; §68 carries
  one-line meanings only and never restates rules.
- **Explicitly out of scope §68.** No constants (§11 unchanged),
  no path, no package; no new terminology is minted here.

### 68.2 Glossary rules

1. **Defined once.** A term appears once in §68.3; a later
   section uses the term and references the table when it needs
   to disambiguate — it never redefines.
2. **Additions by amendment only.** A new term enters this table
   in the same change that introduces it into the specification
   (§66.6 same-change discipline); §68 never precedes its
   terms.
3. **The home cites, not defines.** Meaning disputes resolve to
   the cited normative section, not to the table's one-liner.

### 68.3 Term table

| Term | One-line meaning | Home |
|---|---|---|
| Report | The day's supervision record (the product's core artifact) | §1, §21 |
| Type-1 / Type-2 | Single-branch day / multi-visit day | §6.4 |
| Visit | One branch visit block with `clockIn`/`clockOut`; sequential `visitNo` within the report | §21.2 |
| Clip | One recorded audio segment bound to (`reportId`, `visitNo`) | §22, §32 |
| Branch snapshot | `Branch.name` copied into the report at capture time | §21.2 |
| `raw` / `latest` | First-generation content / the single current-content slot | §21.2, BR-11 |
| Single undo | Revert `latest` to `raw` while they differ | §31.6 |
| Transcription | Per-audio STT output row | §23 |
| Re-transcription | Re-run STT for a clip with accept/revert | §23.4, §33 |
| `±` token | `OFFICIAL_TOKEN_PREFIX`-marked official text | §64.5, §11.3 |
| Official-format resolution | Server-side, export-time, artifact-only token replacement | §64.6, §37.3 |
| `±`-display rule | Client renders tokens verbatim with "leave untouched" guidance | §53.3 |
| Report date | The §6-format date, never the system clock | BR-01 |
| DD-MM-YY / HH:mm | Ethiopian date / 24-hour zero-padded display conventions | §6.5, §43.6 |
| Transliteration | English/technical words spelled in Ethiopic script | §7.2 |
| Chrome vs content | English UI shell strings vs Amharic report content | §7.6 |
| Fallback chain | Addis AI → Gemini → NVIDIA for generation | ADR-014, §16.6 |
| Status machine | The five-step forward machine with explicit rewind rows | BR-06, §31.4 |
| `REPORT_STATUSES` | draft → audio_attached → transcribed → reviewed → completed | §11.4 |
| Archive / restore | Soft two-phase lifecycle step 1 | BR-16, §31.7 |
| Hard delete | Sweeper pass-1 permanent removal | §62.3 |
| Retention window | `ARCHIVED_TTL_SECONDS` = 2592000 (30 days) | §62.2, §11.3 |
| TTL safety net | The two `expireAfterSeconds` indexes (Report, Branch) | §18.3, §62.2 |
| Sweeper wins races | Parent-deleted-first ordering over the TTL index | §62.2 |
| Orphan sweep | Sweeper pass 2: unlink retries, race orphans, temp reclaim | §62.4 |
| Tombstone | Null `branch` ref after branch removal; snapshot-name reads | §17.4 |
| Seeded fixtures | The §40 deterministic mock set, incl. the persona `ቤዛ አያሌው` | §40.3, §25.3 |
| Metadata-only audio | Mock audio rows with no physical files | ADR-037, §40.6 |
| Model registration | `(provider, model, reasoning)` from the locked registries | §11.4, §16.2 |
| Chunking | 60-second wavSplitter segmentation of STT clips | ADR-007, §33 |
| Reauth | The single-refresh-attempt client chain | §42.3 |
| Session transaction | The §27.7 session write template | ADR-018 |
| Dual-token JWT | httpOnly access/refresh pair with rotation | ADR-004, §28 |
| Rate tiers | Global/auth/AI limiting windows | ADR-029, §27.3 |
| Envelope | `{ success, message, data }` response wrapper | §5, §27.4 |
| DTO transform | The response mapping layer | §17, §27 |
| Server-side pagination | `docs`-surface list paging; client never aggregates | ADR-034 |
| States protocol | loading/empty/error/success per surface | ADR-033, §60.2 |
| `showToast` | The single toast trigger API | §60.3 |
| Error boundary | The App-level render fallback | §60.8 |
| `MuiEditor` | The single rich-text editor + read-only renderer | §46.16 |
| AppShell | The shared layout chrome | §47 |
| Wizard steps 1–5 | The creation flow steps | §52 |
| Modes 1–3 | Content-save / typed-instruction / voice-instruction correction | §54 |
| Surgical correction | Only addressed sections change (diff-verified) | BR-09, SC-3, §35.3 |
| Accept → save flow | Staged corrections persist only on Accept | §35.5 |
| Mock adapter | Client-side dev module implementing §42 contracts over §40 fixtures | §66.10 |
| SPA fallback | Production static fallback that never shadows the API | §65.3 |
| Health endpoint | `GET /api/v1/health`, unauthenticated, no DB touch | §26.6 |
| Sanitize-on-write / on-render | The §61.3 double gate | §61.3 |
| Mock-data seeding | The §25-rules-driven dev dataset | ADR-037, §40 |

### 68.4 Administrative keys

| Key | Meaning | Home |
|---|---|---|
| BR-xx | Business rule (numbered BR-01 … BR-19) | §5 |
| ADR-xxx | Architectural decision record (ADR-001 … ADR-038) | §14 |
| OQ-xxx | Open question (registry) | §69 |
| D1–D5 | Deferred features (re-admissible) | §4.2 |
| A1–A6 | Assumptions (registered) | §3.4, §69.3 |
| SC-x / G-x / F-x | Success criteria / goals / feature list | §2.4 / §2.3 / §3.1.2 |
| `TODO(open)` | In-code marker for an open-question point | §69.1 |

### 68.5 Verification usage

- Grep gates: no term in §68.3 has a second definition line
  anywhere in the specification (the table is the only
  one-liner set); terms used in §66 phase tables resolve to
  rows here.
- Cross-section checks: mirrors §6.3 (labels), §21.2 (slots),
  §62 (sweeper rows), §64 (tokens), §66.10 (adapter) — a row
  whose home changes is updated in the same change (§68.2).
- §68 introduces no constant (§11 unchanged), no path, and no
  package; it references only specification sections.

---

## 69. Open Questions & Assumptions (registry)

### 69.1 Purpose, scope & mechanics

§69 is the **single registry** of every open question and
assumption in this specification — the only place a question is
registered and the only place a closure is recorded (§4.5, §7
content rules: no prose invention outside this registry).

- **Owned here (normative).** The mechanics (§69.1); the open
  questions register (§69.2); the assumptions register (§69.3);
  the D1–D5 re-admission records (§69.4); verification (§69.5).
- **Owned elsewhere — deliberately not repeated here.** The
  assumption home remains §3.4 (this index mirrors it); the
  deferred-feature home remains §4.2; stub/official texts
  (OQ-004) live with their sections (§28.6) and are referenced.
- **Mechanics.**
  1. **Registry-only.** An open question is expressed only as an
     OQ row here; a section that needs an open behavior marks
     its point with a `TODO(open)` code comment referencing the
     OQ number and otherwise writes no outcome.
  2. **Closure record.** Closure is by owner decision (or by a
     §4.2/§14.5 amendment when it touches a decision or a
     deferred feature); the record carries the closure date and
     the citation of the deciding amendment (§21.7 books the
     pattern).
  3. **Open → deferred.** A question that becomes a deferred
     feature moves to §4.2 with a record here (§4.5).
  4. **SC-8 metrics.** A new quantitative metric registers here
     before any section adopts it (§2.4 SC-8, §63.7).
  5. **Non-blocking by default.** Only OQ rows marked *blocking*
     in §69.2 gate a phase or a section's finalization.
- **Explicitly out of scope §69.** No new constant (§11
  unchanged), no path, no package; §69 never decides a question
  itself — it records decisions taken in the owning sections.

### 69.2 Open Questions register

| OQ | Status | Question | Owning sections | Blocks |
|---|---|---|---|---|
| OQ-001 | **CLOSED** (2026-08-09) | Where do generated content and version history live? | §21 | — |
| OQ-002 | **CLOSED** (2026-08-11) | Required vs optional `clockIn`/`clockOut` at model level | §21.2, §31 | — |
| OQ-003 | **OPEN** | Deployment target: host, domain, production MongoDB | §65, §12.10 | §65 production sign-off (P8 deployment, §66) |
| OQ-004 | **OPEN** | Google OAuth: real integration vs stub | §28, §37 | Google Docs export; SC-5 partial (§37.3) |
| OQ-005 | **CLOSED** (2026-08-10) | Exact dashboard KPI set & charts | §49 | — |
| OQ-006 | **CLOSED** (2026-08-11) | Export file naming convention | §58 | — |
| OQ-007 | **OPEN** | `raw`/`latest` storage format: plain text vs rich-text HTML | §21.2, §46.16, §53, §61 | The §66 P4 (editor) decision point |
| OQ-008 | **OPEN** | Landing page: further work wanted by the owner — the round-9 review is not final; polish/concept revision deferred until after all eight phases | §48.2, §66 | Post-P8 owner window (§66.9 P8 / §2.6); non-blocking |
| OQ-009 | **OPEN** | The Reports filter feature is provisional: the dialog renders a TBD surface — what to filter (status/branch/archived were working guesses), branch single vs multi-select, server pagination of filtered results, and date vs date-range (or both) are unresolved; until closure the page holds no filter state and lists what `GET /reports` returns | §50.3, §66 | The §50 filter dialog (full implementation; the mock list-all convenience persists until then) |

Records (closed):

- **OQ-001 — CLOSED 2026-08-09.** Decided by the ADR-005
  retirement amendment (§14.3/§14.5): no version chain. Content
  lives on the report row as `raw`/`latest` with single undo
  (BR-11, §21.2/§21.5).
- **OQ-002 — CLOSED 2026-08-11.** Decided by amendment, recorded
  at §21.7: every visit carries a required `clockIn`/`clockOut`
  pair (day-clock rule: a Type-1 visit pair is the day pair,
  auto-set by the wizard; §6.3 field 4, §31.2-2).
- **OQ-005 — CLOSED 2026-08-10.** Decided at §49.3: the four
  KPI cards (Reports this month, In progress, Completed,
  Active branches) over the §38 payload; anything absent renders
  no caption.
- **OQ-006 — CLOSED 2026-08-11.** Decided by this pass's §58
  amendment: TXT/XLSX adopt the CSV naming pattern
  (`reports-YYYY-MM-DD.*`); the PDF path inherits the print
  document title (set to the report date during print, §58.3).
  No other section changes; the §58.6 cross-check mirrors here.

Records (open):

- **OQ-003 — OPEN.** Deployment target unknowns (host, domain,
  production MongoDB). Until closure: §65 stands as the topology
  contract, P8 runs against the development environment, and
  production sign-off stays blocked (a *blocking* row). Closure
  path: an owner decision recorded here with the §65.9
  verification updated in the same change.
- **OQ-004 — OPEN.** Google OAuth real vs stub. Until closure:
  the stub of §28.6 governs ("Google sign-in is not available in
  this version"), `EXPORT_DOCS_ENABLED` stays `false` (§11.3),
  and the Google Docs menu item shows the "coming soon" state
  (§37.3/§37.6). Closure path: ADR-024 amendment + §28/§37
  rewrites in the same change (§14.5), then `EXPORT_DOCS_ENABLED`
  flips.
- **OQ-007 — OPEN.** Storage format of `raw`/`latest` (plain
  text vs rich-text HTML). Both slots stay plain `String`
  (§21.2) until the decision lands; the decision point is the
  §66 P4 editor phase, owned by the ADR-038 cohort
  (§46.16/§53/§54/§61); the §61.3 sanitization policy holds on
  both branches. Closure: recorded here with the §21.2 slots and
  §46.16 contract finalized in the same change.
- **OQ-008 — OPEN.** The owner wants further Landing-page work:
  the round-9 composition (cardless ruled-desk hero with the
  persisting §43.2 waveform, branches strip, Record → Verify →
  Deliver strip, CTA band) is functionally complete but not
  final — polish and/or concept revision are deferred until
  after all eight phases. Until closure: the §48.2 composition
  stands as delivered and nothing in the §66 P3 exit gate
  depends on it (*non-blocking* row). Closure: an owner
  decision recorded here with the §48.2 composition amended in
  the same change (§66.6).
- **OQ-009 — OPEN.** Registered at the R3-fix round (owner
  review): the Reports Filter button opens a dialog whose full
  implementation waits on: what to filter (a status/branch/
  archived set was the working hypothesis), branch single vs
  multi-select, server pagination of filtered results, and date
  vs date-range (or both). Until closure: the dialog renders the
  TBD surface (§50.3), the page holds no filter state, and —
  dev only — the mock lists all rows absent `isArchived` so the
  archived walk (Restore/Delete, §50.6) stays reachable (§66.10
  convenience, dies at P7 when the §31.3 "default hidden"
  contract fully applies). Closure: an owner decision on the
  filter dimensions recorded here with §50.3/§50.8 and the §31
  query contract amended in the same change (§66.6).

### 69.3 Assumptions register

The operative index of the §3.4 boundaries table (its rows are
the home; this table is the operational form — kept in sync by
the same change that touches §3.4):

| # | Assumption (index form) |
|---|---|
| A1 | One web app — client + backend, no satellite tools |
| A2 | One person per account; no shared accounts |
| A3 | Branch and record scope = the registering user (§3.2.3) |
| A4 | A report is per date (format date, not the clock); multi-clip days allowed (BR-01/BR-02) |
| A5 | Both format types supported: Type-1 single branch, Type-2 multi-visit with per-branch ranges |
| A6 | Amharic first-class; English/technical terms transliterated; UI stays English (§1.7/§7) |

**Extension rule.** A new assumption is written in §3.4 first and
mirrored here in the same change; §69 never invents an
assumption that §3.4 does not state.

### 69.4 D1–D5 re-admission records

Re-admission mechanics live in §4.5/§66.7; this register carries
the records:

| Feature | Status | Re-admission record |
|---|---|---|
| D1 TTS | Deferred (§4.2) | None to date |
| D2 Realtime | Deferred (§4.2) | None to date |
| D3 Native apps | Deferred (§4.2) | None to date |
| D4 RBAC | Deferred (§4.2; ADR-036 governs) | None to date |
| D5 Translation | Deferred (§4.2) | None to date |

A re-admission appends date + amendment citation to the row,
removes the item from §4.2, and adds the phase to §66.9 in the
same change; an open question that closes into a deferred
feature books its move here instead (§4.5, §69.1 rule 3).

### 69.5 Verification usage

- Grep gates: every `TODO(open)` in code/tests resolves to a
  §69.2 OQ number; no unresolved question is argued in prose
  without a row; closure records carry date + amendment
  citation; §3.4 and §69.3 mirror each other; no numeric metric
  in any section without a §69 registration (SC-8).
- Cross-section checks: mirrors §2.4 (SC-8), §4.2/§4.5 (D rows),
  §14.3/§14.5 (ADR statuses cited by closure records), §21.2/
  §21.7 (OQ-001/002/007), §28.6 (OQ-004 stub), §37.3 (OQ-004
  flag), §49.3 (OQ-005), §58 (OQ-006), §61.3 (OQ-007 branch),
  §66.9 (OQ-003 blocking, OQ-007 decision point).
- §69 introduces no constant (§11 unchanged), no path, and no
  package; it references only specification sections.

**End of specification.** Sections 1–69 are complete: product
(§1–§8), standards (§9–§11), architecture (§12–§17), data
(§18–§25), backend (§26–§40), frontend (§41–§60), cross-cutting
(§61–§65), and delivery (§66–§69), in the dependency order of
§12.1 and the §66 phase plan.
