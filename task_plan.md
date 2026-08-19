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
