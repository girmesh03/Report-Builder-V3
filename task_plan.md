# Task Plan: Wizard steps 1–3 round (F38–F46)

## Goal

Deliver the owner-amended creation flow: step-1 Next creates the report (draft), step-2 Next attaches the takes (audio_attached), and the transcription step (voice ledger + merged story + three correction modes + re-transcribe + gate, audio_attached → transcribed). Install the editor (MuiEditor + TipTap + dompurify) and close OQ-007. Contract + spec amendments in the same change set.

## Next Step

Phase G verification — dev-server smoke, manual walkthroughs, grep gates; then Phase H (commit) on explicit user approval.

## Phases

### Phase A: Planning files

- [x] findings.md — F38–F46
- [x] progress.md — session log, repository state
- [x] task_plan.md — this plan
- [x] Contract amendments — §4.10 two-payload flow; §5 intro/CR-076 status path; new CRs (attach act, voice-ledger design rows)
- **Status:** complete

### Phase B: Editor install + OQ-007

- [x] `client/` — npm i @tiptap/react @tiptap/starter-kit @tiptap/extension-text-style @tiptap/extension-color @tiptap/extension-placeholder dompurify (no @tiptap/extension-font-size exists — v3 TextStyle covers it, F47)
- [x] `components/reusable/MuiEditor.jsx` — TipTap + dompurify per §46.16 (value/onChange/readOnly/minHeight/id; Bold/Italic/Font size/Text color; sanitize write+render; readOnly hides toolbar; Ethiopic content stack)
- [x] Spec amendments (§46.16 OQ-007 closed, §21.2, §61.3, §69, §13.4/§13.5, §15.5 tree)
- **Status:** complete

### Phase C: Mock + endpoint hooks

- [x] transport.js — createReportHandler drops audios≥1; uploadClipHandler stagedClipId rebind + real durationSec; transcribeReportHandler plain-Amharic pool + per-clip latency; reTranscribeHandler plain alternate; correctContentHandler real staging + voice clip; acceptCorrectionHandler/revertCorrectionHandler + routes; revertContentHandler pre-generation restore; updateVisitsHandler empty-visits tolerance
- [x] reportsEndpoints.js — useUpdateVisitsMutation, useAcceptCorrectionMutation, useRevertCorrectionMutation
- **Status:** complete

### Phase D: Wizard orchestration

- [x] ReportNew — reportId state; step-1 Next create/PATCH + 422 details mapper; step-2 Next attach loop (attached flags); close behavior; step-3 → StepTranscription
- [x] StepNavBar — nextLabel prop (StepAudio needs no change — rows are page-owned, delete removes the row with its flag)
- **Status:** complete

### Phase E: Transcription step (voice ledger)

- [x] StepTranscription — queries, transcribe walk, per-take states, gate, mode-chip row, empty state
- [x] TranscriptionTakeRow — disc states (pending/transcribing/transcribed/failed), compact player, re-transcribe, retry
- [x] StorySection — divider, passage (latest/joined), reveal, notice, ± strip
- **Status:** complete

### Phase F: Mode surfaces + constants

- [x] edit-content/EditContentSurface (Mode 1), correct-instruction/InstructionPanel (Mode 2), correct-voice/VoiceCorrectionPanel (Mode 3), corrected-strip/CorrectedStrip
- [x] constants — WIZARD.transcription, WIZARD.modes, TOAST additions
- **Status:** complete

### Phase G: Verification

- [x] `npm run lint` → 0; `npx vite build` → 0, then `rm -rf dist`
- [ ] Dev-server 200s; manual walkthroughs (happy path, seedError(502) at each act, partial attach, delete-last-take rewind, stepper-jump empty state)
- [ ] Grep gates: no `.id`, no console.log, ± never resolved, TipTap only in MuiEditor, dangerouslySetInnerHTML only in MuiEditor/sanitized surfaces, no raw fetch outside apiSlice
- **Status:** in progress

### Phase H: Commit — only on explicit user approval

- [ ] Single commit (same-change discipline §66.6); planning docs + contract file untracked

---

# Round-7 plan: transcription step two-card restructure (F58+)

## Goal

Per the owner's 14-point directive: delete StorySection + the whole `components/reports/` tree; rebuild the step as two cards (audio desk + transcription desk) under the ribbon/stepper; correction moves into a `CorrectionDialog` (standard field + provider menu + mic-STT → Apply → candidate into the live editor); remove the edit/instruction/voice mode group; toolbar gains a font-size option menu (text-style reinstalled) with the Paragraph select restyled as a compact option menu; editor surface borderless; icon footer (revert/save with state colors). STT-only mock endpoint `POST /reports/:reportId/correct/transcribe`. Chrome label `nvidia → Deepseek` (wire id unchanged). No CR-xxx references in code — § refs only. Spec is base input; conflicts resolved by reasoning and mirrored in the same change.

## Phases

- **A** planning files (this plan, findings F58, progress log) · `npm i @tiptap/extension-text-style@^3.30.1` (done) · constants: Deepseek label, modes trim (edit/instruction/voice/instructionLabel/voiceHeading/voiceHint/transcribingVoice/recordLabel/generate out), re-add `revision`, add apply/cancel/ledgerSubtitle/storySubtitle/addCorrection/toolbar.fontSize, FONT_SIZES
- **B** MuiEditor: TextStyle ext · font-size Select · block-Select restyle (shared `toolbarSelectSx`) · `borderless` prop
- **C** transport `transcribeInstructionHandler` + route · reportsEndpoints `transcribeInstruction`
- **D** AudioCard (Card + CardHeader/CardContent/CardActions, scroll region, Transcribe act)
- **E** TranscriptionCard + CorrectionDialog
- **F** StepTranscription rewrite · delete StorySection + components/reports/ · CR-scrub in touched files
- **G** smoke +7 (58 total) · lint 0 · build 0 + rm dist · dev :3001 transforms 200 · grep gates (StorySection=0, components/reports=0, modes.edit|instruction|voice=0, CR-\d{3}=0)
- **H** mirrors: spec §11.4/§13.5/§14.3-4/§15.5/§15.6/§31.6/§33/§35/§46.16-17/§52.7/§53.2-5/§54.2-9/§66.10/§68.4 + user-stories + contract doc (CR-074 re-scope, CR-078 — doc only) + comment-hygiene sweep (remaining CR refs) + findings/progress

# Round-8 plan: 11-point dialog/editor fix pass (F59)

## Goal

Owner's 11-point review of the round-7 step: kill the two CardHeader DOM-prop warnings (MUI v9 has only `slotProps`), the duplicate `underline` extension (StarterKit v3 ships it), the font-size ladder (Default/10/11/12/14/16, Default = ~17px sentinel; values `px`-suffixed — the text-style extension renders the style bare), the `setFontSize` TypeError (stale dev bundle — hard refresh; not code), the Save 422 (empty editor serialization bypasses the `??` fallback → `||`), the ragged xs toolbar (single-row scroll rail below sm: nowrap + overflow-x auto + dividers hidden + compact select; wrap stays sm/md, single row lg+), the dialog field (editor-like borderless surface, placeholder kept), the typing lag (memoized dialog + stable recorder callback), the STT/apply no-op (**normalizeResult unwraps the envelope → read `result.text`/`result.content`, not `.data.`**), and the provider select (label-less, `aria-label` only; compact row). No CR refs in code; spec conflicts mirrored in the same change.

## Phases

- **A** constants `FONT_SIZES` ladder
- **B** MuiEditor: drop explicit Underline · `setFontSize(\`${next}px\`)` · xs scroll rail (nowrap/overflow/dividers/compact select/`ml:auto` md+)
- **C** AudioCard + TranscriptionCard CardHeader `slotProps.title/subheader`
- **D** MuiProviderSelect label-less · CorrectionDialog (borderless field, `result?.text`, `useCallback` clip handler, `memo`, 180px/36px row) · StepTranscription (`||` fallback, `result?.content`, stable `applyCandidate`/`handleApplyCorrection`)
- **E** verification: smoke 56/56 · lint 0 · build 0 + rm dist · transforms 200 (:3000) · gates (`titleTypographyProps|subheaderTypographyProps|@tiptap/extension-underline`=0, `CR-\d{3}`=0)
- **F** mirrors: spec §11.5/§46.16/§46.17/§54.2 + contract CR-070/071/077 round-8 bullets + findings F59 + progress · commit still gated on approval

# Round-8.1 plan: zero-lag dialog field + font-size/toolbar hardening (F60)

## Goal

User follow-up: (1) the `setFontSize is not a function` TypeError persisted through a server restart — proven environmental (fresh graph can't fail: dist/dep-bundle/served-module all contain the command; restart verified, listener 11004→8324) → hard reload cures it; hardening added so the select can never crash (core `setMark("textStyle", {fontSize})` fallback). (2) xs/sm toolbar "shrinks horizontally" — real bug: nowrap flex children default `flex-shrink: 1` and compress instead of overflowing → `& > *: { flexShrink: 0 }`. (3) the four dialog points: 5a/5c/5d already landed (borderless field+placeholder; `result?.text` + raw FormData; label-less select) — 5b (typing lag) got the real fix: `InstructionField` owns its value inside itself (typing re-renders only the field), dialog learns emptiness flips only, Apply reads `getValue()`, STT seeds via `seed(text)`; `onCap`/`onPermissionError`/`onClose` stabilized.

## Phases

- **A** CorrectionDialog: InstructionField (forwardRef + useImperativeHandle getValue/seed, local value, onEmptyChange flips) · handleApply/STT rewired · stable onCap/onPermissionError
- **B** TranscriptionCard `handleCloseDialog` useCallback (memo holds)
- **C** MuiEditor: setFontSize→setMark fallback + `& > *: { flexShrink: 0 }`
- **D** verify: lint 0 · build 0 + rm dist · smoke 56/56 · transforms 200 · mirrors: spec §46.16/§54.2 + findings F60 + progress · commit gated
- **I** commit + push — only on explicit user approval

# Round-8.2 plan: font-size paragraph scope + the highlighted-field contract (F61)

## Goal

User reports AFTER a full Chrome hard reload (stale-tab theory dead): (1) the font-size select "holds always the word default" — picking never applies, select never reflects it; (2) Save 422 "Check the highlighted fields" with the story editor visibly non-empty.

## Root causes

- **Font-size (confirmed in installed core dist):** `setFontSize` = nested chain (`chain().setMark(...).run()` dispatches immediately); with a COLLAPSED caret the mark is only `state.storedMarks`, and the OUTER chain's `focus()` transaction (storedMarks captured null at chain creation) then dispatches and WIPES it → `getMarkAttributes` → `{}` → Default. Stored marks never touch visible text anyway.
- **Save (systemic + unknown):** the §42.4 `fieldErrors` map exists but NOTHING consumes it (ReportNew read the dead `error.data.details`) → "Check the highlighted fields" highlights nothing app-wide. The empty-`content` 422 itself: `getContent()` returns `""` only with a falsy ref'd editor or an empty doc — NOT statically pinned → temporary diagnostics added, removed after the user's repro.

## Phases

- **A** MuiEditor: paragraph-scope onChange (setTextSelection to `$from.start()..$from.end()` in the same chain; all four branches; setMark fallback keeps the scope) · `fieldError` prop (error.main border both variants + caption line) · temp diagnostics (mount schema audit, getContent empty read, run() result)
- **B** StepTranscription: `storyError` state · local pre-validation (empty → "Write the story before saving", no request) · `fieldErrors.content` mapping · clear on edit/save/revert/transcribe/candidate · temp save-block diagnostic
- **C** TranscriptionCard fieldError pass-through
- **D** CorrectionDialog: `instructionError` + InstructionField `error`/`onClearError` (frame + helper text) · apply contract RETHROWS so the dialog can map `fieldErrors.instruction` · close resets the highlight
- **E** ReportNew `applyServerDetails` reads `error?.fieldErrors` (normalized shape)
- **F** verify: lint 0 · build 0 + rm dist · smoke 56/56 · gates · mirrors: spec §46.16/§53.5/§54.2/§52.10 + findings F61 + progress
- **G** user repro: font-size visible apply + select reflection; save highlight; diagnostics console output reported back → then remove the temp diagnostics
- **I** commit + push — only on explicit user approval

# Round-8.3 plan: the four round-8.2 defects (F62)

## Goal

User's round-8.2 test results: (1) "Write the story before saving" with visible text; (2) Apply correction REPLACES the editor content with the correction text; (3) SUCCESS toast reads "Something went wrong — please try again"; (4) font-size selector still doesn't work.

## Root causes (all confirmed)

- **(1) The ref never reaches the editor:** `StepTranscription.surfaceRef` was never passed down — `TranscriptionCard` owns a SEPARATE ref; every boundary read = `undefined` → `""` (the ORIGINAL eternal-422 bug; round-8's `??`→`||` was cosmetic).
- **(2) Mock fidelity break:** `correctContentHandler` returned the instruction's first line as `content` — §35.5 requires the FULL corrected snapshot.
- **(3) Normalization gap:** `normalizeResult` drops the envelope `message`; `result?.message` fell back to the generic error copy on success toasts.
- **(4) Nested-chain defect:** the extension's `setFontSize`/`unsetFontSize` dispatch against the CURRENT (collapsed) state before the outer chain's selection applies; the outer dispatch wipes the stored mark. The round-8.2 paragraph scope was structurally ineffective.

## Phases

- **A** TranscriptionCard: accept the step's `ref` (React 19 plain prop), drop its own `surfaceRef`, forward to MuiEditor; StepTranscription passes `ref={surfaceRef}`
- **B** MuiEditor font-size onChange: paragraph expansion + core `setMark("textStyle", { fontSize })`/`unsetMark("textStyle")` in the SAME outer chain; remove the command-consulting branches
- **C** TOAST_CATALOGUE.transcription.saved/reverted (§11.5/§60.6); handleSave/handleRevertToOriginal use them; remove `result?.message` reads
- **D** transport.js: `buildCorrectionCandidate` (deterministic §35 mirror — full story + verb-dedup/case-FE move, ± verbatim, unchanged-with-reason when absent); correctContentHandler returns it; remove dead `escapeHtml`
- **E** remove all round-8.2 temp diagnostics (grep gate)
- **F** verify: lint 0 · build 0 + rm dist · smoke 56/56 · CR/console gates · mirrors: spec §46.16/§53.5/§54.3/§60.6/§66.10 + findings F62 + progress
- **I** commit + push — only on explicit user approval

# Round-8.4 plan: raw-dispatch font-size + text-empty boundary read (F63)

## Goal

User reports after round-8.3: (1) with TEXT in the editor, picking a font size "focuses on the text" instead of setting the font; (2) save persists even with NO text in the editor.

## Root causes (both confirmed)

- **(1) The paragraph expansion SELECTS the paragraph** — the round-8.2/8.3 `setTextSelection` to the enclosing paragraph is the visible "focus on the text"; the size UX is broken even when the mark applies underneath. Fix: raw transaction (`tr.addMark($from.start(), $from.end(), mark)` / `removeMark`) that NEVER changes the selection; empty paragraphs (start === end) take the stored-marks path with a new `fontSizeIntent` `selectionUpdate` re-assertion (selection transactions wipe `storedMarks` — the "always Default" snap; guarded to empty paragraphs, no loop).
- **(2) `<p></p>` is truthy** — an empty TipTap doc serializes as `<p></p>`, passing both `.trim()` guards and persisting empty saves with a success toast. Fix on both sides: `getContent()` returns `""` when the doc has no text; `handleSave` restored to `??` (the round-8 `||` would resurrect the stale draft after a full delete); mock `updateContentHandler` guards on STRIPPED text (shared `stripTags`).

## Phases

- **A** MuiEditor: raw-transaction font-size onChange (text case addMark/removeMark; empty case setStoredMarks) · `fontSizeIntent` state + `selectionUpdate` re-assertion effect · text-empty `getContent()` · ref JSDoc update · TEMP console.debug diagnostic (removed after user confirmation)
- **B** StepTranscription: `??` restore in handleSave (comment documents the supersession)
- **C** mock: module-level `stripTags` helper (shared with buildCorrectionCandidate) + text-based updateContentHandler guard
- **D** verify: lint 0 · build 0 + rm dist · smoke 56/56 · CR gate 0 (console gate = 1 expected — the temp diagnostic)
- **E** mirrors: spec §46.16 (raw dispatch + intent), §53.3 (text-empty read), §53.5 (`??` supersession), §66.10 (stripped-text guard) + findings F63 + progress
- **F** user repro: font-size on a text paragraph — text resizes, NO selection highlight, label shows the size; empty paragraph — label shows the size, typing gets it; empty save — blocked with the highlight + helper text; report the console line from the temp diagnostic
- **I** commit + push — only on explicit user approval

---

## Round-8.5 (F64)

- **Goal:** user reports after round-8.4 (hard reload CONFIRMED): (1) font-size does nothing at all now (no highlight, no size, label stays Default); (2) delete all text → click outside → the text fills back in; remove text → save → instead of an error the removed text is saved. (User's earlier instruction: "log them to be fixed".)
- **Root cause — ONE mechanism, statically proven (no diagnostic needed):** `handleDirtyChange` recreated every render → `applyExternal` recreated every render → the MuiEditor seed-sync effect re-ran on every parent re-render → `value !== editor.getHTML()` (true for ANY divergence, including a just-applied font mark) → re-seed from the STALE `value` wiped the mark in the same tick (issue 1 — round-8.4's raw dispatch applied fine; the re-seed undid it; 8.2/8.3 only appeared to work because the paragraph highlight survived) and REFILLED deleted text on blur (issue 2a). Issue 2b is separate: the save read `?? storyDraft` — storyDraft is set on every save → `"" ?? storyDraft` resurrected the old content, saved it, and the refetch re-seeded it.
- **Fixes:** A) StepTranscription `handleDirtyChange` → `useCallback([], …)` (stable identity; §53.3 seed-sync stability rule); B) save read → `?? ""` (draft never a save source; §53.5 supersession); C) remove the round-8.4 temp console.debug (mechanism proven); D) verify lint 0 · build 0 + rm dist · smoke 56/56 · console gate 0 · CR gate 0; E) mirrors: spec §53.3/§53.5 + findings F64 + progress; F) user repro: deleted text stays deleted on blur, empty save blocks with the highlight + helper — font-size on text resizes (no highlight, label shows size); I) commit + push — only on explicit approval.
- **OUTCOME:** user repro after round-8.5 — the font-size selector STILL does not apply a size → the font-size defect is **NOT fixed and deferred to round-8.6** (owner directive; registered OQ-010 in §69). The seed-sync stability fix stands as a mechanism fix only; the empty-save block and the deleted-text persistence are pending user confirmation. Commit + push executed on approval (close-out commit, font-size flagged open).

---

## Round-8.6 (OPEN — font-size selector)

- **Open defect (F64/OQ-010):** the MuiEditor toolbar font-size selector still does not apply a size after rounds 8.2–8.5 (user repro; hard-reload confirmed every round). Fixed so far (all stand as mechanism fixes): nested-chain stored-mark wipe (8.3), paragraph-selection UX (8.4 raw dispatch), churning seed-sync re-seed (8.5, §53.3 stability rule). The remaining cause is UNKNOWN.
- **Start here, in order:** (1) confirm the served module on the dev server is the current `MuiEditor.jsx` (curl `http://localhost:3000/src/components/reusable/MuiEditor.jsx` — grep for the raw `tr.addMark` dispatch); (2) re-add the `[MuiEditor] fontSize dispatch` diagnostic console line and have the user paste it while picking a size on a text paragraph; (3) only then touch the implementation. No static analysis alone.
- **Definition of done:** picking a size on a text paragraph resizes it (no selection highlight; label shows the size); empty-paragraph pick lands on future typing. Mirrors + verification + commit per the usual gate.

---

## Round-report-step (F65)

- **Goal:** replace the StepPlaceholder with the real §52 report step — the generation act, the persistent report-body editor (MuiEditor host #2), the completed final-report surface with §58 print/export actions, and the missing Edit-mode route. Owner decisions: 4 steps kept (spec amended); Edit mode included; export = menu + Print + TXT now (XLSX/CSV disabled); extraction + refactor (no second implementation).
- **Phases:** A) constants — `WIZARD.report.*`, `TOAST_CATALOGUE.report.saved/reverted`, export chrome; B) extraction — `useEditorHost`, `useCorrection`, `EditorFooter`, `CorrectionOpener` + StepTranscription refactor (smoke 56/56 gate); C) `StepReport` + `GenerateCard` + `ReportBodyCard` (+ ± strip/toggle + stale-latest notice) + ReportNew wiring (nextLabel Create/Finish, finish via ref, busy gate); D) Edit mode — route row, params/load/prefill, status-matched entry (draft/audio_attached→0, transcribed→2, reviewed→1, completed→3), supervisorName field + payload + mock create validation; E) export — `print/ReportPrint.jsx` + menu + TXT; F) strip `BR-`/`CR-` references (18 sites, plain language); G) verify — lint 0 · build 0 + rm dist · smoke 65/65 ALL PASS · console 0 · `CR-|BR-` 0 · mirrors (spec §11.5/§15.5/§31.2-1/§41.3/§52.2/§52.3/§52.8/§58.2/§66.10/§69 C1–C10+F65 + StepNavBar/ReportNew docstrings; §69-recorded) · commit+push gated. **P7 blocker found + fixed:** two new generate assertions failed because `createReportHandler` minted `_id: r-${counters.digest}` WITHOUT incrementing — every create before a digest op reused the same id, duplicating rows and letting later writes resolve against the FIRST (stale) row; fixed with `counters.digest++` (recorded at §66.10).
- **Definition of done:** Add flow: transcription Next → the generate desk → Generate → the report body appears (editable, corrections open, ± strip, footer) → Create saves-if-dirty and navigates to the report details. Edit flow at completed: the final-report surface with Print/TXT export; XLSX/CSV disabled affordances. Font-size (OQ-010) untouched.
- **P7 status: COMPLETE** — all phases A–G done and verified (smoke 65/65, lint 0, build 0 + dist deleted, console 0, CR/BR gate 0, mirrors recorded in the spec + §69). P8 (commit + push) still gated on explicit user approval.

---

# Implementation & Re-implementation (standing effort, started 2026-08-18; reoriented 2026-08-19)

## Goal

Implement the backend from the corrected specification (Stage 4, §15.4, phase by phase per §66.9) with Postman-like endpoint tests until all green (backend only); after backend completion only (hard gate, owner directive 2026-08-19), re-implement and link the frontend (Stage 5, corrected spec as the sole behavioral input). The correct-the-spec-then-rebuild correction phase is CLOSED: 51/51 DERIVED sections dispositioned, §63.9 audit C1–C6 green, §69.3.3 record, commit `7fb1580` — the coverage register below is the closed inventory.

## Next Step

**Pass 3 (frontend §41–§60) IN PROGRESS (2026-08-19) — SPEC-ONLY SCOPE.** The pass-2 close-out commit is executed (`f7ac528`). The pass-3 front-load: owner-directed exhaustive UI/UX design work ("for all pages just like you did for dashboard pages, make an exhaustive analysis and make each page UI/UX astonishing") produced the 15-surface analysis + diagrams (identity = "the supervisor's field notebook"; ledger band, sign-in sheet, intake sheet + name-reveal, date-stub index, document masthead, pre-printed form, registry signboards, ID card, margin-notes chat, ruled index) — owner approved the full pass-3 plan ("proceed, don't do 6. Git protocol (§9.8)"; branch `spec-correction`). **Freeze correction (owner, 2026-08-19): the plan approval does not authorize `backend/*` or `client/*` edits — the freeze stands; pass 3 is SPEC-ONLY.** Two client files touched in R2 were reverted (`git restore`); the register rows below record spec amendments only. Spec amendments applied: §43.2 per-surface identity + Amharic-moment + data-presentation rules; §46.17 MuiStatCard usage note; §48.3 sign-in sheet; §48.4 intake sheet + name-reveal; §49.1/§49.2/§49.3/§49.6/§49.7 ledger band; §50.4 date stub + §50.5 file-tab notch; §51.2 masthead; §52.4 pre-printed ስም; §55.2 margin notes; §56.3/§56.5/§56.7 signboards; §57.3 ID-card face; §59.2 ruled index; §44.6 KPI-card reference fix (same-change discipline with §49.2); §69 OQ-014. **Audit reads completed (2026-08-19): §41/§42/§44/§45/§47/§53/§54/§58/§60 audited-no-change (F80) — the register is 20/20 dispositions, zero partials; pass 3 CLOSED on its section list.** Frontend implementation of the amended directions is deferred to Stage 5 (frontend linking) after the Stage 3 hard gate — backend-first per Stage 4. NEXT: pass-3 close-out report + commit request (explicit owner approval required). No commit/push without explicit owner approval. **[2026-08-19 — PASS-4 STATUS] Pass 4 (cross-cutting §67/§68) is IN PROGRESS — SPEC-ONLY.** Owner directive: "do it exhaustively and Read, understand and respect AGENTS.md findings.md progress.md prompt.md README.md task_plan.md" — executed in full; plan approved ("proceed"). Citation-verification sweep completed: every §67 control citation re-read at its owning section (§16.5, §27.3, §31.8, §33.7, §36.6, §55.3, §34.6, §40.4/§40.5, §24.2, §19.2, §46.6, §63.6, §26.2/§26.6, §62.3, §13.5) + §68.4 maxima greps (BR-19 / ADR-038 / OQ-014 / A6 / G9 / F9 / D5 / SC-8) — all confirmed. Corrections applied: §16.5 stale "fuses the succeeded chunks" line → §33.7 semantics (owning-section-first); §67.2 register re-derived (R-1 paid-policy residual, R-3 no-partial-merge residual, R-4 `.retryAfter`+OQ-011, R-13 verified cites, R-14 §26.2/§26.6, R-15 §31.8+§36.6 409, R-17 no-backups §65.6 + §62.3 commit-order, R-20 verified; **four unregistered risk classes added as R-22 credit exhaustion / R-23 Ethiopian-calendar conversion / R-24 STT accuracy / R-25 addisai SDK dependency** — each citing only existing controls); §67.3 credit-exhaustion standing mitigation; §67.5 cross-section mirrors; §68.3 corrected (Visit main-locked [0], "Wizard steps 1–5" → four steps, Candidate→save "(round-6)" token removed) + 10 backfilled rows + backfill note; §68.5 mirrors. NEXT: pass-4 close-out report + commit request (explicit owner approval required). **[2026-08-19 — commit request DECLINED by owner ("No commit yet") — working tree held as-is (pass-3 + pass-4 sets uncommitted).] NEXT: Stage 3 — the §63.9 C1–C6 single-run audit + §69 zero-`TODO(open)` reconciliation; Stage 4 (backend re-implementation) begins only after the Stage 3 hard gate and an explicit commit approval.** **[2026-08-19 — STAGE 3 CLOSED. The §63.9 single-run audit executed (owner-approved plan + two C2 dispositions "keep as manifest"/"keep as deletion record"): C1 zero unresolved (3 stale cites fixed — §21.5 ×2 retargeted to §58/§37, §4.10 reworded; 7931 cites vs 654 headings), C2 nine editor.md provenance citations pruned + the two sanctioned tokens kept, C3 §24A TOC entry added (70/70 anchors resolve), C4 green, C5 one dangling pointer fixed (§30.2), C6 sign-off record appended as §69.3.3; `TODO(open)` zero-marker reconciliation green; register reconciled 51/51 zero partials. NEXT: Stage-3 close-out report + commit request (explicit owner approval required), then the §9.8 branch lifecycle (new re-implementation branch; `spec-correction` deleted — gated) and Stage 4 (backend-first, freeze lifts after the gate).]** **[2026-08-19 — Stage-3 commit request DECLINED by owner ("No commit yet") — the full correction set (pass 3 + pass 4 + Stage 3) remains uncommitted in the working tree. The Stage 3 hard gate is satisfied; Stage 4 (backend re-implementation, §15.4) waits on an explicit commit + branch-lifecycle approval.]** **[2026-08-19 — COMMIT EXECUTED on owner's "only commit": `7fb1580 chore: spec-correction pass 3-4 and stage 3 close-out` (spec + task_plan + findings + progress; no push; no branch lifecycle; Stage 4 not started).]**

**[2026-08-19 — EFFORT REORIENTED TO IMPLEMENTATION & RE-IMPLEMENTATION (owner directives).]** The correction effort is CLOSED (51/51, C1–C6 green, §69.3.3, commit `7fb1580`). This effort now runs as implementation & re-implementation with the strict protocol chain: Phase protocol (§66) + specs (`.opencode/plan/*`) + skills (`.opencode/skills/*`) + AGENTS.md + findings.md + progress.md + task_plan.md → role agent = Supervisor + Software Architect/Engineer/UI-UX + Design Lead ⇒ implementation ⇒ Postman-like tests until all green (backend only) ⇒ phase-protocol step 5 (backend only: request to run the script to test and verify) ⇒ document ⇒ phase-protocol step 6 ⇒ ready for the next. **Hard gate (owner directive 2026-08-19): unless the backend is completed, the frontend is never re-implemented.** NEXT: Stage 4 — backend implementation per §15.4 (frontend frozen), each sub-phase through the flow above; the step-5 gate of every backend sub-phase is the owner's run of the test script to test and verify. Branch lifecycle (§9.8: new implementation branch, `spec-correction` deleted) only with explicit owner approval.

## Stages (status), F75/F76 — owner approved "proceed"):** the contract's 48 endpoints folded into the spec (contract JSON blocks in §26.6/§28/§30/§30.2.1/§31/§32/§33/§36/§37/§38/§39/§40; §28 session/`/auth/me`/`optionalAuth` removals; §57.4 retired; §42.3/§57.6 boot-probe notes; §56.5 rewritten to the detail aggregate; §24A.3 items-path fix; §21.7/§6.10/§6.4/§5 BR-03 kernel C1 applied; §69.3.1 fold record with C1–C8 sign-off; review file DELETED per owner directive; fold-time correction — branch duplicate-name 409 folded away per §30.3/§30.7, no unique index) — **close-out sweep + commit request NEXT**; then Stage 2 pass 2 (backend §25–§40) Supervisor story gate (folded contract = pass input).

## Stages (status)

- Stage 0 — Boot: branch `spec-correction` created; kernel sections read (§1–§10, §13, §61–§66, §69); working files appended. **complete**
- Stage 1 — Kernel classification: 18 KERNEL / 51 DERIVED, borderline calls decided by the Architect (F63); owner confirmed. **complete**
- Stage 2 — Pipeline passes, dependency order: data model (§17–§24A) → architecture & constants (§11/§12/§14/§15/§16) → backend (§25–§40) → frontend (§41–§60) → cross-cutting (§67/§68); step-5 review gate per pass; coverage register (below) is the section inventory. **closed 2026-08-19 — pass 1a closed (+ audit re-pass F74), pass 1b closed (F69–F73), pass 2 closed (2026-08-19, §69.3.2), pass 3 closed (2026-08-19, 20/20 — F78/F80), pass 4 closed (2026-08-19, 2/2 — F81); register 51/51 zero partials**
- Stage 3 — §63.9 audit C1–C6 green; §69 closure records; zero `TODO(open)` without an OQ row; coverage register reconciled 51/51 dispositions, zero partials. **closed 2026-08-19** (single-run audit record §69.3.3; hard gate satisfied; close-out commit `7fb1580`)
- Stage 4 — Backend implementation per §15.4 (§66.9 phase order; frontend frozen). Per-phase flow: implement → Postman-like tests until all green (backend only) → step 5 (backend only: request to run the script to test and verify) → document → step 6 → ready for the next. **NEXT (2026-08-19)**
- Stage 5 — Frontend re-implementation & linking; mock adapter deleted (§66.10 grep gate). **STRICTLY GATED (owner directive 2026-08-19): unless the backend is completed, the frontend is never re-implemented.** **pending**
- Stage 6 — Close-out: §9.7 sweep, §63 gates, DoD, handoff report. **pending**

## Standing rules for this effort

- **Strict protocol chain (owner directive 2026-08-19):** Phase protocol (§66) + specs (`.opencode/plan/*`) + skills (`.opencode/skills/*`) + AGENTS.md + findings.md + progress.md + task_plan.md → role agent = Supervisor + Software Architect/Engineer/UI-UX + Design Lead ⇒ implementation ⇒ Postman-like tests until all green (backend only) ⇒ phase-protocol step 5 (backend only: request to run the script to test and verify) ⇒ document ⇒ phase-protocol step 6 ⇒ ready for the next.
- **Hard gate (owner directive 2026-08-19):** unless the backend is completed, the frontend is never re-implemented — zero `client/*` edits during Stage 4.
- **Per-phase flow (owner directive 2026-08-19):** implement → Postman-like tests until all green (backend only) → step 5 (backend only: request to run the script to test and verify) → document → step 6 → ready for the next.
- Pipeline chain (§66.5): standing instructions → corrected spec as sole behavioral input → reasoning → implementation; spec wins over habits.
- Every derived answer: Supervisor → Architect WH battery → derivation from the §2.3 kernel + the corrected spec and first principles — the codebase and the spec's own claims on the topic are never cited as justification.
- **Role model (owner strict requirement, 2026-08-18):** the agent is the Supervisor AND the Architect/Engineer/UI-UX Designer AND the Design Lead and makes the decisions; the owner is the interaction partner only — review, add/remove, iterative questions, dig, blind spots; never a decision-maker. Nothing waits on an owner decision; preferences/unknowns become §69 OQ rows.
- **User-story gate:** every Supervisor user story is presented to the owner one by one for add/remove before the Architect answers it; the full pass story list is enumerated up front.
- **WH-battery transparency:** every WH question is presented to the owner before answers are derived.
- Underivable → §69 OQ row with `TODO(open)`; never invented prose.
- §66.6 same-change discipline on every change (mirrors: §15 trees, §13 manifests, §14.3 ADR index, §11 constants, §69 records; the 5 controlled files — AGENTS.md, prompt.md, findings.md, progress.md, task_plan.md — corrected in the same change set iff something in them needs correcting).
- Working files: append-only; the correction-era content is kept as the record.
- Git: all branches merged to `main` 2026-08-19 (owner directive) and deleted local + remote — only `main` remains; every commit/push/merge/delete requires explicit owner approval (§9.8 step 5); implementation sub-phase branches from `main` per §9.8.

## Stage 4 — Backend implementation per §15.4 (PREPARED 2026-08-19 — NOT STARTED)

Branch: **merged to `main` 2026-08-19 (owner directive — `merge: stage 4 backend prep (implementation ready)`); only `main` remains**; subsequent Stage-4 sub-phase work branches from `main` per §9.8 (`phase-N-description`). Repo state: P1 foundation exists (`config/env.js`, `utils/constants.js`, `utils/httpStatus.js`); the full §13.3/§13.5 backend dependency set is already installed (`express` 5.2, `mongoose` 9.7, `winston`, `express-validator`, `multer`, `bcryptjs`, `jsonwebtoken`, … — backend/package.json) — **no installs planned** (§66.8; the §16.4 NVIDIA helper is P7-conditional, never proactive). `server.js`/`app.js` absent → `npm run dev` fails until sub-phase 1.

Per-phase flow for EVERY sub-phase (owner directive 2026-08-19): implement → Postman-like tests until all green (backend only) → step 5 (request to run the script to test and verify) → document → step 6 → ready for the next. Verification per sub-phase: `node --check` on every file (§9.7); §66.6 mirrors (§15.4 tree amendments, §11 constants with consumers, §14.3 ADR index, §69 records) in the same commit; Postman-style test scripts + result ledger per §7 (edge-case matrix, all green) recorded in findings/progress; step-5 = the owner runs the test script to test and verify; step 6 (commit) only with explicit owner approval.

| # | Sub-phase | Owning sections | Deliverables (§15.4 tree) | Exit gate |
|---|---|---|---|---|
| 1 | Foundation | §26, §27 | `server.js`, `app.js`, `utils/logger.js` (Winston), middleware chain (helmet/cors/compression/express-mongo-sanitize/rate-limit/cookie-parser/express.json + auth tiers §27/§28), response envelope, error handling (global handler + CustomError), pagination helper, session middleware, health, graceful shutdown, `routes/index.js` registry | boot smoke on :4000; health + envelope + 404 contract; node --check; step-5 script run |
| 2 | Models | §18, §19–§24A | `models/*.model.js` — User, Branch, Report, Audio, Transcription, ChatConversation, Item; §18 conventions (timestamps, transforms, indexes, ONE TTL, session template §27.7) | model syntax + index/TTL declarations grep-verified against §18/§62; node --check |
| 3 | Identity | §28, §29 | `middleware/auth*`, sessions, OAuth stub, `validators/validation.js` harness + rule chains | register/login/refresh/logout/me flows Postman-green incl. refresh-reuse acceptance (§28); 422 field-error shape |
| 4 | Domain APIs | §30–§36 | `routes/` + `controllers/` + `validators/` per domain — branches; reports + §31.4 transition-guard table; audio upload (multer, §32); STT pipeline (+ `utils/wavSplitter.js`, §33); generation (§34); correction (§35); chat (§36) | every endpoint's edge-case matrix green (missing/invalid/empty/oversized/duplicate/unknown-id/unauth/expired-tokens/forbidden-transition/concurrent/pagination/multipart/provider-failure/422/502-503/TTL edges); one transition-guard table |
| 5 | Aggregations | §37–§39 | exports (content surface + Google Docs stub), analytics, search (exactly ONE text index — branches) | aggregate contracts green; search index count = 1 |
| 6 | Seeding & sweepers | §40, §12.5, §62 | `mock/` deterministic seed + wipe endpoints (session-safe, ADR-037); `jobs/sweeper` (single in-process timer, two passes — built here, live retention validation at P7) | seed/wipe deterministic (§40.6); sweeper code passes node --check |

Stage 4 COMPLETE ⇔ §15.4 tree implemented, every endpoint Postman-green (result ledger), backend runs on :4000; then the hard gate lifts for Stage 5 (frontend re-implementation — NEVER before backend completion, owner directive 2026-08-19).

### Stage 4 — FINALIZED EXECUTION PLAN (owner approved 2026-08-19: per-sub-phase branches; hand-rolled allowlist sanitizer; start sub-phase 1 on plan-mode lift)

**Ground-truth audit gaps found (to fix, not assume):**
1. `backend/utils/constants.js` is stale vs corrected §11.4: `REPORT_STATUSES` still the OLD 5-state `['draft','audio_attached','transcribed','reviewed','completed']` → must become 4-state `['draft','audio_attached','transcribed','generated']`.
2. `constants.js` ships the BANNED `ADDIS_AI_BASE_URL` (`'https://api.addisassistant.com'`) — §16.7: "No `ADDIS_AI_BASE_URL` constant exists (removed 2026-08-18 — SDK-internal)". Delete it.
3. Missing constants: `ITEM_TYPES`, `ITEM_STATUSES`, `ITEM_STATUSES_BY_TYPE`, `AI_REASONING_DEFAULT` (`'off'`).
4. **One planned install (correction to the "no installs planned" note above):** `addisai` ^0.2.0 — §13.5 planned dep, entrance gate "P6 transport phase" → installs at sub-phase 4. NVIDIA multipart helper: P7-conditional only, never proactive.
5. Server-side sanitize-on-write (§61.3): **hand-rolled allowlist sanitizer** (owner decision) — no new dependency, honors §66.8; dompurify stays client-only.
6. Ethiopian-calendar month bucketing (§38.5) needs a backend calendar util — §15.4 tree amendment `utils/ethiopianDate.js` (mirror of client logic §6.3/§43.6) in the owning sub-phase commit (§66.6).
7. Env prereqs: MongoDB at MONGO_URI; `backend/.env` with the 5 required secrets + NVIDIA_API_URL; ffmpeg binary for §33 (verify at sub-phase 4).

**Branching (§9.8, owner decision):** per-sub-phase branches from `main`, each merged at its gated close-out: `phase-6-backend-foundation` (exists, = main head, CURRENT) → `phase-6-backend-models` → `phase-6-backend-identity` → `phase-6-backend-domains` → `phase-6-backend-aggregations` → `phase-6-backend-seeding`.

**Sub-phase 1 — Foundation & constants re-sync (§26, §27, §11, §10) — file inventory:**
- `server.js` (bootstrap: env → logger → app → mongoose connect → listen :4000 → sweeper start P6 → graceful shutdown SIGTERM/SIGINT), `app.js` (ADR-035 fixed middleware order: helmet → cors(CLIENT_ORIGIN, credentials) → compression → cookie-parser → express.json → express-mongo-sanitize → rate-limit tiers (global/auth/ai, health exempt) → `/api/v1` mount → 404 → error handler), `routes/index.js` (registry; health route; auth/domain routes added by later sub-phases), `utils/logger.js` (Winston, child labels Server/DB/Auth/AI-*, daily-rotate, no console.log §9.5), `utils/errors.js` (CustomError + errorToEnvelope mapping), envelope + pagination helpers (mongoose-paginate-v2 wrapper, defaults page 1/limit 10/max 100, `docs` key).
- Constants re-sync in `utils/constants.js`: 4-state REPORT_STATUSES; add ITEM_TYPES/ITEM_STATUSES/ITEM_STATUSES_BY_TYPE/AI_REASONING_DEFAULT; delete ADDIS_AI_BASE_URL.
- Endpoints: `GET /api/v1/health` (200, unauth, no DB). Envelope: `{success,message,data}`; errors success:false + user-facing message + data:null; 422 `details:[{field,message}]`; codes via httpStatus names only.
- Exit gate: boot smoke :4000; health/envelope/404 contract; node --check all files; greps (no console.log, one /api/v1 mount, middleware order, constants parity §11.3/§11.4, banned tokens absent). Step 5 = owner runs the test script.
- Test matrix: health 200 shape; unknown route 404 envelope; error-handler mapping (CustomError → its status; unknown error → 500); global rate-limit 429 (16 req/15 min at limit 100 — script bypasses by direct call for tier check or short burst); auth/ai tiers verified in later sub-phases.

**Sub-phase 1 STATUS: COMPLETE (2026-08-19, step 6 executed — commit on `phase-6-backend-foundation`).** Suite PASS=12 FAIL=0 (health, envelope/404, JSON 400, CORS, compression, helmet, global-tier budget→429 + health exempt); `npm run dev` restart-loop fixed (nodemon.json ignores logs/** — verified live) + port freed; magic literals removed (httpStatus.BAD_REQUEST, MONGO_DUPLICATE_KEY_ERROR_CODE); boot fail-fast via MONGO_CONNECT_TIMEOUT_MS=10000 (Atlas MONGO_URI, cold-handshake budget; 5 s failed live); spec amendments in the same change set (§26.4/§27.2 express.json in the fixed chain, §15.4 nodemon.json + scripts/ entries, §11.3 two new rows, §63.10 tool-command responsiveness rule). Deferrals: pagination helper → sub-phase 4, session middleware → sub-phase 3, CastError mapping → sub-phase 2, §61.3 allowlist sanitizer → sub-phase 4.

**Sub-phase 2 STATUS: IMPLEMENTED, suite green — STEP 5 PENDING (2026-08-19).** Branch `phase-6-backend-models` (from `main` 7111844). Seven model files per §15.4 + `scripts/test-02-models.mjs` — **PASS=39 FAIL=0, exit 0, DB-free** (MODEL CHECK lines: path sets vs §N.2 registries, required/defaults/enums vs §11 constants, exact index declarations vs §N.3, TTL singleton §18.3, unique/sparse/partial edges §17.3, transforms id/__v/filePath/password, User hash/fullName/comparePassword, Item per-type validators 16 cases, conversation message 6-field surface). Mongoose 9 facts recorded (F89). Defects fixed in the same set: `'draft'`/`'am'` literal defaults → `REPORT_STATUSES[0]`/`LANGUAGE_CODES.am` (§17.7), `messages` required, user transform deletes `password`. No spec/§11/§15.4 changes needed (tree, constants, deps all pre-existing). NEXT: step 5 = owner live run (`node scripts/test-02-models.mjs`, no server required) → document close-out → step 6 gated commit.

**Verification script contract (§63.10 — owner directive 2026-08-19, terminal-visible):** every sub-phase ships a suite under `backend/scripts/test-<NN>-<name>.mjs` (Node 24 + built-in `fetch`, zero deps). Per check, the terminal shows the request (method + path) and the response status + full JSON body, then a `PASS`/`FAIL` verdict; non-HTTP checks (model/schema, pure-function, sweeper, constants parity) print a labeled `MODEL CHECK` / `UNIT` / `SWEEPER` line with the same framing. Suites end with `PASS=N FAIL=M` and exit non-zero on any failure; scripts use `process.stdout.write` (no `console.log` literal — keeps §9.5/§63.4 grep gates green). Suites group checks per endpoint (`─── <endpoint> ───` section headers) and support `--only=<endpoint>`. Restart the backend before each suite run (in-memory rate store resets on restart; 15-min global window). Step 5 of every sub-phase = the owner runs the suite and watches every request/response JSON + PASS/FAIL live; a sub-phase advances only on a fully green live run. The §15.4 tree carries the `scripts/` entry (amended 2026-08-19); the §63.4 inventory carries the Scripts gate row. **Tool-command responsiveness rule (owner directive 2026-08-19, §63.10):** commands must return promptly — never burn a timeout; prohibited are backgrounding that holds the capture pipe (`nohup … & disown`), `Start-Process` with `-RedirectStandardOutput`/`-RedirectStandardError`, recursive `grep -r` over `node_modules`, and `sleep` > 3 s chains; detached dev servers start via a single redirect-free `Start-Process -WindowStyle Hidden` with readiness verified in a separate quick command; a command that hits its timeout is a failed command.

**Sub-phases 2–6** per the table above (models → identity → domain APIs + addisai install → aggregations → seeding & sweepers), each through the per-phase flow with its edge-case matrix and exit gate.

---

## Coverage register (51 DERIVED sections; per-section status + NEXT pointer)

### Pass 1a — data model [CLOSED] (audit re-pass 2026-08-18, F74: §19.3 two-TTL stale parenthetical → one-TTL doctrine; §17.3 Report—ChatConversation 1—N → 1—1 with `report` unique-sparse key cell + §24.1 gloss aligned; A2 chronology-index / A3 item-index / A4 stt-subdoc verifications → no-change; §17.7/§18.10/§19.8/§20.10/§21.13/§22.10/§23.10/§24.10/§24A.8 grep gates re-run clean)

| Section                    | Status | Disposition                                       | Evidence   |
| -------------------------- | ------ | ------------------------------------------------- | ---------- |
| §17 Data system overview   | closed | re-derived                                        | F65/ledger |
| §18 Data model conventions | closed | re-derived (one TTL, seven-models contract)       | F65/ledger |
| §19 User model             | closed | re-derived                                        | §19 text   |
| §20 Branch model           | closed | re-derived (reference contract, no TTL)           | §20 text   |
| §21 Report model           | closed | re-derived (no content fields, visits[], 1:1 ref) | §21 text   |
| §22 Audio model            | closed | re-derived (report binding, no visit key)         | §22 text   |
| §23 Transcription model    | closed | re-derived (1:1, raw/latest, ADR-030)             | §23 text   |
| §24 ChatConversation model | closed | audited-no-change                                 | §24 text   |
| §24A Item model (new)      | closed | re-derived (per-type status/rating)               | §24A text  |

### Pass 1b — architecture & constants [IN PROGRESS]

| Section                   | Status     | Disposition | Evidence                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------- | ---------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| §11 Constants             | **closed** | re-derived  | S1–S4 — closed 2026-08-18 (15-question battery approved "do them all"; derivations: home boundary env-vs-constants, deep freeze, tolerated-literals whitelist, orphan/phantom sweep discipline, httpStatus completeness + registration gate, mirror-parity gate; `ADDIS_AI_BASE_URL` removed as SDK-internal orphan)                                                                                               |
| §12 System architecture   | **closed** | re-derived  | S5–S9 — closed 2026-08-18 (7-question battery approved "proceed"; 3 corrections: diagram editor "planned"→installed, Addis box "fetch"→"SDK", §12.8 generation params provider-scoped + reasoning; §12.11↔§14.3 parity re-check closed — row 5 aligned with amended ADR-001, no new transport row)                                                                                                                 |
| §14 ADR index             | **closed** | re-derived  | S10 — closed 2026-08-18 (6 stories approved; battery answered inline: status-vocabulary normalization of ADR-008, ADR-001 stale "STT only" clause fixed, no new rows for S12-era decisions — owner prose governs, ADR-024 → OQ-004 pointer verified, §12.11 parity deferred to §12 pass)                                                                                                                           |
| §15 Project structure     | **closed** | re-derived  | S11 — closed 2026-08-18 (5 stories + 8-question battery approved "proceed"; 9-point repo-drift table resolved: useMediaRecorder home/name, report/print placement, reusable additions, sanitizeHtml/wizardValidation/auth-validators nodes, §15.3 authoring-workspace, §58.3 path, §15.6 lines; three-class state legend (scaffold/implemented/planned) + markers applied; MuiReasoningSelect = planned §54 round) |
| §16 AI provider contracts | **closed** | re-derived  | S13 (STT contract) — closed 2026-08-18 (§16.4/§33.4/§33.5/§16.8 corrections); S12 (text generation + addisai SDK + standing reasoning) — closed 2026-08-18 after owner "proceed" (C1–C25: SDK adoption, paid policy, no-correction-schema carve-out, conversation reasoning default, §69 records OQ-011/012/013); REST route audit applied to the reports/AI domain (see Next Step)                                |

### Pass 2 — backend §25–§40 [CLOSED 2026-08-19] (input: the route contract folded into the spec — §26.6/§28–§40 contract JSON blocks; drift register B1–B7 + decision list C1–C8 signed off at §69.3.1; pass plan 18 stories + WH battery W1–W9 owner-approved "proceed"; corrections record at §69.3.2)

| Section                | Status | Disposition        | Evidence              |
| ---------------------- | ------ | ------------------ | --------------------- |
| §25 Mock data rules    | closed | audited-no-change  | F1–F18 register read  |
| §26 Entry & app        | closed | re-derived (F9)    | §69.3.2               |
| §27 Envelope/tiers/errors | closed | audited-no-change  | §69.3.2               |
| §28 Auth & sessions     | closed | re-derived (F8 + profile row, stub gate, refresh-reuse acceptance) | §69.3.2 |
| §29 Validation chains   | closed | audited-no-change  | §69.3.2               |
| §30 Branches            | closed | re-derived (F13)   | §69.3.2               |
| §31 Reports             | closed | re-derived (F1, F11) | §69.3.2               |
| §32 Audio               | closed | re-derived (F12, F15) | §69.3.2               |
| §33 Transcription       | closed | re-derived (F14)   | §69.3.2               |
| §34 Generation          | closed | re-derived (F6, F11) | §69.3.2               |
| §35 Corrections         | closed | audited-no-change  | §69.3.2               |
| §36 Chat                | closed | re-derived (F2, F3, F17) | §69.3.2               |
| §37 Export              | closed | re-derived (F7)    | §69.3.2               |
| §38 Analytics           | closed | audited-no-change  | §69.3.2               |
| §39 Search              | closed | re-derived (F4)    | §69.3.2               |
| §40 Mock endpoints      | closed | re-derived (F5, F10) | §69.3.2               |

### Pass 3 — frontend §41–§60 [IN PROGRESS 2026-08-19 — SPEC-ONLY (freeze); owner-approved plan, no commits]

| Section | Status | Disposition | Evidence |
| --- | --- | --- | --- |
| §41 Routing & guards | closed | audited-no-change | §41 read (P3 delivered; §41.5 state.from/expiry verified) |
| §42 Network layer | closed | audited-no-change | §42 read (reauth, envelope, tags delivered P3) |
| §43 Design language | closed | re-derived | pass-3 UI/UX front-load — per-surface identity, Amharic-moment rule, data-presentation rule (F78) |
| §44 Component system | closed | audited-no-change | §44 read (tokens/cards/charts delivered) |
| §45 Layout & responsive | closed | audited-no-change | §45 read (5 buckets applied per surface) |
| §46 Component inventory | closed | re-derived | §46.17 MuiStatCard usage note (ledger band supersedes the dashboard row) |
| §47 Shells | closed | audited-no-change | §47 read — the §47.4 selected state already reads as the raised file tab (§43.2); search entry + Ctrl+K already specified (§59.2) |
| §48 Auth pages | closed | re-derived | sign-in sheet + intake sheet + name-reveal (OQ-014) |
| §49 Dashboard | closed | re-derived | ledger band supersedes the four-card row (cell bucket matrix, gates) |
| §50 Reports list | closed | re-derived | date stub (grid) + file-tab notch (card) |
| §51 Report details | closed | re-derived | masthead + filing stamps |
| §52 Wizard | closed | re-derived | pre-printed ስም line |
| §53 Editor components | closed | audited-no-change | §53 read (round-8.5/8.6 contract stands; OQ-010 open) |
| §54 Correction modes | closed | audited-no-change | §54 read (round-7/8 contract stands) |
| §55 Chat | closed | re-derived | margin-notes panel + ቀን serif header |
| §56 Branches | closed | re-derived | signboard cell (Location merged into the name subline) + signboard header |
| §57 Profile | closed | re-derived | ID-card face |
| §58 Exports | closed | audited-no-change | §58 read (print + TXT/XLSX/CSV + OQ-006 naming closed) |
| §59 Search + 404 | closed | re-derived | ruled index (serif key text); 404 audited-no-change (§59.4 stands) |
| §60 Toasts/states | closed | audited-no-change | §60 read (toast protocol delivered P3) |

Implementation of the amended directions: **deferred to Stage 5** (frontend linking) — the freeze stands until the Stage 3 hard gate; backend re-implementation comes first (Stage 4).

### Pass 4 — cross-cutting §67/§68 [IN PROGRESS 2026-08-19 — SPEC-ONLY (freeze); owner-approved plan, no commits]

| Section | Status | Disposition | Evidence |
| --- | --- | --- | --- |
| §67 Risks & Mitigation | closed | re-derived | citation-verification sweep + register re-derivation (R-1…R-25; R-22…R-25 new) |
| §68 Glossary | closed | re-derived | row corrections (Visit main-locked, wizard four steps, Candidate token) + 10 backfilled rows + maxima re-verified |

§16.5 (owning-section-first) corrected in the same change: the stale "final transcription fuses the succeeded chunks" line → the §33.7 no-partial-merge semantics.

51/51 dispositions (18 KERNEL untouched; Stage 3 audit C1–C6 + zero-`TODO(open)` reconciliation NEXT, then backend-first re-implementation).

---

## Stage 2 pass 1 — data-model correction set (owner-approved plan; **COMPLETE**)

### Goal

Apply the owner-approved 2026-08-18 correction set to the spec + mirrors: 4-status machine, one-report-one-branch + positional `visits[]`, single Item collection (§24A), 1:1 Transcription, digest/tombstone retirement, seven schemas.

### Next Step

Checkpoint commit executed on approval (2026-08-18). Next: pass 1b (architecture §11/§12/§14/§15/§16 — coverage register above), then pass 2 (backend §25–§40) after the pass-1b gate.

### Work done

- **Kernel passes 1–2 (earlier sessions):** §5 BRs, §6.3/§6.4/§6.10 rewrite + §6.11 retired pointer, §11.4/§11.5, §9.3/§12.11-1 routes, §17 (seven entities), §18 (one TTL), §20/§21/§22/§23/§24A/§31/§32.
- **Pass-1 rewrites:** §33 STT (1:1 merged Transcription, re-transcribe same-row rewrite, frozen at `generated`, no per-clip accept, endpoints matrix), §34 generation (writes `latest` + Item rows in one atomic session; `transcribed → generated` terminal; regen only from `transcribed`; chain addis→gemini→nvidia), §35 corrections (Mode-1 at every status incl. `generated`; candidate = editable draft, no accept; corrections never touch Item rows; revert pre-`generated` only), §37 export (`{content: latest, date, branchName, visits}`; `generated` not required), §38 analytics (`{reportsThisMonth, inProgress, generated, activeBranches}`; four-slice statusDistribution; activityByBranch via `$lookup`; `GET /analytics/items` reads Item rows only), §39 search (exactly ONE text index — branches; reports matched by `$in` on resolved branch ObjectIds).
- **Touched throughout:** §1.4/§1.5, §2.4 SC-4, §3.1.2 F3/F4, §3.2.3, BR-18, §8.5, §12.4 canonical sequence, §15.4 comment, §18.4/§18.10, §24.4/§24.5/§24.10, §25 mock rules + fixture inventory, §27.5/§27.7, §28.5/§28.6, §29.3 (visitNo out, ITEM\_\* in), §30.1/§30.4/§30.5/§30.7, §40 fixture keys, §43.2/§44.3, §45.3, §46.12 (MuiFileInput)/§46.13 (4-status badge)/§46.17 (MuiRecorder + MuiRegistrationValue), §49.2/§49.3/§49.4, §50.4/§50.5/§50.6/§50.8, §51.1–§51.7 (full rewrite), §52.3–§52.10, §53.2/§53.5/§53.6, §54.2/§54.3/§54.4/§54.6, §55.4/§55.5, §56.3/§56.5/§56.6, §57.3, §58.1–§58.5, §60.5/§60.6, §61.3, §62.1–§62.9 (sweeper: reference check for branches, ONE TTL), §63.4/§63.6, §67 R-17, §68 glossary table, §69 (OQ-001/005 records fixed + pass-1 record + mock-DTO deferral OPEN), §14.3 ADR-005 row.
- **Mirrors:** `client/src/utils/constants.js` (REPORT_STATUSES 4-member, labels, ITEM_TYPES/ITEM_STATUSES/ITEM_STATUSES_BY_TYPE added, `report.completed` toast removed), `client/src/components/reusable/MuiStatusBadge.jsx` (color map 4 states, generated → primary), `.opencode/plan/phase-6-backend-apis.md` (L38 digest ref → corrected contract).
- **Deferred (flagged in §69, mock-DTO alignment OPEN):** `client/src/mock/*` + the non-mock client flows that consume old DTO shapes (audioEndpoints visitNo URLs, ReportNew/StepReport status branches, ReportPrint payload, wizardValidation supervisorName, searchEndpoints comment) — re-aligned with the §52–§58 linking rounds; mock dies at P7.
- **Verification:** `node --check` n/a (no backend changes); client lint 0 on edited files; `npx vite build` 0 errors + `dist/` deleted; final grep sweeps clean (visitNo/tombstone/digest/accept/TTL-count/status vocabulary — remaining hits are negations, retirement text, or historical records).

### Phase H (commit)

- [x] Single commit executed on explicit owner approval (2026-08-18) — `chore: phase 4 owner-corrections` (spec + constants + MuiStatusBadge + phase-6 plan file + the 5 controlled files; excludes mock re-alignment; no push).
