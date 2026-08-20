# Findings — Wizard steps 1–3 round (F38+)

## F38 — Owner amendment: two-payload creation (supersedes §4.10/CR-064)
- User directive: step-1 Next creates the report (metadata + visits) → `draft`; step-2 Next attaches the takes → `audio_attached`; step-3 transcribes → `transcribed`.
- Spec §52.11 already says error-on-create stays on step 1 — creation moves to step-1 Next, aligning the code with the spec verbatim.
- Contract amendments: §4.10 two-payload flow; §5 intro/CR-076 `audio_attached → transcribed`; new CRs: attach act (failure preserves takes, stays on step 2), voice-ledger design rows.

## F39 — Flow facts (verified in code)
- `createReportHandler` (transport.js:646) requires audios ≥1 (679-682) — must drop (create = metadata only). `uploadClipHandler` (1066): fabricates `durationSec` (1094) and flips `draft → audio_attached` on first clip (1101-1105) — flip kept for the attach act.
- `transcribeReportHandler` (1198): rows carry the `± ±` double-prefix blemish (1223-1224); status flip only from `audio_attached` (1234-1238) — correct for the new flow; per-clip latency needed for the pulse. `reTranscribeHandler` (1247): same blemish (1261); reviewed-rewind kept.
- `correctContentHandler` (938) is a stub (returns `changed[]`, persists nothing); Mode-2/3 Accept/Revert have NO endpoints — mock must gain `POST /reports/:id/correct/accept` + `/correct/revert` (§31.6/§54.5 shape).
- `revertContentHandler` (974) errors when `raw` is null (`!report.raw`) — pre-generation single-undo needs `latest → null` restore.
- `updateVisitsHandler` (780) validates ≥1 visit (759) — must tolerate empty visits (CR-043, same tolerance as create).
- `deleteClipHandler` (1169): last-clip rewind `transcribed → audio_attached`, `audio_attached → draft` — covers step-2 deletes after attach.
- `MOCK_TRANSCRIPTIONS` (fixtures.js:829) = plain Amharic without ± — the STT-output convention; ± belongs to generated content only.

## F40 — Data model decision (Mode-1 target)
- The transcription step's story IS the report `latest` slot (§53.2 "transcription review segment"): pre-save the story = client-joined per-take `raw` texts; Mode-1 Save = `PATCH /content` (report.latest); `raw` untouched (BR-11); Revert restores `latest → null` (original story) pre-generation.
- Generation must honor a corrected story (CR-081) — mock `generateContent` change deferred to the report round.

## F41 — Correction endpoints (mock, §31.6 shape)
- `POST /reports/:id/correct` (existing): stages — stores `report.stagedCorrection`; voice mode reads the `clip` file from formData → deterministic canned Amharic instruction (documented mock limitation); reason vocabulary kept (existing regex).
- `POST /reports/:id/correct/accept`: merges staged → `latest` (deterministic: changed content replaces the first story sentence), clears staging.
- `POST /reports/:id/correct/revert`: discards staging.
- Client hooks in reportsEndpoints (`useAcceptCorrectionMutation`, `useRevertCorrectionMutation`), invalidating the report tag; `useUpdateVisitsMutation` added for step-1 re-entry writes.

## F42 — Design: the Voice Ledger (owner-approved)
- Ledger surface: one hairline-ruled surface (1px divider borders, radius 2, paper), rows separated by hairlines; header eyebrow `TAKES` + `n/m` tabular count.
- Number disc = RecordOrb's armed disc treatment at 28px (solid orange[400], white 700 tabular); listening pulse = orb `pulseRing` keyframes tightened (spread 12px, 1.4s); failed = error-tone disc + `!` + "Couldn't transcribe this take" + Retry.
- Story: divider "The day's story" (the audio step's Narrations divider, one level up) + one continuous content-stack passage (17-18px, leading 1.9-2.0, ragged right) + the reveal (300ms fade/rise on last take heard — the orchestrated moment); ± strip (token chip + §35.3 copy) when ± present.
- Mode chips: segmented "Edit / Instruction / Voice" (Edit default per §54.7); Mode 1 = story becomes MuiEditor (in place, toolbar Bold/Italic/Font size/Text color) + Save + "Revert to original"; Mode 2 = instruction panel + Submit → Corrected-strip (PROPOSED CHANGE + reason verbatim + Accept/Revert); Mode 3 = recorder strip (useMediaRecorder, auto-submit on stop) → "Transcribing your instruction…" → same strip.
- Motion: one signature (walking pulse), one reveal, one settle; reduced-motion honored. A11y: aria-live per take ("Take {n}: transcribed").
- MuiAudioPlayer gains a `compact` prop (disc + duration caption, no progress bar) for ledger rows.

## F43 — MuiEditor (§46.16 contract)
- TipTap + dompurify; props `value/onChange/readOnly/minHeight/id`; toolbar Bold/Italic/Font size/Text color (ADR-038); sanitize on write AND render; readOnly hides toolbar; Ethiopic content-stack typography through the editor.
- OQ-007 closed: `raw` plain text, `latest` rich HTML (de-facto fixture/mock convention) — spec amendments in the same commit (§46.16 row, §21.2, §61.3, §69, §13.4/§13.5, §15.5).

## F44 — Wizard orchestration (ReportNew)
- `reportId` page state; step-1 Next: validate → create (no audios) → setReportId → advance; re-entry posts PATCH date + visits; 422 details → `setError` mapper (date/clockIn/clockOut/branch/visits); 502 → toast, stay.
- Step-2 Next: per take still staged (no `attached` flag) → `uploadClip` FormData `{stagedClipId}` (mock rebind path); partial failure → bound stays, rest stay staged, toast "The takes could not be attached — they are kept", stay.
- Close: reportId exists → navigate directly (no dialog, §52.11); else confirm dialog. Step 4 stays the placeholder.

## F45 — Mock STT pool (transport.js-local)
- Deterministic plain-Amharic sentence pool per clip order; re-transcribe returns an alternate sentence; no ± in STT output. Per-clip async latency (the walk is visible). Mock limitation: per-take deterministic failure not implemented — global `seedError(502)` marks all pending failed.

## F46 — Files (new)
- `components/report/StepTranscription.jsx`, `TranscriptionTakeRow.jsx`, `StorySection.jsx`; `components/reports/edit-content/EditContentSurface.jsx`, `correct-instruction/InstructionPanel.jsx`, `correct-voice/VoiceCorrectionPanel.jsx`, `corrected-strip/CorrectedStrip.jsx`; `components/reusable/MuiEditor.jsx`.
- Additive: `MuiAudioPlayer` (compact), `StepNavBar` (nextLabel), reportsEndpoints (+3 hooks), constants (WIZARD.transcription, WIZARD.modes, toasts), package.json (+6 deps).
- Mock: transport.js (create gate, stagedClipId rebind + real durationSec, plain STT pool + per-clip latency, correct staging + accept/revert handlers + routes, revertContent pre-generation, updateVisits empty tolerance).

## F47 — Implementation facts (verified while building)
- **TipTap v3 named exports:** `@tiptap/extension-text-style` and `@tiptap/extension-color` export NAMED only (`TextStyle`, `Color` — the color package is a re-export of the text-style Color mark); the build fails on default imports (rolldown MISSING_EXPORT). v3 text-style bundles `setFontSize`/`unsetFontSize`/`setColor`/`unsetColor` commands natively.
- **No `@tiptap/extension-font-size` package** (ETARGET on install; only a stale `3.0.0-next.3` pre-release) — the v3 TextStyle covers the ADR-038 "Font size" action; recorded in §13.5. Installed set: `@tiptap/react` `@tiptap/starter-kit` `@tiptap/extension-text-style` `@tiptap/extension-color` `@tiptap/extension-placeholder` `dompurify` (placeholder justified by §46.16 "empty (placeholder in report voice)").
- **react-hooks/set-state-in-effect:** the story-draft re-seed effect (`setStoryDraft(storyHtml)`) is lint-banned — replaced by the `storyDirty` derivation pattern (editor value = `storyDirty ? storyDraft : storyHtml`; every persisted write clears the flag).
- **`updateVisitsHandler` empty-branches fallback:** the report row has no standalone main-branch field — fallback uses the pre-write `report.branches[0]` (the create default) else the user's first active branch.
- **Mock transcribe latency:** `transcribeReportHandler` is now `async`; per-clip `await delay()` walks the ledger pulse; a whole-batch rejection (seedError 502) marks all pending rows failed.
- **`toReportDto`** now exposes `stagedCorrection` under `withContent` (the corrected-strip's read path).

## F48 — Verification state (Phase G)
- lint 0 (after F47 fixes); build 0 (`✓ built`); `dist/` deleted. Remaining: dev-server smoke (200s), manual walkthroughs, grep gates.

## F49 — Deferred (report round)
- `generateContent` honoring a corrected story (CR-081) + empty-visits fallback; the ±-token copy stays out of MuiEditor (surfaces own the strip, §53.2 item 3); step 4 (Report) remains the placeholder.

# Findings — Step 2 (Audio) architecture

## Source
- `.opencode/plan/create-report-user-stories.md` §4 (lines 717+, CR-048…CR-065), §4.10 submission payload, §1.2 (Add mode), §1.1 (report created at submission), §1.4 CR-009…011, §1.5 CR-012/013.

## F17 — Flow model (pinned)
- Add mode = steps 1–2; the audio step's **Next** creates the report from "what I actually recorded" and **navigates to the new report's details page** (`/reports/:id`, CR-013). Steps 3–4 later live on the details surface — out of scope here.
- Report does not exist until submission (CR-001/CR-006: "no phantom drafts saved on my behalf"), yet the submission payload carries clip **ids**, never files (§4.10). Files must therefore upload *before* Next, report-less.

## F18 — Staged uploads (D1; spec-silent — no invented details, flagged)
- Transport needs a report-less upload: `POST /audios` (multipart `clip` + `durationSec`) returns the clip DTO with `report: null`.
- `POST /reports` is **replaced** with the §4.10 payload: `{ date (ISO), clockIn, clockOut, branch, visits: [{branch, clockIn, clockOut}], audios: [ids] }`. Old handler (`supervisorName` + `reportDate` only, transport.js:578) has no consumers — the wizard is its first user. It creates the report from Step-1 values, names it from the profile (`user.fullName` — §4.10 "no supervisor name is sent"), binds staged clips (`report`, `visitNo: 1` — the day slot; CR-048 forbids per-visit binding UI, so the binding is invisible transport detail), and leaves no phantom draft on early exit.
- `deleteClip` already works on staged clips: `reportOwnerOrNull(user, null)` → no report → no status transition; transcription splice is a no-op; clips.findIndex by `_id` + user ✓.
- Mock MIME/size gates already exist in `uploadClipHandler` — reuse the same copies in the staged handler (byte-size check: `file.size > AUDIO_MAX_SIZE_BYTES` → 422 with the same message copy; MIME whitelist).

## F19 — Playback seam (D2; spec-silent — flagged)
- Real contract streams `GET /audios/:id/play` (an `<audio>` element fetch — not apiSlice), but the mock cannot serve HTTP and `<audio>` bypasses the apiSlice mock. → new `playAudio` query `GET /audios/:id/play → { url: <dataUri> }`; the mock stores uploaded bytes (data URI) at upload and synthesizes a tiny silent WAV for seeded clips (no bytes stored today — `uploadClipHandler` keeps only type/size/name).
- DTO stays metadata-only (§22.7: no filePath/URL in `toClipDto`).
- Step resolves the URL: dev (`import.meta.env.DEV`) → query result; prod → direct stream URL `${API_BASE_URL}/audios/${id}/play`. Export `API_BASE_URL` from `redux/features/apiSlice.js` so the card doesn't duplicate the base-URL literal.

## F20 — Created-report status (D3; decided: draft — CR-064 literal)
- CR-064: "created as a draft; the status stays a draft until the transcription step". The mock's old `draft→audio_attached` transition on first clip belongs to the resumed/§53/§54 path — keep it there.
- `ReportCard` only renders `MuiStatusBadge` (no status-driven actions) — a draft renders fine in the list.
- Flagged alternative (audio_attached for status-machine consistency) — rejected: spec wins.

## F21 — Recorder (D4)
- Spec orb: centered in the empty canvas; bottom-right once takes exist (CR-065); swells into a ring with live timer + soft pulse while recording (CR-051); orange role (§10.1, themePrimitives `orange` scale).
- `MuiRecorder.jsx` is the small chat strip (error.main, per-visit Add chip, has-take confirm state) — not a fit, currently unused (§55 consumes it later). → new `utils/useMediaRecorder.js` with identical MediaRecorder semantics (getUserMedia → MediaRecorder → chunks → stop builds blob; auto-stop at `AUDIO_MAX_DURATION_SEC`; unmount cleanup; permission error → callback). MuiRecorder untouched (documented consolidation candidate).

## F22 — TakeCard playback (D5)
- Reuse `MuiAudioPlayer` (its states cover loading/playing/paused/ended/error, CR-057) with **additive** `onPlay`/`onPause` props; the equalizer bars (3 bars, orange, animated while playing, CR-056) render from play state. Card = player (flex 1) + take number + re-record + delete.
- Per-take URL resolved by the card itself via `usePlayAudioQuery(clip._id)`.
- Animation via `@emotion/react` `keyframes` (direct dep ✓) + `prefers-reduced-motion` guard.

## F23 — Attach is step-local (D6)
- CR-050 whole-canvas drop + CR-053 *quiet* Attach files. `MuiFileInput.jsx` is a big dashed per-visit dropzone (its target is §53/§54) — not used here. Hidden `<input type="file" multiple accept=…>` + canvas `onDrop/onDragOver` (with drag-over affordance).
- Gates: MIME allowlist (`AUDIO_ALLOWED_MIME_TYPES`), size cap (`AUDIO_MAX_SIZE_BYTES`), duration cap (`AUDIO_MAX_DURATION_SEC` — parsed client-side via a hidden `<audio>` `loadedmetadata`), fingerprint dedupe (name + size, kept in step state) → inline note (CR-053 "skips the same file with a note"). Rejects → toast + inline helpers (CR-054/055).
- Duration-parse detail: `URL.createObjectURL(file)` → `<audio>` → `loadedmetadata` → revoke.

## F24 — Re-record = replace (D7)
- CR-058: "replaces the old take, never an extra upload". Flow: card re-record → orb enters replace mode (hint "Re-recording take N", cancel chip) → stop → upload new (busy) → delete old → swap the card slot. Upload-first ordering protects the take (delete failure leaves the slot swapped, old clip orphaned in-memory only).
- The orb is the only recorder; re-record readies it for replacement.

## F25 — Delete (D8)
- `MuiConfirmDialog` (WIZARD copy) → `deleteClip` → remove card; last take → empty canvas (CR-059).

## F26 — Gating / submission (D9)
- Page owns the form and the takes state (F30); `onTakesChange(clipIds)` keeps the page's id array fresh; Next at step 2 disabled until ≥1 take (CR-063); submit = `createReport` §4.10 payload; success → `navigate(/reports/${_id})`; failure → error toast + stay (CR-046 protocol).
- Payload mapping: `date` → `ethiopianToGregorian` → ISO; times `dayjs.format("HH:mm")`; `branch` = `_id`; `visits` = `[{branch, clockIn, clockOut}]` (client order, main-first); `audios` = clip ids.
- `StepNavBar` gains `nextLoading` (native MUI `loading` on the contained button — `MuiButton` already supports it).

## F27 — Mock create validation (D10; flagged, decided)
- date/clockIn/clockOut required; branch required + active + owned; visits array optional, each `{branch (active, owned), clockIn, clockOut}` — **empty allowed** (CR-043 "whole day at the main branch"; the client gate `validateVisits` already allows it; the old `validateVisitBlock`'s ≥1 rule is relaxed for the wizard path); `audios` ≥1, each owned + `report === null`.
- `report.branches`: visits' branches when visits exist; the main branch when empty (CR-043). `report.visits`: `[{visitNo, branchName, clockIn, clockOut}]` in payload order.
- Status `draft` (F20). `isArchived: false`, content fields null.

## F28 — Peek + progress (D11)
- Count-based only (no client AI — content analysis is server transcription, §5). Dots = take count (CR-060); living hint quietens as takes grow (count-keyed copy).
- Peek (CR-061): MUI `Collapse` panel at the step bottom — `MuiChip` metadata chips (date, main branch, times, supervisor name) + "merged narration of N takes" line, live from `watched` values + takes state.

## F29 — Constants (D12)
- `WIZARD.audio.*`: invitation (title + parts), attach, orb aria/labels, take number, re-record, delete + confirm, replace hint, permission/cap/MIME/size/duplicate copies, progress hint (count-keyed), peek title + narration template, upload-failed copy.
- `TOAST_CATALOGUE.audio.*`: `rejected`, `permissionDenied`, `uploadFailed`, `cap`, `deleted` (exists as `clip.deleted` — reuse).

## F30 — Takes state lives in the page (decided)
- MuiStepper unmounts StepAudio when the user goes back to step 1 (only visited steps clickable; steps 2–3 unreachable pre-creation in Add mode, CR-010). CR-011 "coming back shows exactly what I entered" ⇒ takes (and their upload/delete orchestration) must survive navigation ⇒ the page owns `takes` state; StepAudio is controlled (`takes`, `setTakes`, plus a `ref` for focus/submit as needed). onTakesChange derives clip ids.

## F31 — ReportNew wiring facts (verified)
- `watched = useWatch`, `step1Ready`, `handleNext` triggers step-1 validation + `stepRef.current?.focusFirstError()`, `contentRef` focus on step change, `user` from `useGetMeQuery`, `branchNameOf` helper in page. Current render: `activeStep === 0 ? <StepBasicInfo …/> : <StepPlaceholder …/>`.
- `validateVisits` (wizardValidation.js:63): empty visits → `true` ✓ (D10 client-consistent).

## F32 — Files
- New: `utils/useMediaRecorder.js`, `components/report/RecordOrb.jsx`, `components/report/TakeCard.jsx`, `components/report/StepAudio.jsx`.
- Additive: `MuiAudioPlayer` (onPlay/onPause), `StepNavBar` (nextLoading), `apiSlice` (export API_BASE_URL).
- Wired: `pages/ReportNew.jsx`.
- Endpoints: `audioEndpoints.js` (+uploadStagedClip, +playAudio), `reportsEndpoints.js` (+createReport, invalidates Reports list).
- Mock: `transport.js` (+staged upload, +play route, silent-WAV synth, createReportHandler §4.10 replacement, route entries).
- Constants: `WIZARD.audio.*`, `TOAST_CATALOGUE.audio.*`.
- Same-change discipline (§66.6): constants/endpoints/mock shipped in the same commit.
## F33 — Recorded takes failed to upload (fixed)
- Symptom: every recording ended with the "The take failed to upload — try again" toast; attached files uploaded fine.
- Root cause: Chrome's MediaRecorder emits `blob.type = "audio/webm;codecs=opus"`; `uploadStagedClipHandler`'s gate was an exact-match `AUDIO_ALLOWED_MIME_TYPES.includes(file.type)` → 422 → the step's catch path.
- Fix: `baseMimeType()` helper strips codec params (`type.split(";")[0]`) — the gate accepts the base type and the stored DTO type is the clean base type (§22.7). Applied to the staged handler AND the report-bound `uploadClipHandler` (the same latent bug for the §53/§54 path). Verified lint 0 / build 0.

## F34 — Take-present layout order (round-3 amendment)
- User directive: with takes, the filled state is ONE centered column, top to bottom: orbRegion → Attach file → take-count dots (no hint copy) → divider "Narrations" → take cards. The raw-report peek (CR-061) is removed entirely.
- Cleanup: WIZARD.audio loses peekTitle/peekToggle/narrationOne/narrationMany/progressHint; adds narrations: 'Narrations'. StepAudio drops values/userName/branchNameOf props (peek-only) and the Chip/Collapse/ExpandMoreIcon/ethiopianDate imports. Reject notes (CR-053/054 helpers) stay, between attach and dots (flagged micro-decision, approved).
- Contract: CR-060 (dots only), CR-061 (removed), CR-065 (fixed order, orb no longer floats/beside) amended.
- Cleanup: WIZARD.audio loses peekTitle/peekToggle/narrationOne/narrationMany/progressHint; adds narrations: 'Narrations'. StepAudio drops values/userName/branchNameOf props (peek-only) and the Chip/Collapse/ExpandMoreIcon/ethiopianDate imports. Reject notes (CR-053/054 helpers) stay, between attach and dots (flagged micro-decision, approved).
- Contract: CR-060 (dots only), CR-061 (removed), CR-065 (fixed order, orb no longer floats/beside) amended.

## F35 — Re-record armed design
- Armed state: orb idle-fill becomes a dashed orange ring with the take number centered in a small solid disc (RecordOrb `replaceNumber` prop); while recording, the number rides as a corner badge. Target card gets `armed` prop → 2px orange border + orange[50] tint. Hint + Cancel stay under the orb.
- Timing: armed clears when the recording STOPS (not after upload) — the card shows busy meanwhile.
- Guards: deleting the armed card clears the armed state; at stop, the target index is re-verified (clip still present) else the take falls back to a new take.
- Contract: CR-058 bullets amended; CR-057 gains the disc bgcolor note.

## F36 — Play disc bgcolor
- MuiAudioPlayer: filled 36px disc, borderRadius 50%; idle/ended orange[400] + white glyph, playing orange[700] + white pause, hover darkens one step, focus-visible outline orange[800] offset 2, disabled = MUI disabled surface. Audio-orange role (§43.2).

## F37 — LinearProgress overflow (MUI warning)
- Symptom: value=101.6 on the determinate progress after (re-)recording playback. Cause: the ratio uses DTO durationSec (recorder second-counter) while the encoded WebM is slightly longer (MediaRecorder padding) → currentTime can exceed it.
- Fix: clamp `Math.min(100, Math.max(0, ratio))` with the existing falsy-duration guard; DTO duration stays the caption's display truth.

## F50 — Headless mock-flow smoke (Phase G) + one real bug
- Node script (`mock-smoke.mjs`, temp dir) exercises the transport exactly as the UI drives it: login → create (no audios) → stage clip → attach → transcribe → Mode-1 save → Mode-2 stage/accept → Mode-3 stage/revert → pre-generation revert → re-transcribe → empty-visits PATCH. **27/27 PASS** on the amended transport.
- Node quirk: extensionless ESM imports need a resolve hook (`--import bootstrap.mjs` registering a `.js`-appending hook; on Windows the hook path must be a `file://` URL — a bare `C:\` path throws ERR_UNSUPPORTED_ESM_URL_SCHEME); the adapter's `readFileAsDataUrl` needs a minimal `FileReader` stand-in.
- **Real bug found:** `correctContentHandler` did `formData?.get("mode")` — the JSON-body dispatch passes the params object (not a FormData), so Mode-2 crashed. Fixed: `formData?.get?.("mode")` (optional-chained `.get`) — safe for both body shapes.
- Sample transcriptions verified plain Amharic, no `±`; latency walk ≈250ms/clip; empty-visits PATCH falls back to the main branch.

## F51 — The Listening Desk (frontend-design pass on the transcription stage)
- Direction (skill-led, user-approved): a three-act vertical ritual — I. the listening desk (running head "The day's takes" + live `n of m` count, the orange listening rail `LinearProgress` 3px, take rows), II. the story manuscript (folio marks + ink-settle), III. the revision proof-margin (iconed modes, provenance-tagged strip). Single-column composition; no drop-initial (user chose "Manuscript folios").
- Signature: the ink-settle — on resolve, paragraphs rise in take order (300ms fade/rise, 90ms stagger, `both` fill, once per mount); folios are real provenance (take number in a 20px gutter over a continuous 2px divider rule) and honestly disappear after a Mode-1 save (the story is one edited blob — `showFolios = !report.latest`, notice chip takes over).
- Ledger rows: live 5-bar waveform (`equalizer` keyframes, 700ms, 90ms bar stagger) wired to MuiAudioPlayer's existing `onPlay/onPause/onEnded`; playing row warms `alpha(orange, 0.08)`, siblings dim to 55% via the step's `playingNumber` state — no player changes needed.
- Transcribe act: orange-contained (`color="warning"` — the audio role, §43.2); while transcribing it collapses to a 10px pulsing dot + "Transcribing…" status line (honest — the mock resolves per batch, no fake indices).
- Strip: proof-margin (3px `warning.main` left rule, radius 2), provenance chip from the real `staged.mode` ("Voice instruction"/"Typed instruction" — `modes.voiceTag`/`modes.instructionTag`), story face at 18px/1.95.
- Copy additions: `transcription.ledgerTitle`, `modes.revision` ("Refine the story"), `modes.voiceTag`, `modes.instructionTag`; `takesEyebrow` kept (contract CR-066).
- All motion gated by `prefers-reduced-motion`; chrome stays English (§7.6); sanitize gates unchanged (StorySection both branches + CorrectedStrip). Lint 0, build 0, dist deleted, dev-server 200s on the user's running instance.

## F52 — Owner amendments round (attach toast, no intro, heard-stays-heard, full width)
- **Attach toast:** `ReportNew.handleStep2Next` success path now toasts `audio.attached` ("Takes attached to the report") before advancing — same voice as `attachFailed`.
- **No intro:** the step-3 lead/hint block removed entirely; `WIZARD.transcription.lead`/`hint`/`takesEyebrow` deleted from constants (grep-verified no consumers). The step opens directly on the ledger head.
- **Heard stays heard:** transport already skips transcribed clips (`transcribeReportHandler` filters `!clip.transcription`, transport.js:1360) — no transport change. Client status derivation already holds heard rows at "Transcribed" during a batch. The per-row Replay is the CR-068 re-transcribe (kept); the single Transcribe act stays in its bottom slot.
- **Full width:** `TranscriptionTakeRow` dropped the `px:1/mx:-1` inset — rows run edge to edge.
- **Smoke extended to 35 checks (ALL PASS):** re-entry scenario — attach a SECOND take after transcription, run the single act → `completed:1` (only the new take), no duplicates, heard take's text untouched by the batch, status stays `transcribed`, merged story covers both takes (pre-save client-joined; `latest` null after the single-undo).
- Mirrors: contract CR-064 (toast bullet), CR-066 (opens on the ledger head, no intro, full-width rows), CR-067 ("heard stays heard" bullet); spec §52.7 gains the ledger-head normative bullet. Lint 0, build 0, dist deleted, dev-server 200s, gates clean.

## F53 — Data-derived readiness (the re-entry dead-end)
- **User report:** re-entry flow (transcribe → back to audio → add take → attach → step 3) showed "Not transcribed yet" for the new take — with NO way to transcribe it.
- **Root cause:** `ready = report?.status === "transcribed"` — BR-10 (adding never rewinds; spec §31) keeps the status `transcribed` after the re-entry attach, so `ready` stayed true → the `!ready` Transcribe button was hidden, the manuscript rendered without the new take's paragraph, and Next was enabled. The status was stale truth; readiness must be data-derived.
- **Fix (client only):** `ready = clips.length > 0 && clips.every((clip) => transcriptionsByAudio.has(clip._id))` — the button reappears for the unheard take, the manuscript hides (nothing fabricated where nothing is known, CR-067), Next stays gated (CR-076). Transport untouched (BR-10 is normative).
- Smoke grew to 37 checks (ALL PASS): explicit BR-10 no-rewind assertion + derived-ready premise (1 row for 2 clips before the batch; `completed:1` after).
- Mirrors: CR-067 bullet + spec §52.7 sentence (readiness data-derived).

## F55 — Responsive transcription editor + zero-lag (round-5)
- **Zero-lag architecture (§11):** old path cost 3 things per keystroke — `getHTML()` in `onUpdate` (MuiEditor.jsx:70), a SECOND `getHTML()` in the sync effect (line 79), and full parent state updates (`setStoryDraft`). New contract: `onUpdate` writes only a dirty flag; `shouldRerenderOnTransaction: false` + `useEditorState` keep React out of typing entirely; `getContent()` via forwardRef serializes once at boundaries (Save/Revert/mode switch); the external seed applies only when unfocused, deferred to blur when it arrives mid-typing. `onChange` removed from MuiEditor (single call site: EditContentSurface). Important detail: v3 `setContent` takes `options.emitUpdate` (not a positional boolean); seeding guard `seedingRef` keeps re-seeds from flipping the dirty flag.
- **Same-editor principle (§54.5/§54.6):** candidate fills the editor read-only + "Candidate · via {provider}" chip; CorrectedStrip demoted to the action bar (provenance + reason + Accept/Revert) — its `dangerouslySetInnerHTML` content viewer is gone (candidate lives in MuiEditor). Edit mode always seeds from the persisted story — the staged candidate is never edited in place (accept has no body; server decides, §54.3).
- **Provider plumbing:** `AI_PROVIDER_LABELS` added (addis/gemini/nvidia display names — the requirement doc's "Deepseek" is NVIDIA's "deepseek flash 4" model, §16); `MuiProviderSelect` (new §46.17 component, reused by both panels); provider rides the correct request (body + multipart), validated 422 on unknown, default `addis`, recorded on `stagedCorrection.provider` for the provenance chip.
- **Boundary-state subtlety:** the editor seed must NOT flip when only the dirty flag changes — seed is `storyDraft || storyHtml` with storyDraft written only at boundaries; external story refreshes (transcribe/re-transcribe/accept/revert) clear the draft so the fresh story re-seeds.
- **Status line approximation:** "Saved HH:mm" derives from `report.updatedAt` — the mock keeps no per-field timestamp (any mutation moves it); documented §66.10; acceptable chrome approximation.
- **Smoke error-envelope detail:** mockTransport failures return `{ error: { status, data } }` — assertions must read `res.error?.status`, not `res.status`.
- Spec/contract mirrors applied: §35.2, §31.6, §11.4 (2 rows), §46.16, §46.17, §53.3, §53.5, §54.2, §54.5, §54.6, §54.7, §54.9, CR-070…CR-073, CR-077. Smoke 46/46 PASS. Lint 0, build 0, dist deleted, transforms 200.

## F54 — Console warnings (MUI v9.3.1 ToggleButton + :first-child)
- `startIcon` on ToggleButton: the LD pass used the v5-era `startIcon` prop; **v9 ToggleButton no longer consumes it** (grep of installed source: zero references) — it leaked to the DOM `<button>` and the icons never rendered. Fixed by rendering the icon manually in a `mr: 0.75` inline-flex span inside the children.
- `:first-child` SSR warning from MuiEditor's TipTap placeholder selectors (`p.is-editor-empty:first-child::before/::after`) — switched to `:first-of-type` (semantically identical: the editor's content is a single `p`). Both dev-only warnings; production build was never affected. No mirrors needed (no behavior/copy change). Lint 0, build 0, dist deleted, transforms 200.

## F56 — editor.md correction pass (round-6, the candidate model)
- **Contract change (user-approved):** the correction pipeline is amended from staged/Accept to **candidate → editor → Save**. `POST /correct` returns the candidate; it fills the LIVE editor as an editable draft (dirty — "Unsaved changes"); Save persists it through the content PATCH; Revert restores raw (single undo). Nothing staged, no accept step, no strip, no candidate chip anywhere (§31.6/§35.5/§54.3 amended; contract CR-072 rewritten; correct/accept + correct/revert endpoints deleted from transport + reportsEndpoints; `stagedCorrection` DTO field removed).
- **One persistent editor (editor.md §2/§14):** StepTranscription now composes a single always-editable MuiEditor across ALL modes — never remounted on mode switch (the round-5 boundary flush is gone). `EditContentSurface` and `CorrectedStrip` components dissolved (files deleted; §15.5 tree + §54.2 map amended). The correction candidate lands via the new imperative `applyCandidate(next)` on the MuiEditor ref (fills the document, marks dirty — distinct from the clean `value` seed); order matters: call it synchronously in the handler so the value-effect's `value !== getHTML()` check sees the already-applied content.
- **Toolbar (editor.md §5/§18-1):** B I U · Paragraph/Heading select · bullet/numbered · align L/C/R/J · Undo/Redo (can()-guarded via useEditorState). Font-size select + color swatches removed — the "small selector" and "unexplained circular color controls" are gone. Installed `@tiptap/extension-underline` + `@tiptap/extension-text-align`; uninstalled `@tiptap/extension-color` + `@tiptap/extension-text-style` (sole consumers removed). Toolbar WRAPS at sm/md, single row lg+ — supersedes the round-5 overflowX scroll directive (editor.md §17 preferred wrapping).
- **Typography (editor.md §6):** the editor content now uses the §43.5 stack — `'Noto Serif Ethiopic', 'Inter', sans-serif`, line-height 1.75 (was Georgia fallback + 1.9); writing size stays at 1.0625rem (editing surface, not the 0.875rem reading size — documented).
- **Persistent footer (editor.md §15/§16/§20):** status line + Revert + Save render in EVERY mode. Statuses: "Saving…" (in flight) → "✓ Saved just now" (4s, success color + CheckCircleOutlined — note: v9 icon is `CheckCircleOutlined`, the `CheckCircleOutline` name failed the build) → "Saved HH:mm" (the §66.10 updatedAt approximation) / "Unsaved changes" / "No changes yet". Revert enabled when `latest` exists OR the document is dirty (discarding the draft/candidate needs no server round-trip pre-save).
- **Panels:** instruction field small + subordinate (minRows 1/maxRows 3, label "Correction instruction", placeholder "Type what should be corrected..."); voice panel gains the "Record the correction instruction" overline heading + a LABELED record button (disc span + "Record correction"; recording → "Stop recording" + pulse + timer).
- **Toast copy:** `correction.staged` → `correction.generated` ("Correction generated — review and save"); accepted/reverted toasts deleted with the strip.
- **Smoke:** correction blocks reworked to the candidate model — candidate returned + provider recorded on the response + nothing staged + save persists + accept/revert endpoints 404. **47/47 PASS.**
- Mirrors: spec §13.5 (install/uninstall truth), §14.3/§14.4 (ADR-038 scope), §15.5 (tree), §31.6, §35.1/§35.5/§35.7/§35.8, §46.16/§46.17, §51.3, §52.7, §53.5, §54.1–§54.9, §68.4; contract CR-070 (round-6 bullet), CR-071, CR-072 (rewritten), CR-073, CR-077. Lint 0, build 0, dist deleted, 7 modules 200 on the user's :3001 instance, grep gates clean.

## F57 — Voice-correction FormData wiring bug (the "Check the highlighted fields" error)
- **User report:** recording a voice correction showed "Check the highlighted fields" — the generic missing-instruction 422.
- **Root cause:** the `correctContent` query (`reportsEndpoints.js`) was `query: ({ reportId, ...body }) => ({ ..., body })` — so `correctContent({ reportId, formData })` produced `args.body = { formData }` (a plain object), NOT a raw FormData. `mockTransport` only extracts `args.body instanceof FormData` (transport.js:2000) — the same shape `uploadClip` uses (audioEndpoints.js:55, which is why takes upload fine). The handler therefore saw `formData = null` → `mode` fell back to `"text"` → empty instruction → the 422. The round-5 smoke missed it because it called the transport directly with the FormData, never through the RTK query shape.
- **Fix:** the query now mirrors uploadClip's shape — `body: formData instanceof FormData ? formData : jsonBody` — raw FormData for voice, JSON for text. This fixes both the dev mock AND the future production fetchBaseQuery path (which would equally mis-serialize the wrapped object).
- **Smoke:** added the F56 regression block (6b) — the wrapped `{ formData }` shape is rejected with the exact 422 the user saw (transport guard documented), and the raw FormData rides the voice branch (candidate `mode: "voice"`). **51/51 PASS.** Lint 0, build 0, dist deleted, reportsEndpoints transforms 200.
- No spec/contract mirror — wire contract unchanged (multipart for voice); pure client wiring defect.

## F58 — Round-7 transcription restructure (owner R3 review, 14 points)
- **User directive:** 14-point round: two cards (AudioCard + TranscriptionCard) instead of the single-step composition; the ±-token strip + StorySection + the whole `components/reports/` folder deleted; the mode group (edit/instruction/voice) removed entirely; the toolbar gains a font-size bucket select and the Paragraph/Heading select restyled (the "block" look was "not correct"); both the editor and the dialog field drop their borders (MuiEditor `borderless` prop + `variant="standard"` field); the footer becomes an icon row (Restore/Save with state colors — Save error-while-dirty, success-just-saved) instead of the text buttons; Save disabled while reverting; Revert disabled until `latest` exists or dirty; the correction dialog (title "Refine the story", provider + mic BELOW the field, right-aligned, Apply disabled when empty/busy) replaces the Mode-2/3 panels; mic stop → STT-only endpoint → transcribed text fills the field (then Apply); Apply on success fills the live editor + closes, on error toasts + stays open; transitions vs a11y + zIndex (MUI v9 `slots.transition`) fixed.
- **6 binding corrections (user feedback):** (1) use theme-customized MUI components (Card/CardHeader/CardActions — the §44 surfaces) not hand-rolled Boxes; (2) explicit responsive matrix: audio scroll maxHeight xs 240/sm 280/md+ 320, toolbar wraps, dialog fullscreen <600px, provider row wraps xs (min-width 140), footer wraps with `ml:auto` actions, Transcribe full-width xs, editor minHeight 200/220/260/320; (3) the Paragraph/Heading select restyled via a shared `toolbarSelectSx` (height 28, fontSize 0.8125rem, minWidth 112/84, px 1.25, radius 1.5, transparent, hover action.hover, no underline) — the earlier "block Select" attempt was rejected; (4) the spec is base input, not absolute truth — conflicts resolved by logical reasoning and mirrored in the same change; nothing invented (the canned STT text is a documented §66.10 mock limitation); (5) **CR-xxx references are strictly forbidden in code** — code JSDoc cites § sections only; CR numbers live only in the contract/plan docs; (6) a UI diagram is required for such layouts.
- **STT-only endpoint:** `POST /reports/:reportId/correct/transcribe` (multipart `clip` + `durationSec` → `200 { text }`; 404 unknown/foreign, 403 archived, 422 missing clip ("Record a voice instruction first") / bad MIME ("Only audio files are accepted") / size cap; never mutates the report, never persists the clip). Route placed beside `/correct`; `transcribeInstruction` mutation in reportsEndpoints (raw FormData; no invalidation — the endpoint touches nothing). The dialog is the only consumer; the direct-voice `/correct` branch keeps its canned fallback (reuses the extracted `CANNED_INSTRUCTION`).
- **Deepseek label:** `AI_PROVIDER_LABELS.nvidia = 'Deepseek'` (the wire id stays `nvidia`; the model registry §16 lists "deepseek flash 4").
- **MUI v9 detail:** `IconButton` supports `loading` (spinner on Restore/Save while in flight); the circular opener is an `IconButton` wrapped in a Tooltip `span` (disabled state needs the span to keep the tooltip).
- **Smoke:** +6 STT checks (success + deterministic text, missing clip 422, bad MIME 422, unknown 404, archived 403 via the seeded `r-0011` fixture, no report mutation) → **56/56 PASS**. Caught en route: creating a second report for the archive fixture COLLIDED with `r-0100` (`createReportHandler` reuses `counters.digest` without incrementing — pre-existing mock quirk), archiving the FIRST report and cascading 403s; switched to the seeded archived fixture (documents the quirk).
- **Verification:** lint 0 ✓ (unused `PropTypes` import in TranscriptionCard removed), build 0 ✓ (`TextStyle` is a NAMED export in tiptap v3 — default import failed the build; `useTranscribeInstructionMutation` was missing from the reportsEndpoints export list), dist deleted ✓, all 8 changed modules transform 200 on the dev server ✓, grep gates: StorySection 0, components/reports 0, `modes.(edit|instruction|voice)` 0 (word-bounded; `instructionPlaceholder` shares the prefix and is legit), CR-\d{3} 0 in client/src ✓.
- **Mirrors (same-change set):** spec §11.4 (Deepseek), §11.5 (modes/transcription/toolbar/FONT_SIZES rows), §13.5 (text-style reinstalled at round 7), §14.4 (font-size back in ADR-038 scope), §15.5/§15.6 (tree — AudioCard/CorrectionDialog/TranscriptionCard; StorySection + `reports/` deleted), §31.6 (STT endpoint), §33.8 (endpoint matrix row), §35.2/§35.6 (Mode-3 via STT), §46.16 (font-size select + borderless), §46.17 (MuiProviderSelect in the dialog), §52.7 (two-card step), §53.5 (footer color states + story-card home), §54.1–§54.9 (dialog re-scope — no mode state machine), §66.10 (canned STT); contract CR-066/069/070/071/073/074/077 round-7 bullets. Lint 0 ✓, build 0 ✓, dist deleted ✓, transforms 200 ✓, gates ✓.

## F59 — Round-8 fix pass (owner's 11-point dialog/editor review)
- **User directive (11 points):** (1)(2) React "does not recognize `titleTypographyProps`/`subheaderTypographyProps`" warnings on the two step cards; (3) `[tiptap warn]: Duplicate extension names found: ['underline']`; (4) editor: font-size select must list **10/11/12/14/16 with default 12**; `setFontSize is not a function` TypeError; Save after editing → 422 "Check the highlighted fields"; toolbar "completely ugly" on xs/sm; (5) dialog: field must look like the editor text field (placeholder kept); typing lags; record→stop leaves the field empty (even the mock text); provider select + mic row UI wrong and the provider select must have **no field label**.
- **Root causes (all verified against installed packages):**
  - (1/2) MUI v9 `CardHeader` has NO `titleTypographyProps`/`subheaderTypographyProps` (grep of the installed `CardHeader.js`: only `slotProps`) — the props leaked to the DOM root. Fixed in AudioCard + TranscriptionCard via `slotProps.title`/`slotProps.subheader` (same values, zero visual change).
  - (3) `@tiptap/starter-kit@3.30.1` itself registers `Underline` (dist import line + `options.underline !== false` push) — the explicit `@tiptap/extension-underline` duplicated it. Removed the explicit import/registration; StarterKit v3 does NOT include TextStyle, so the explicit TextStyle stays.
  - (4a) FONT_SIZES ladder → `[Default(0), 10, 11, 12, 14, 16]`; Default remains the unset sentinel = the ~17px theme writing size (§46.16 untouched — user chose "keep Default sentinel + add sizes").
  - (4b) `setFontSize`/`unsetFontSize` DO exist in `@tiptap/extension-text-style@3.30.1` dist (lines 263/266) → the TypeError was a stale dev-server bundle from before the extension existed (hard refresh clears it; not a code defect). The REAL defect: the extension's `renderHTML` emits `font-size: ${value}` **bare** — passing the number `18` produced invalid CSS `font-size: 18`. Fixed by passing `` `${next}px` `` (round-8 mirror in §46.16).
  - (4c) `updateContentHandler` 422s only when `!content.trim()`; `handleSave` read `getContent() ?? storyDraft` — `??` does not catch `""` (empty string is not nullish) → an empty editor serialization bypassed the fallback and posted the 422. Fixed with `||` (+ the (5) fix closed the sibling path: Apply with an empty instruction).
  - (5a/b) field restyled to the editor surface (underline removed, §43.5 font stack/size, paper-tinted rounded input, placeholder kept); dialog `memo`-ized + the recorder callback `useCallback`-stabilized — `start`'s identity (deps include `onClipReady`) no longer churns with the parent's renders.
  - (5c) **KEY BUG:** `apiSlice.normalizeResult` unwraps the envelope (`{ data: result.data.data }`) — `unwrap()` yields the payload directly, so `result?.data?.text` was `undefined` → `setInstruction("")` (field stayed empty after record→stop), and `result?.data?.content` was `undefined` → `applyCandidate` no-oped while the success toast + dialog close still fired (a lying success). Fixed: `result?.text` (CorrectionDialog) and `result?.content` (StepTranscription.handleApplyCorrection); both handlers also `useCallback`-stabilized (memoized dialog contract).
  - (5d) `MuiProviderSelect` rendered a caption Typography "AI Provider" above the Select — removed (label-less, `aria-label` only); provider row compacts (sm+ 180px, mic 36px).
  - **Toolbar xs (4d):** the single-row **scroll rail** below sm — nowrap, overflow-x auto, hidden scrollbars (`scrollbarWidth: none` + webkit rule), ALL four group dividers hidden below md, font-size select minWidth 68, `ml:auto` on Undo/Redo only from md (in the rail the gap-based linear flow is enough). sm/md keep the round-6 wrap; lg+ single row. (User chose the rail over the two-row grid.)
- **Verification:** smoke **56/56 ALL PASS** (transport-level STT/correct assertions already model the raw envelope — the defect was component reads after the §42.4 unwrap; no assertion change needed), lint 0 ✓, build 0 ✓ + dist deleted ✓, all 7 changed modules transform 200 on the dev server (:3000) ✓, grep gates: `titleTypographyProps|subheaderTypographyProps|@tiptap/extension-underline` 0, `CR-\d{3}` 0 ✓. Note for 4b: the setFontSize TypeError clears on a clean dev restart (stale bundle).
- **Mirrors (same-change set):** spec §11.5 (FONT_SIZES row), §46.16 (xs scroll rail + px suffix + StarterKit-shipped Underline), §46.17 (label-less MuiProviderSelect), §54.2 (CorrectionDialog round-8 amendment); contract CR-070/CR-071/CR-077 round-8 bullets; this finding; task_plan round-8 section. Round-7 Phase I commit still gated on approval (round-8 joins it).

## F60 — Round-8.1 follow-up (zero-lag dialog field, font-size crash-proofing, xs rail squish)
- **User reports after round-8:** (a) the font-size `setFontSize is not a function` TypeError PERSISTS even after a dev-server restart; (b) the toolbar "shrinks horizontally" on xs/sm; (c) the four correction-dialog points were listed as unresolved (field style, typing lag, STT fill, provider label).
- **Font-size (a) — resolved as environmental + hardened:** the full static pipeline was re-verified — dist `addCommands` registers `setFontSize` unconditionally (@tiptap/extension-text-style@3.30.1, package.json `module` → dist/index.js which contains it), the Vite-optimized dep bundle contains it, the served MuiEditor module contains it in `extensions`, `npm ls` shows one deduped `@tiptap/core@3.30.1`. The user's restart DID take effect (listener moved 11004 → 8324). A fresh page load cannot produce the error; the failing editor instance is the pre-fix module graph still open in the tab (TipTap's `useEditor` keeps the editor across HMR/React-Refresh). Fix: hard-reload the tab. **Hardening applied anyway (§46.16):** the onChange now prefers `setFontSize`/`unsetFontSize` and falls back to the core `setMark("textStyle", { fontSize })`/`unsetMark("textStyle")` (the extension's command is literally the core `setMark` — identical markup) — the select can never crash on a missing command regardless of graph state.
- **Toolbar squish (b) — real bug, fixed:** the xs scroll rail set `flexWrap: nowrap` + `overflowX: auto`, but flex children default to `flex-shrink: 1` → the row COMPRESSED the controls to the viewport instead of overflowing. Fix: `& > *: { flexShrink: 0 }` on the toolbar — the rail now truly scrolls (verified concept; browser confirm pending).
- **Dialog (c):** 5a (editor-like borderless field + placeholder) and 5d (label-less provider select, 180px/36px row) were already implemented in round-8; 5c (STT fill) verified end-to-end: handler returns `successEnvelope({ text })`, query passes raw FormData (F57 pattern), dialog reads `result?.text` (envelope-unwrapped). **5b (typing lag) — genuinely incomplete → the round-8.1 zero-lag field (§54.2, §53.3 doctrine):** the instruction input is now the `InstructionField` local component — controlled INSIDE itself, so typing re-renders only that subtree, never the dialog/provider/mic/actions; the dialog learns only emptiness FLIPS (Apply disabled) and reads the live text at Apply via the imperative `getValue()`; STT lands via `seed(text)`; `onCap`/`onPermissionError`/`onClose` are `useCallback`-stable (the last `start`-identity churn gone; TranscriptionCard's dialog `memo` now holds). Documented trade-off: closing the dialog discards the field draft (standard dialog pattern; a FAILED apply keeps the dialog open).
- **Verification:** lint 0 ✓, build 0 ✓ + dist deleted ✓, smoke 56/56 ✓, 3 changed modules transform 200 ✓. Mirrors: spec §46.16 (fallback + flexShrink) and §54.2 (zero-lag field). Round-7 Phase I + round-8 commit still gated.

## F61 — Round-8.2 (font-size paragraph scope + the highlighted-field contract)
- **User reports after round-8.1 (hard reload confirmed):** (a) the font-size select "holds always the word default" — picking a size never applies and the select never shows it; (b) Save 422 "Check the highlighted fields" even though the story editor VISIBLY has text.
- **Font-size (a) — root cause found in the installed TipTap core (NOT the stale-tab theory, which the reload disproved):** `@tiptap/extension-text-style`'s `setFontSize` is a NESTED chain — `chain().setMark("textStyle", { fontSize })` dispatches its own transaction immediately. With a COLLAPSED caret the mark lives only as `state.storedMarks`; the OUTER chain (`editor.chain().focus().setFontSize(...)`) then dispatches its own transaction whose `storedMarks` was captured as `null` at chain creation (core `Transaction` constructor) — `apply` carries `tr.storedMarks` → **null, wiping the stored mark before the toolbar's `getMarkAttributes` re-reads** → `{}` → the select snaps back to Default. And a stored mark would only ever affect FUTURE typing — never the visible text. Fix (§46.16): when `selection.empty`, the same chain FIRST expands to the enclosing paragraph — `setTextSelection({ from: $from.start(), to: $from.end() })` — making the range non-empty: the mark applies to the visible text (no stored marks involved) and the paragraph stays selected so the select shows the size. Same scope on the Default/unset branches and the `setMark` fallback. An empty paragraph collapses back to a caret → harmless stored-mark path.
- **Save (b) — two layers:** (1) the 422 means `content` reached the mock empty; `getContent()` returns `""` only when the ref'd `editor` is falsy or the doc is empty (TipTap `getHTML()` yields `<p></p>` for an empty doc — truthy — so a wiped doc would SAVE, not 422). The genuine-empty case is the likely path, but the null/dead-instance case was NOT statically pinned → **temporary diagnostics added** (console.debug in MuiEditor mount audit — schema marks + `typeof setFontSize`; getContent — `editor NULL` vs empty-doc + `doc.textContent`; font-size onChange — `run()` result; StepTranscription save-block — content length + ref presence). REMOVED after the user's repro confirms the mechanism. (2) **Systemic:** `normalizeResult` (apiSlice §42.4) maps 422 `details` → `error.fieldErrors`, but NOTHING consumed it — ReportNew read `error?.data?.details` (dead after normalization) → "Check the highlighted fields" highlighted NOTHING anywhere in the app. Fixes: StepTranscription pre-validates empty story locally ("Write the story before saving" — no request, honest highlight), maps `fieldErrors.content` → new MuiEditor `fieldError` prop (error.main border in both variants + caption line, cleared on edit/save/revert/transcribe/candidate); CorrectionDialog rethrows apply failures so the dialog maps `fieldErrors.instruction` onto the zero-lag InstructionField (error frame + helper text, cleared on typing/seed/close); ReportNew `applyServerDetails` reads the normalized `error?.fieldErrors` (§52.10 mirror).
- **Verification:** lint 0 ✓, build 0 ✓ + dist deleted ✓, smoke 56/56 ✓, grep gates (CR-`\d{3}`=0, dist gone) ✓. Mirrors: spec §46.16 (paragraph scope), §53.5 (pre-validation + fieldErrors), §54.2 (rethrow contract + instruction highlight), §52.10 (fieldErrors read). Round-7 Phase I + round-8 + 8.1 commit still gated.

## F62 — Round-8.3 (four round-8.2 defects: save-empty, correction-replaces, success-toast copy, font-size)
- **User reports after round-8.2 (hard-reload confirmed):** (1) "Write the story before saving" fires EVEN WITH visible text in the editor (modified text too); (2) Apply correction REPLACES the editor content with the correction text instead of the corrected full transcription; (3) the Save toast is SUCCESS but reads "Something went wrong — please try again"; (4) the font-size selector still doesn't work.
- **(1) Save-empty — root cause FOUND, the ORIGINAL bug all along:** `StepTranscription` created its own `surfaceRef` (line 106) but NEVER passed it down — `TranscriptionCard` owns a SEPARATE `surfaceRef` (line 73). The step's boundary read `surfaceRef.current?.getContent()` was therefore ALWAYS `undefined` → `|| storyDraft` → `""` every save: pre-8.2 this was the eternal 422 "Check the highlighted fields", post-8.2 the eternal local "Write the story before saving" (the round-8 `??`→`||` change was cosmetic). Fix: TranscriptionCard accepts the step's ref as a plain `ref` prop (React 19), owns no ref of its own, forwards to MuiEditor. The temp diagnostics were unnecessary — the mechanism is proven by code (the ref was never attached).
- **(2) Correction replaces content — mock fidelity break:** `correctContentHandler` returned `content: <p>{escapeHtml(firstLine)}</p>` where `firstLine` = the INSTRUCTION's first 80 chars — the candidate was an instruction snippet, so `applyCandidate` filled the editor with it, REPLACING the story. §35.5 requires the candidate = the FULL corrected content snapshot. Fix: new `buildCorrectionCandidate(report, instruction)` (transport.js) — deterministic §35.2/§35.3/§35.4 mirror: base = `report.latest || generateContent(report).latest`; verb-duplication instruction → first consecutively-doubled verb in a `±`-free paragraph deduplicated; case-FE instruction → first `±`-free "FE"-naming paragraph moved to the end; everything else byte-identical, `±` tokens verbatim; absent pattern → story returned unchanged with the reason (the §35.3 diff gate accepts it). Dead `escapeHtml` removed (last consumer was the snippet).
- **(3) Success toast with the generic error copy — normalization gap:** `normalizeResult` (apiSlice §42.4) unwraps the envelope and DROPS the `message`; `handleSave`/`handleRevertToOriginal` used `result?.message ?? TOAST_CATALOGUE.error.generic` → every SUCCESS rendered the generic error copy with the success icon. Fix: `TOAST_CATALOGUE.transcription.saved` ("Transcription saved") and `.reverted` ("Reverted to the original") added (§11.5/§60.6 mirror), used as the copy source; `result?.message` reads removed.
- **(4) Font-size — the round-8.2 paragraph scope was structurally INEFFECTIVE:** the extension's `setFontSize`/`unsetFontSize` are THEMSELVES nested chains dispatching immediately against the CURRENT state (collapsed caret → stored-mark-only) BEFORE the outer chain's `setTextSelection` transaction is applied; the outer dispatch's `storedMarks: null` then wipes them. Fix (§46.16): the paragraph expansion AND the mark step run in the SAME outer chain with the CORE commands `chain.setMark("textStyle", { fontSize })`/`unsetMark("textStyle")` — the extension command is exactly that call; the command-consulting fallback branch is gone.
- **Verification:** lint 0 ✓, build 0 ✓ + dist deleted ✓, smoke 56/56 ✓ (the correction assertions only check success flags — no content assertion change), CR-`\d{3}` gate 0 ✓, `console.(debug|log)` gate 0 ✓ (all round-8.2 temp diagnostics removed). Mirrors: spec §46.16 (in-chain setMark), §53.5 (ref wiring + toast constants), §54.3 (candidate = full snapshot), §60.6 (saved/reverted rows), §66.10 (buildCorrectionCandidate mirror). Commit (round-7 Phase I + round-8 + 8.1 + 8.2 + 8.3) still gated on approval.

## F63 — Round-8.4 (raw-dispatch font-size + text-empty boundary read)
- **User reports after round-8.3:** (1) "the editor has a text but when I select the font, instead of setting the font it focus on the text"; (2) "the save, always saves even there is not text in the editor".
- **(1) Font-size "focus on the text" — mechanism confirmed:** the round-8.2/8.3 paragraph-expansion (`setTextSelection` to the enclosing paragraph) SELECTS/highlights the whole paragraph — the visible "focus on the text" — instead of a subtle font change. Even when the mark applied underneath, the UX was broken. Fix (§46.16): the size now applies through a RAW transaction that never touches the selection — `tr.addMark($from.start(), $from.end(), schema.mark("textStyle", { fontSize }))` / `removeMark` for Default (verified: `Transform.addMark(from, to, mark)`, prosemirror-transform dist). The caret stays put, the paragraph text resizes, and the select reads the size at the caret (`$head.marks()` on the collapsed selection). An EMPTY paragraph (start === end) has no text range: the size rides the stored-marks path (`tr.setStoredMarks`), kept alive by the NEW `fontSizeIntent` re-assertion — a `selectionUpdate` listener re-asserts the stored mark while the caret sits in an empty paragraph (any other selection transaction dispatches with `storedMarks: null` and wipes it — the "always shows Default" snap on empty paragraphs); foreign text is never touched (`$cursor.parent.content.size > 0` skips), Default clears the intent, and `setStoredMarks` never changes the selection so no dispatch loop exists. A temporary console.debug diagnostic (dispatch + post-attrs + doc text length) stays until the user confirms, then removed (gate).
- **(2) Empty save persists — text-based emptiness, both sides:** an empty TipTap doc serializes as `<p></p>` — truthy — so it passed BOTH the client `!content.trim()` pre-validation AND the mock guard, and saved with the success toast (this was the round-8.2/8.3 "always saves" path after the ref fix made the read honest). Fixes: (a) `getContent()` now TEXT-empties — returns `""` when `editor.getText().trim()` is empty (§53.3 contract: the empty string = empty document; `undefined` still means the editor is not mounted); (b) `handleSave` restored to `??` — the round-8 `||` amendment is superseded (it would silently resurrect the stale draft after a full delete); (c) the mock's `updateContentHandler` guard now checks STRIPPED text (shared module-level `stripTags`, also reused by `buildCorrectionCandidate`) — same 422 "Check the highlighted fields" + `content` fieldError, mirroring the P6 validator.
- **Verification:** lint 0 ✓, build 0 ✓ + dist deleted ✓, smoke 56/56 ✓ (all content saves carry real text — no assertion change), CR-`\d{3}` gate 0 ✓; console gate = 1 expected (the temporary fontSize diagnostic, removed after user confirmation). Mirrors: spec §46.16 (raw dispatch + intent), §53.3 (text-empty read), §53.5 (`??` supersession + text-based emptiness), §66.10 (stripped-text content guard). Commit (round-7 Phase I + round-8 + 8.1 + 8.2 + 8.3 + 8.4) still gated on approval.

## F64 — Round-8.5 (seed-sync stability + the save-path draft resurrection)
- **User reports after round-8.4 (hard-reload confirmed, so no stale bundle):** (1) the font-size selector still doesn't work — previously picking a size highlighted the text (the 8.2/8.3 paragraph selection), now it doesn't even highlight; (2) remove all text from the editor → click outside → the text fills back in; remove text → save → instead of an error, the removed text is saved.
- **(1) Font-size — ONE root cause, statically proven: the churning seed-sync effect.** `handleDirtyChange` (StepTranscription) was a plain arrow recreated on EVERY render; `applyExternal` (MuiEditor, `useCallback([editor, onDirtyChange])`) therefore got a new identity every parent render; the seed-sync effect (deps `value`, `editor`, `applyExternal`) re-ran on every parent re-render; its guard `value !== editor.getHTML()` was true for ANY divergence — including the font-size mark just applied (`style="font-size:12px"` changed the HTML) — so `applyExternal(value)` re-seeded the STALE seed and wiped the mark in the same tick it applied. The round-8.4 raw dispatch DID work; the re-seed undid it before anything painted. That is why 8.2/8.3 left a visible paragraph highlight (the selection change was the only survivor) while 8.4 — no selection change — showed NOTHING ("doesn't even highlight"). Bold/italic were being wiped identically. Fix (§53.3 seed-sync stability rule): `handleDirtyChange` is now `useCallback`-stable (empty deps — it only calls setters) → `applyExternal` stable → the seed effect re-runs ONLY on genuine external `value` changes (refetch refreshes, candidate applies) — formatting marks survive.
- **(2) Two faces of the same bug + one read bug:** (2a) "click outside → text filled back in": the SAME churning seed effect — after deleting all text, a parent re-render re-ran it while the editor was unfocused, `value !== getHTML()` (the empty doc diverged), and it re-seeded the old content. The stability fix cures it: deleted text stays deleted while the editor is live. (2b) "remove text → save → the removed text is saved": the `?? storyDraft` save read — `storyDraft` is SET on every successful save, so `"" ?? storyDraft` resurrected the last saved content; the save succeeded, the refetch re-seeded the old `latest`. Fix (§53.5): the save read is `?? ""` — an undefined read (never-mounted editor) also reads as empty; the draft remains the edit seed only, never a save source. The round-8.4 `??` amendment is superseded (the nullish fallback existed for the never-mounted editor — but the draft was the wrong stand-in).
- **Diagnostic:** the round-8.4 temp console.debug (fontSize dispatch) was REMOVED — the user's hard-reload report plus this static mechanism made it unnecessary (console gate back to 0).
- **OUTCOME — font-size NOT fixed (round-8.5 close-out):** the user's repro confirms the font-size selector STILL does not apply a size; per the owner directive it is **NOT fixed and deferred to round-8.6** (registered OQ-010, §69; spec §46.16/§53.3 carry the open note). The seed-sync stability fix stands as a genuine mechanism fix (a churning `onDirtyChange` identity DID wipe formatting marks — statically proven) but did not close the defect; the round-8.6 investigation starts from the LIVE flow (diagnostic + served-module check), not static analysis alone. The remaining round-8.5 claims (empty save blocks locally, deleted text stays deleted on blur) are PENDING user confirmation.
- **Verification:** lint 0 ✓, build 0 ✓ + dist deleted ✓, smoke 56/56 ✓, console gate 0 ✓, CR-`\d{3}` gate 0 ✓. Mirrors: spec §53.3 (seed-sync stability + open note), §53.5 (`?? ""` supersession), §69 (OQ-010), task_plan round-8.5/8.6, progress. Commit (round-7 Phase I + round-8 + 8.1 + 8.2 + 8.3 + 8.4 + 8.5) still gated on approval.

## F65 — Round-report-step (the §52 report step: generation desk, report body, Edit mode, export menu)
- **The report step (wizard step 4/4, §52.8) was a placeholder** (`StepPlaceholder` in ReportNew). This round builds the real surface: the generation act (pre-`latest`), the persistent report-body editor (post-generation), the completed final-report surface with §58 print/export actions, and the missing Edit-mode route.
- **Conflict resolutions (owner decisions, recorded in spec §69 same change):** (C1) the wizard KEEPS the four merged steps (Basic info & Visits / Audio / Transcription / Report) — the §52.2 five-step list is amended to the merged model; the create payload stays metadata+visits (the round-4 two-payload amendment text already described it; the §31.2-1 payload note mirrors). (C2) the Edit-mode route `/reports/:reportId/wizard` is added to the §41.3 table (the code already navigated to it from §50's Edit). (C3) the §52.4 editable `supervisorName` field is added to step 1 (seeded from the auth user, carried in the create payload; mock create validator mirrors the 1..100 rule). (C4) the visits surface stays the VisitedBranchesDialog composition — §52.5's MuiDataGrid text is amended to the implemented dialog. (C5) "read-only until generation exists" = NO editor pre-generation (the GenerateCard posture), not a `readOnly` editor. (C6) the §54.2 "unassigned panel §52.8" reuse row is satisfied by §51 (the wizard never calls Accept). (C7) the unused `storyChangeNotice` copy is finally rendered — the stale-`latest` notice (§54.8). (C10) 18 `BR-` contract references across client/src rewritten in plain language (owner rule: no contract numbers in code).
- **Extraction (ADR-033 — the report step is the second editor-host):** `useEditorHost` (the §53.6 surface handler: draft/dirty/error/saving/reverting/justSaved + stable handleDirtyChange/handleSave/handleRevertToOriginal/applyCandidate, round-8.5 `?? ""` boundary read preserved), `useCorrection` (the §54.3 candidate rule: correct → applyCandidate → toast → rethrow), `EditorFooter` (the §53.5 icon footer), `CorrectionOpener` (the circular AutoFix action + dialog mount). StepTranscription refactored onto them; StepReport is the second consumer.
- **StepReport postures (status-driven):** `transcribed` → GenerateCard (POST /generate, server-guarded §34.2; success → toast `generation.ready`, query refetch seeds the editor); `reviewed` → ReportBodyCard (borderless MuiEditor `id="report-editor"`, ±-guidance strip + toggle computed at seed/candidate/save boundaries, stale-latest notice, footer, CorrectionDialog); `completed` → + the Export menu (Print via ReportPrint `window.print`, TXT via the existing exportContent endpoint; XLSX/CSV disabled affordances until the §58 exports round). Finish = "Create" (Add) / "Finish" (Edit) → Mode-1 save-if-dirty (the §52.10 leave-guard) → navigate to §51.
- **Pre-conditions transcription → report:** reportId exists; step-3 Next gate (`transcriptionReady`, data-derived); server `status === "transcribed"`; not archived (server-guarded); Finish requires a non-empty boundary read (`?? ""` — empty blocks with the highlighted field + helper, round-8.5 semantics).
- **Verification:** lint 0 ✓, build 0 ✓ + dist deleted ✓, smoke 56/56 + new assertions (generate 403-when-not-transcribed, generate writes latest + reviewed + digest, exportContent payload) ✓, console gate 0 ✓, `CR-|BR-` gate 0 in client/src ✓. Mirrors: spec §11.5/§15.5/§31.2-1/§41.3/§52.2/§52.3/§52.4/§52.5/§52.8/§52.10/§52.11/§53.5/§54.2/§54.3/§58.2/§58.3/§60.6/§66.10/§69; task_plan; progress. OQ-010 (font-size) inherited-open, out of scope. Commit gated.

## F66 — Mock report-id collision (pre-existing, fixed in P7)
- Two new generate assertions failed while the handler logic verified CORRECT in isolation (create → generate in one process returns the right 403). Root cause: `createReportHandler` minted `_id: r-${String(counters.digest).padStart(4, "0")}` **without incrementing** — the walk's main report AND the smoke's second create BOTH became `r-0100` (duplicate rows in the in-memory `reports` array); `reportOwnerOrNull` resolved the generate URL against the FIRST match (the walk's transcribed report) → it generated THAT one (200), leaving the intended target's checks 403.
- Fix: `_id: r-${String(counters.digest++).padStart(4, "0")}` — create ids strictly unique for the adapter's lifetime (fixture rows r-0001..r-0012 untouched; created rows r-0100+). Smoke 65/65 ALL PASS; debug lines removed.
- **Lesson:** the shared `counters.digest` is consumed by TWO minting sites (report ids and digest item ids); any future id minting in the mock must consume the counter, never just read it.
---

# Effort: Correct-the-Spec-Then-Rebuild (started 2026-08-18)

## F62 — Kernel read (Stage 0 digest)

All kernel sections read in full (§1–§10, §13, §61–§66, §69). Facts pinned for derivation work:

- **Scope/ownership (§3):** single user type (Area Supervisor); every record user-scoped incl. branches (§3.2.3); branch snapshot embedded at report creation, never rewritten by later branch edits (BR-14); no RBAC (ADR-036); two-path deletion for branches AND reports (BR-14/BR-16).
- **Status machine (§5):** draft → audio_attached → transcribed → reviewed → completed; forward-only; the single explicit rewind is last-audio removal (§17.4); the transition-guard table is single-sourced in §31 and reused by UI sections.
- **Content model (BR-11):** raw written once (STT output / first generation), latest = current content, single undo (raw → latest while they differ), Accept at completion fixes latest; OQ-007: raw = plain text, latest = rich HTML.
- **Report format (§6):** Type by visit count (1 → Type-1, >=2 → Type-2); per-visit lines `ከ[HH:mm] - [HH:mm] [branch] ብራንች` chronologically ordered; Ethiopian DD-MM-YY dates; fixed Amharic labels (never transliterated); §6.8 four verbatim samples (names appear nowhere else); §6.10 capture & attribution contract — metadata is form-only (fallback form → reviewed transcription → blank), clip bound to visit at upload (visitNo), attribution chain spoken > binding > single-branch-default > user-assigned, no silent fallback, item status vocabulary reported → in_progress → completed, comments carry rating 0–5|null; §6.11 branch digest (schemaVersion 1, stored on the report row, model-free filtering, unassigned-accept gate, manual re-derivation POST /reports/:reportId/digest after completed).
- **Language/tone (§7–§8):** UI English, content Amharic-first; transliteration rule verbatim (§7.2) + six authoritative pairs; 16 generation rules verbatim; rule-4 reconciliation — form metadata wins, transcription is body content + fallback; BR-19 no invention; tone = professional, supervisor POV, never verbatim narration.
- **Conventions (§9):** `_id` doctrine (no `id` fields / `.id` access); kebab-case files, PascalCase components, `Mui*` reusable; UPPER_SNAKE constants; Winston only (console.log ban); no magic literals; §9.7 hygiene per change; §9.8 six-step git protocol (step 5 = owner approval, step 6 = commit/push/merge).
- **Env (§10):** `config/env.js` sole `process.env` reader; keys only in `backend/.env`; VITE_ client vars only.
- **Stack (§13):** manifests are version truth; §13.5 planned deps (dompurify installed at the P4 editor phase; NVIDIA multipart helper conditional at P7); §13.6 permanent exclusions (no TS, no Next/Remix, no Tailwind, no zod, no test frameworks, no client AI SDKs, no WebSocket, no S3/GridFS); §13.7 dependency protocol.
- **Security/retention/verification (§61–§63):** XSS double gate (sanitize-on-write server + sanitize-on-render client, §61.3/§61.4); sweeper two-pass with 30-day window (ARCHIVED_TTL_SECONDS 2592000), exactly two TTL indexes (Report, Branch), no `deletedAt` anywhere (§62); manual gates replace test frameworks (§63.3/§63.4/§63.6); §63.9 spec-integrity audit C1–C6.
- **Performance/± (§64):** bounds not benchmarks (SC-8); ±-token vocabulary (8 tokens mapping §6.3 labels); server resolves ± only in the Google Docs export path; client renders verbatim (§53.3 display rule).
- **Deployment (§65):** one Express process serves API + static client; SPA fallback never shadows /api/v1; OQ-003 blocks production sign-off; OQ-004 keeps Google Docs in stub mode.
- **Phases (§66):** eight phases P1–P8 with exit gates; §66.10 dev mock adapter (deleted at P7, grep gate); §66.11 verification usage.
- **Registry (§69):** OQ-001..OQ-010; OPEN rows: OQ-003 (blocking), OQ-004, OQ-008, OQ-009, OQ-010. D1–D5 all deferred, no re-admission records.

## F63 — Stage 1 kernel classification

Procedure: KERNEL = (a) domain requirement/truth given by the owner, or (b) standing operating rule. Otherwise DERIVED.

- **KERNEL (18):** §1, §2, §3, §4, §5, §6, §7, §8, §9, §10, §13, §61, §62, §63, §64, §65, §66, §69.
- **DERIVED (51):** §11, §12, §14, §15, §16, §17, §18, §19, §20, §21, §22, §23, §24, §25, §26, §27, §28, §29, §30, §31, §32, §33, §34, §35, §36, §37, §38, §39, §40, §41, §42, §43, §44, §45, §46, §47, §48, §49, §50, §51, §52, §53, §54, §55, §56, §57, §58, §59, §60, §67, §68.

Architect decisions on the borderline calls (owner delegated: "you are the architect/engineer/UI-UX designer — make decision"):

1. **§14 ADR Index — DERIVED.** Entries are derived decisions; each becomes binding only once amended under §14.5.
2. **§15 Project Structure — DERIVED**, except the §15.4/§15.5 canonical trees are kernel-mandated mirrors whose content re-derives with the layouts they name.
3. **§67 Risks — DERIVED** analysis; domain risks re-checked with the owner at correction time.
4. **§68 Glossary — DERIVED** mirror of kernel terms; never mints new terminology.
5. **§11 Constants — DERIVED** values; the homes + §66.6 mirror discipline are kernel.
6. **§6.10/§6.11 (inside kernel §6)** — owned by the owner's §2.3 kernel list (capture & attribution contract; branch digest & filtering contract): treated as kernel facts to derive FROM, not to re-derive.

## F64 — Session facts

- Branch `spec-correction` created from phase-4 HEAD `ad8c502`; phase-4 uncommitted rounds 7–8.2 ride along untouched (owner: keep for history; that commit gate still belongs to the phase-4 effort).
- Session-catchup script not installed (skill scripts absent from both the user and repo locations); working files read manually; no prior unsynced context for this effort.
- Spec inventory: 13,101 lines; parts 0/A–F; five `TODO(open)` markers currently present (reconciled with §69 rows during Stage 3).

## Q&A ledger (this effort)

- [2026-08-18] Owner: "Provide the sections that can be wrong." → 51 DERIVED sections listed; owner confirmed and proceeded.
- [2026-08-18] Owner: "Create a new branch spec-correction." → Done (F64).
- [2026-08-18] Owner: "Keep for history, previous mistakes not to be repeated and append." → Working files append-only; phase-4 content preserved as the record.
- [2026-08-18] Owner: "You are the software architect/engineer and UI/UX designer — make decision." → Borderline classifications decided by the Architect identity (F63); preference/domain-fact unknowns still escalate per §12.
- [2026-08-18] Owner approved the Correct-the-Spec-Then-Rebuild plan and the Stage 1 inventory (18 KERNEL / 51 DERIVED, F63) → Stage 2 pipeline passes authorized (task_plan Stage 1 → closed).
- [2026-08-18] Stage-2 pass 1a (data model §17–§24A) — the Architect decided the correction set per the role model; presented to the owner for review; owner confirmed without changes → executed per F65; the mock-DTO deferral rides with it (recorded §69 OPEN: mock keeps pre-correction shapes, re-aligned at §52–§58, deleted at P7).
- [2026-08-18] Kernel passes 1–2 — model/schema corrections (outcomes fully recorded in the corrected spec; §17.2/§18.3/§20/§21/§22/§23/§24A): seven collections (User, Branch, Report, Audio, Transcription, Item, ChatConversation) all user-scoped (BR-13); exactly one TTL index in the spec — Report on `archivedAt` (§18.3); Report carries no content fields and no supervisorName/reportDate/branchDigest/visitNo — `raw`/`latest` live on the 1:1 Transcription row (BR-11, ADR-005 retired), supervisor name = live `fullName` join; `visits[]` positional (`_id:false`, Type = 1 + visits.length); single Item collection (§24A) replacing the branch-digest itemization (retired §6.11), branch+date captured at generation, per-type status/rating, one-comment partial unique index; branch removal reference-checked with no tombstone path (BR-14, §20.5); audio deletion at `transcribed` cascades the transcription (ADR-003 rewind); status-presence map per §17.6.
- [2026-08-18] Pass-1 rewrites touching the models — §33 (1:1 merged Transcription, re-transcribe same-row rewrite, frozen at `generated`), §34 (generation writes `latest` + Item rows in one atomic session, `transcribed → generated` terminal), §35 (corrections never touch Item rows; revert pre-`generated`), §37 (export payload `{content, date, branchName, visits}`), §38 (KPI set incl. Generated; activityByBranch via `$lookup`), §39 (exactly one text index — branches) → all mirrored in §17.6/§21.4 presence, §25/§40 fixtures, §46/§50/§52–§58.
- [2026-08-18] Owner: "before you commit, I want to know every single detail you will do next." → Full commit plan presented: files staged, staged-diff verification, single commit, no push/merge; `prompt.md` untracked at that point.
- [2026-08-18] Owner: "do you understand prompt.md" → Read in full; compliance audit against it surfaced the missing-ledger gap (this ledger); `prompt.md` amended and tracked thereafter.
- [2026-08-18] Owner: "based on task_plan.md what is next" → Next-step order clarified (commit → pass 2 backend). Owner then confirmed the branch lifecycle: spec fully corrected on `spec-correction` → delete it → new branch → re-implementation backend-first.
- [2026-08-18] Owner raised the coverage concern: the need-driven pipeline and model-driven correction can skip DERIVED sections (evidence: §16 never re-derived; §11/§12/§14/§15 only partial) → the coverage register fix approved (task_plan.md; per-section status + NEXT pointer; pass closes on its section list, never on story exhaustion; Stage 3 requires 51/51 dispositions).
- [2026-08-18] Owner (strict requirement): the agent is the Supervisor AND the Architect/Engineer/UI-UX Designer and makes the decisions; the owner is the interaction partner — reviews, adds/removes, asks iterative questions, digs, points out blind spots — never a Supervisor/Architect, never a decision-maker → recorded as the role model in AGENTS.md/prompt.md/findings.md/progress.md/task_plan.md (the "Correct-the-Spec-Then-Rebuild protocol").
- [2026-08-18] Owner decisions on the checkpoint: `prompt.md` tracked and committed (option a); single checkpoint commit now; pass story lists enumerated up front for per-story add/remove. → Executed: commit `chore: phase 4 owner-corrections`; pass 1b (architecture §11/§12/§14/§15/§16) opens next.
- [2026-08-18] Owner: "proceed" → checkpoint commit executed; pass 1b user stories presented.
- [2026-08-18] Owner: "proceed" (pass-1b plan) → 14 stories approved; pass order re-decided §16-first (S13) — the confirmed skip delivers leaf inputs (registry values, base-URL home, transport rules) to §11/§14; register NEXT pointer moved to §16.
- [2026-08-18] S13 (§16 STT contract): 33-question WH battery presented (no removals; owner: "proceed") → derived from the §2.3 kernel + corrected model, corrections applied (see F66).

## F66 — S13: §16 STT contract re-derived (2026-08-18)

Battery answers (kernel-sourced; no codebase/spec-text citation):
- **Boundary (§16 vs §33):** §16 owns the provider-facing transport contract (endpoint, multipart shape, auth, response schema, error mapping, retry/backoff policy, logging labels); §33 owns domain orchestration (WAV conversion, chunking, per-chunk sequencing, merge, persistence, status advance). They touch at exactly one point — §33.4 invokes the §16.4 contract. Confirmed as written.
- **Request:** `POST {ADDIS_AI_BASE_URL}/api/stt`, multipart with exactly two parts — `audio` (the §33 chunk, mono 16-bit 16 kHz PCM wav — never the uploaded webm, §33.3/§22) and `request_data` (stringified JSON with exactly `language_code`, sourced from the clip's stored `language`, `am` today; om/ti reserved §7.7). No model field, no `target_language` — neither is documented on the STT endpoint (§16.8 no-invention gate); `target_language` belongs to the text-generation `chat_generate` contract only.
- **Response:** `{ status: 'success', data: { transcription, usage_metadata: { totalBilledDuration, requestId } }, confidence }`. Persisted: `requestId` (permission, ADR-019) + a conditional `modelVersion` echo → `stt.model` (null-if-unknown §23.2). `confidence`/`totalBilledDuration` = call metadata, never persisted (§23.7).
- **Errors/retry:** transport/5xx → retry (`AI_PROVIDER_RETRIES` 3, backoff 1 s/2 s/4 s, `AI_TIMEOUT_MS` 30000) → chunk failed → 502; semantic 4xx → 502 without retry (outcome can't change); 429 → honor `Retry-After` capped by the app tier (§27); key missing → boot fail-fast (§10.3). No STT fallback ever (ADR-001, §12.11-5 — a chain would silently degrade the accuracy-critical path, SC-1/G6).
- **Chunk failure:** per-chunk — failed chunk marked, pipeline continues; a partial merge is never persisted; report moves to `transcribed` only when every chunk succeeded (§33.7); retry endpoint re-runs failed/pending audios only.
- **Persistence:** one atomic session at completion — row created (`raw`=merged STT, `latest`=raw, `language`, `stt.{requestId, model}`), `report.transcription` ref set, status → `transcribed` (§33.5/§23.4); re-transcription rewrites the same row at every status except `generated`.
- **Stored:** `stt.requestId`, `stt.model` (echo, else null), `language`; nothing else. §11.3 already holds `ADDIS_AI_STT_MAX_DURATION_SEC` 60/`ADDIS_AI_BASE_URL`/`AI_TIMEOUT_MS` — values confirmed, no new constants.
- **OQ candidates:** Addis response-field volatility (confidence/modelVersion) → contract is conditional (never hard-required); per-chunk latency SLA → policy-only, calibrated at implementation; STT language detection → request always sends `language_code`; error codes beyond generic HTTP → mapping anticipates 429/5xx/4xx only. None blocks.

Corrections applied (§16.4 STT block, §33.4, §33.5, §16.8 STT gate, §11.3 Used-by row):
1. §16.4 STT — request contract tightened: exactly two multipart parts; chunk MIME is the pipeline's own (wav/PCM), `AUDIO_ALLOWED_MIME_TYPES` governs uploads only (was misleadingly tied to the chunk); `request_data` carries exactly `language_code`; no invented fields.
2. §16.4 STT — response contract: `modelVersion` echo conditional → `stt.model` null-if-unknown; `confidence`/`totalBilledDuration` explicitly never persisted; persistence permission re-pointed to §23 (was §22–§23).
3. §16.4 STT — error bullet: "a partial merge is never persisted — the report moves to `transcribed` only when every chunk succeeded (§33.7)" (removed the ambiguous "fuses the succeeded chunks").
4. §33.4 — removed the garbled "data object: audio blobs `request_data`" phrasing and the stale `target_language` field (a text-generation `chat_generate` parameter that had leaked into the STT request contract); request = `audio` + `request_data.language_code` from the clip's stored language.
5. §33.5 — `stt.model` written only from the provider's model echo when the response carries one, else `null` (was "the providers' model string" — unfillable from the documented response shape).
6. §16.8 — new STT contract gate (two parts only, no `target_language`, Addis-only grep, `stt.model` never synthesized).
7. §11.3 — `ADDIS_AI_STT_MAX_DURATION_SEC` Used-by += §16.

§16 register row: S13 closed (re-derived); NEXT → S12 (text-generation contracts).

## Effort finding — Role model & coverage register (2026-08-18, owner strict requirement)

- The owner is the interaction partner only: they review, add/remove what is presented, ask iterative questions, dig, and point out blind spots. They are not the Supervisor, not the Architect, and do not make decisions. The agent is both identities and decides — including derivation-conflict resolution; preference/domain-fact unknowns become §69 OQ rows and never block on the owner.
- Coverage guarantee: the 51 DERIVED sections are tracked per-section (not-started / in progress / closed with disposition re-derived | audited-no-change | escalated) in task_plan.md with a NEXT pointer; a pass closes on its section list; Stage 3 requires 51/51 dispositions, zero partials, zero `TODO(open)` without an §69 row. Derivation stays kernel-first — corrected sections are the output of a pass, never the input to the next pass's derivations (the pass-1a skip evidence: §16 unvisited, §11/§12/§14/§15 partial — fixed by pass 1b).
- Branch lifecycle: `spec-correction` holds all corrections; on full correction a new branch is created and `spec-correction` is deleted. Freeze: no `backend/*` and no `client/*` edits until the spec is fully corrected (Stage 3 hard gate); re-implementation starts backend-first.
## F65 — Stage 2 pass 1: data-model correction set (2026-08-18)

Owner-approved correction set applied to the spec + mirrors; the plan for this pass was itself owner-approved ("Correct-the-Spec-Then-Rebuild", Stage 2 pass 1, decided 2026-08-18).

### Corrected model (normative)
- **Status machine:** four states `['draft','audio_attached','transcribed','generated']`; `generated` terminal (BR-08). No `reviewed`/`completed`/`accept` anywhere (client code, constants, mock, spec). Status history: rewinds explicit (BR-01); no `..accept()` method anywhere (outside the live join of §17.4/§20 — negations only; gate §31.10).
- **Report row:** `{branch (ObjectId ref), date, clockIn, clockOut, visits[] positional subdocs (no visitNo), status, transcription (unique sparse ref), isArchived, archivedAt}`. No `supervisorName`/`reportDate`/`branches[]` snapshot/`branchDigest`. One report = one branch; supervisor name = live `fullName` join (§28.5).
- **Transcription:** 1:1 merged row per report — `raw` = merged STT, `latest` = single content slot; re-transcribe rewrites the same row; frozen at `generated` (regen rewinds to `transcribed` first); single undo = revert `latest` to `raw` while they differ (pre-`generated`). ADR-005 row fixed to the 1:1 Transcription row (owners §5.4, §21, §23).
- **Items:** single Item collection (§24A) written at generation in the same atomic session as transcription `latest`; corrections never touch Item rows (item status/rating via single-row PATCH §31.6); `GET /analytics/items` reads Item rows only.
- **Storage:** exactly ONE TTL index (Report on `archivedAt`); branch removal behind the reference check (reports' `branch`/`visits[].branch` + Item rows' `branch`), no tombstone path; search = exactly one text index (branches; reports via `$in` on resolved ObjectIds); sweeper pass 1 report removal cascades Audio docs, 1:1 Transcription, Item rows, ChatConversation (§62.3); sweeper wins races.
- **Analytics KPIs:** `{reportsThisMonth, inProgress, generated, activeBranches}` (OQ-005 fixed); four-slice `statusDistribution`.
- **Export (§37):** `{content: latest, date, branchName, visits}`; `generated` status not required.

### Sweep results (what was left after the rewrites — all clean)
- `visitNo|supervisorName|reportDate|branches[] snapshot|branchDigest|tombstone|digest|accept ceremony|Accept action|accept step|accept strips|Accept strips|accept/reject|acceptedAt|two TTL|six model|five-step|5-state`: remaining hits are negations ("never", "no `..accept()`"), retirement text (§6.11 pointer), the F65 historical record, or §69 records — none normative.
- `reviewed|Review|reviewed transcription|status `completed``: only legit reviewed-transcription language (review of the merged STT) remains.
- `seven collections|seven models`: legit seven-models contract, unchanged.

### Mirrors (same change set)
- `client/src/utils/constants.js`: `REPORT_STATUSES` 4-member (generated terminal); `REPORT_STATUS_LABELS.generated = 'Generated'`; `ITEM_TYPES`/`ITEM_STATUSES`/`ITEM_STATUSES_BY_TYPE` added; `report.completed` removed from `TOAST_CATALOGUE` (generation toast = `toast.generation.ready`; correction toast = `toast.correction.generated` "Correction generated — review and save", matching `useCorrection.js`).
- `client/src/components/reusable/MuiStatusBadge.jsx`: `REPORT_COLOR_MAP` 4 states, `generated → "primary"`; `REPORT_STEP_INDEX`/`REPORT_STEP_LABELS` untouched (labels generic).
- `.opencode/plan/phase-6-backend-apis.md` L38: digest-contract decision point replaced with the corrected-model paragraph (status path, report/branch/visits shape, transcription, items, TTLs, search index).
- `.opencode/plan/phase-7-backend-integration.md`: "Manual acceptance" row is the §63.6 matrix name — no change.

### §69 records
- OQ-001 record fixed: content lives on the report's 1:1 Transcription row as `raw`/`latest` (BR-11, §23.2/§23.5); the report row carries content refs only (§21.2).
- OQ-005 record fixed: four KPI cards (Reports this month, In progress, Generated, Active branches).
- New record: "Pass-1 data-model corrections — CLOSED 2026-08-18 (owner approved 'Correct-the-Spec-Then-Rebuild', Stage 2 pass 1)".
- New record: "Mock-DTO alignment — OPEN (carried by §52+ linking rounds)" — the mock still serves pre-correction shapes (5-state status, supervisorName/reportDate, per-visit clips, visitNo) while P3 client code consumes corrected DTOs; mock dies at P7 (§66.10 grep gate); only §25/§40/§66.10 may touch it.

### Deferred (ride the mock-DTO OPEN record)
- `client/src/mock/transport.js`, `client/src/mock/fixtures.js` — pre-correction DTO shapes, intact.
- Non-mock consumers of old shapes: `client/src/redux/features/audioEndpoints.js` (visitNo URL params), `client/src/pages/ReportNew.jsx` + `client/src/components/report/StepReport.jsx` (status branches incl. reviewed/completed), `client/src/components/report/ReportPrint.jsx` (reportDate/supervisorName payload), `client/src/utils/wizardValidation.js` (supervisorName), `client/src/redux/features/searchEndpoints.js` (stale comment) — re-aligned in the §52–§58 linking rounds.

### Verification (this pass)
- Client lint: 0 on the two edited files (`npx eslint client/src/utils/constants.js client/src/components/reusable/MuiStatusBadge.jsx`). Full `npm run lint` exceeds the 180 s tool timeout — targeted eslint is the verified path.
- `npx vite build`: 0 errors (chunk-size warning only); `dist/` deleted per §9.7.
- Final grep sweeps: clean per F65 sweep list above.
- §15.4 tree: generic per-entity placeholders — no change needed. §21.9/§21.10, §23.6, §32.8, §36, §66.10 audited — clean.

### Commit status
Single commit `chore: phase 4 owner-corrections` (spec + constants + MuiStatusBadge + phase-6 plan file) **held** for explicit user approval (§66.2 step 6). After approval: pass 2 (backend §25–§40).

## F67 — S12 research (addisai SDK) + owner-directed REST route audit (2026-08-18)

### Addis AI research — complete, SDK source-verified (decisions D1–D9)
- **FAQ (12/12)** extracted from the saved RSC payload: Amharic + Afan Oromo production-grade; English translation pairs; experimental Tigrinya/Somali beta; commercial use permitted; trained from scratch on native datasets; 500 ETB starter credits; pay-as-you-go, no subscription.
- **npm + GitHub source (v0.2.0, MIT, zero runtime deps, Node 18+):** the SDK intentionally does NOT forward a `model` field to `POST /api/v1/chat_generate` ("could leak the underlying model") — validates the app's model-honesty design. Chat maps `messages` → `prompt` (last) + `conversation_history` (prior, role/content), plus `system`, `persona`, `tools`, `generation_config {temperature, maxOutputTokens, stream}`. `finish_reason` normalized: STOP→stop, MAX_TOKENS→length, SAFETY/RECITATION→content_filter, TOOL_CALLS→tool_calls. STT = `POST /api/v2/stt`, multipart exactly 2 parts (`audio` + `request_data` = `{"language_code"}`), response `{transcription, confidence, usage_metadata}`. SDK `SttLanguage` = am|om|en|ha|sw vs docs am/om — conflict moot (app is am-only). SDK maxRetries code default 3 vs README 2 — pin explicitly (`AI_PROVIDER_RETRIES`). `chat_audio_input` + `transcription.clean` = future Mode-3 single-call option (OQ). `ADDIS_CHAT_MODEL = "addis-1-alef"` is a public display id only.
- **Owner decisions:** adopt `addisai@^0.2.0` for STT + TTT (STT/TTT only — TTS stays D1-deferred, owner clarified after two misreads); raw `fetch` retired for provider `addis`; Gemini/NVIDIA stay axios; `persona` never sent; topP/topK dropped for Addis (SDK chat surface lacks them — §11.3 Used-by narrows to gemini/nvidia); retries SDK-managed (`maxRetries: AI_PROVIDER_RETRIES` = 3, `timeout: AI_TIMEOUT_MS`); SDK typed errors give `.retryAfter` (429) and `.availableBalance` (402 → top-up message via 502 envelope); SDK constructed once in `config/env.js` (§10.3 sole `process.env` reader).
- **Paid reality (§16.2):** pay-as-you-go ETB credits; STT 3.5 ETB/1k chars, 0.3/0.8 ETB per 1k tokens text gen; free tier 60 RPM / 1000 RPD / 3 concurrent.
- **Flagged OQ (awaiting owner add/remove):** transcription-stage TTT correction schema shape — pre-generation `latest` is plain Amharic prose vs the §35.2 partial schema `{changed:[{section,field,content,reason}]}`. Architect decision: target is always current `latest`; structured partial schema post-generation, full corrected prose + surgical diff pre-generation.
- **S12 battery (20 questions) + full §16 correction plan presented; verdict + approval still pending.** Four end-to-end flows (correction of transcription STT/TTT, correction of report STT/TTT) with wire payloads shown to the owner.

### Owner-directed REST route audit (applied, spec-only)
Owner: "the route structure is not correct and doesn't follow the REST" → redesigned the reports/AI domain:
- `POST /reports/:id/transcribe` + `/re-transcribe` → **`PUT /reports/:id/transcription`** (idempotent create-or-replace; skips already-contributed audios; 403 at `generated`).
- `POST /reports/:id/correct` → **`POST /reports/:id/corrections`** (ephemeral candidate, ADR-033).
- `POST /reports/:id/correct/transcribe` → **`POST /reports/:id/corrections/transcripts`** (ephemeral instruction text).
- `POST /reports/:id/generate` → **`POST /reports/:id/generations`**.
- `POST /reports/:id/content/revert` → **`PUT /reports/:id/content`** (idempotent replace with `raw`; pre-`generated` only).
- `PATCH /reports/:id/visits` → **`PUT /reports/:id/visits`** (full replace).
- KEPT as documented REST extensions: `POST /reports/:id/archive` + `/restore` (lifecycle), `GET /audios/:audioId/play` (streaming), `GET|POST /reports/:id/chat[/messages]` (noun + collection).
- Applied: §31.2-2, §31.6, §31.8, §33.2, §33.6, §33.8, §34.2, §34.7, §35.2, §35.5, §35.6, §52.7, §54.2, §54.5, §54.6, §66.10 mock gate refs, §15.4 tree comment, phase-6 plan L42-44. Grep-verified: zero old route literals (remaining hits are historical prose in §33.2/§33.6 and behavioral language).

## F68 — S12: text generation + addisai SDK + standing reasoning (closed 2026-08-18)

Owner approved the S12 plan ("proceed") after the battery verdict; corrections C1–C25 applied in one change set.

### Kernel-sourced answers (no codebase/spec-text citation)
- **SDK wire mapping (source-verified from addisai-js v0.2.0):** `chat.completions.create` → `POST /api/v1/chat_generate` with `target_language`, `prompt` (last message), `conversation_history` (prior role/content), `system`, `persona`, `tools`, `generation_config {temperature, maxOutputTokens, stream}`. The SDK deliberately does NOT forward `model` ("could leak the underlying model") → registry id for addis is display-only. finish_reason normalized STOP→stop, MAX_TOKENS→length, SAFETY/RECITATION→content_filter, TOOL_CALLS→tool_calls. `speech.transcribe` → `POST /api/v2/stt` (2-part multipart; response `{transcription, confidence, usage_metadata}`); SDK `SttLanguage` am|om|en|ha|sw vs docs am|om (OQ-012, moot). SDK maxRetries code default 3 vs README 2 → pinned to `AI_PROVIDER_RETRIES` explicitly. Typed errors `.retryAfter` (429) / `.availableBalance` (402).
- **Paid policy:** the former free-only policy is wrong for Addis — pay-as-you-go ETB credits, 500 ETB starter, STT 3.5 ETB/1k chars, 0.3/0.8 ETB per 1k tokens; 402 → top-up message via the 502 envelope → fallback; free tier 60 RPM/1000 RPD/3 concurrent (OQ-011). Gemini/NVIDIA stay free-tier-only.
- **"No correction schema" (owner decision):** transcription-stage TTT corrections = full corrected plain prose; structured-output mandate/gates carry the carve-out; §35.2 target-split; §35.3 diff-verify binds report-shaped `latest` only; the §35.4 partial schema stays for `generated`-report corrections.
- **Standing reasoning (owner requirement):** user selects reasoning for reasoning-capable providers (gemini/nvidia); the selection is the conversation default (`ChatConversation.reasoning`, default `AI_REASONING_DEFAULT` `'off'`) applied to every TTT request (generation, regeneration, Mode-2/3, chat turns); per-message triple stays as audit; `MuiReasoningSelect` (§46.17) on the §52.8 desk + §54.2 dialog, enabled only when the selected provider's model has reasoning capability; addis never receives it (§16.8 reasoning gate). Scope: per-conversation (recorded in §69).

### Corrections applied (C1–C25)
§16.2 (addis row transport/model display-only, paid policy), §16.3 (SDK instance once in `config/env.js`), §16.4 (Addis text-gen + STT block rewrites, structured-output carve-out, Gemini default → conversation default), §16.5 (SDK-managed retries, `.retryAfter`, 402 → 502 top-up → fallback, finish-reason failures, structured-output scope note), §16.6 (reasoning ride-along), §16.7 (SDK construction), §16.8 (SDK-only gate, reasoning gate, paid-policy gate, finish-reason gate, structured-output carve-out), §11.3 (`AI_TOP_P`/`AI_TOP_K` gemini/nvidia-only, `AI_PROVIDER_RETRIES` SDK maxRetries), §11.4 (`AI_REASONING_DEFAULT`), §11.5 (`AI_REASONING_LABELS`), §13.3 (SDK note), §13.5 (addisai row), §14.3 (ADR-008 amended), §24.2 (`reasoning` field), §33.4 (SDK STT call), §34.4 (topP/topK out of the Addis line), §34.5 (language via SDK, reasoning default), §35.2 (target-split Mode-2), §35.3 (surgical scope), §35.4 (SDK params + carve-out + reasoning), §36.3 (matrix `reasoning?`), §36.4 (optional reasoning → conversation default), §36.5 (SDK messages projection), §46.17 (`MuiReasoningSelect`), §52.8 (desk selectors), §54.2 (reasoning selector row), §54.7 (reasoning state), §69 (OQ-011/012/013 + three closure records).

### Verification (this pass)
- Grep gates: `chat_generate`/`api/stt` (old path)/`ADDIS_AI_BASE_URL`/`x-api-key` in spec appear only as SDK-internal/historical mentions in §16/§33; `topP|topK` only in gemini/nvidia blocks; `reasoning` never sent to addis (all addis bullets carry the ignore-rule).
- Cross-section sweep per §16.8: §12.2/§12.8/§12.11-5, §13.3/§13.5, §14.3, §7.7, §24, §33, §34, §35, §36 consistent.
- Working files: task_plan register §16 → closed, NEXT → §11; findings F68; progress entry appended.

## F69 — S1–S4: §11 Constants & httpStatus re-derived (closed 2026-08-18)

Owner approved all 15 WH questions ("do them all"). Kernel-sourced derivations:

- **Q1 home boundary:** operator-tunable per deployment (keys, URLs, timeouts) → §10 env, read only by `config/env.js`; frozen product truth (limits, counts, allowlists, registry members, TTLs) → §11 constants; one home per value, no aliases — a constant never reads `process.env`.
- **Q2 magic-literal line:** whitelist of tolerated inline literals = 0/1 arithmetic, `""`, `null`, booleans, structural markup; everything else carrying product meaning resolves to a §11/§10 name.
- **Q3 freeze depth:** deep freeze on export for nested groups (`AI_MODELS`, `ITEM_STATUSES_BY_TYPE`, `WIZARD.*`, `TOAST_CATALOGUE`, labels maps).
- **Q4 naming:** UPPER_SNAKE_CASE keys; lowercase enum values; namespace pattern for chrome groups.
- **Q5 enforcement:** §9.7 sweep checks inline literals against the whitelist; reviewer's trace = constant name at the call site.
- **Q6 audit method:** inventory sweep at pass end (never mid-pass) — corrected sections' references cross-checked against Used-by columns.
- **Q7 orphan/phantom lifecycle:** orphan (declared, zero consumers) is either referenced by a corrected section or removed from table + constants file in the same change; phantom (consumed, undeclared) is added; no entry leaves before the sweep confirms zero references. → **`ADDIS_AI_BASE_URL` removed from §11.3** (SDK-internal endpoint; the §16.8 SDK gate bans the literal in source — it was a dead entry); §16.4/§16.7/§16.8 reworded (wire URLs stated as SDK-internal facts).
- **Q8 no-alias rule:** env value never duplicated in constants; `AI_TIMEOUT_MS` (env) vs `AI_PROVIDER_RETRIES` (constant) exemplify the split.
- **Q9 provenance:** provider-published values recorded with provenance (docs/date) and enter constants only as product policy; prices/limits stay §16.2 documentation + OQ rows (§14.5 amendment discipline on change).
- **Q10 completeness:** httpStatus set derived from corrected endpoint matrices; every documented wire code has a semantic name; provider codes absorbed internally (addis 402 → 502 envelope) never appear as wire codes.
- **Q11 client mirror:** same semantic names both sides; numeric ban symmetric.
- **Q12 registration gate:** a section amendment introducing a new code registers it in §11.6 + `httpStatus.js` in the same change; grep gate: no numeric status literal.
- **Q13 mirror scope:** mirrored iff the client renders/validates/transmits the set; `LANGUAGE_CODES`/`MESSAGE_ROLES` correctly unmirrored (server-only, verified §29/§23/§33). Current §11.5 scope confirmed complete.
- **Q14 label chrome:** §7.6 owns display text; §11.5 rows map wire value → display name; wire values never change for chrome reasons.
- **Q15 parity verification:** §11.7 gate — every §11.4 shared-business row has a §11.5 mirror and vice versa; the §16.8 registry/mirror rule generalized.

### Corrections applied
§11.2 (home boundary, deep freeze, tolerated-literals whitelist, namespace pattern), §11.3 (`ADDIS_AI_BASE_URL` row removed), §11.6 (completeness rule + registration gate), §11.7 (whitelist check, inventory-sweep discipline, mirror-parity gate), §16.4 ×2 (wire targets SDK-internal), §16.7 (constants list), §16.8 (SDK gate wording). No §11.5 rows changed — mirror scope confirmed. Register: §11 → closed; NEXT → §14 (S10).

## F70 — S10: §14 ADR index re-derived (closed 2026-08-18)

Six stories presented one-by-one, all kept ("proceed"). Architect battery (4 questions, answered inline):

- **Q1 status vocabulary:** §14.2 rule 3 enumerates exactly Approved / Approved (temp; §14.4) / Retired (+date). ADR-008's cell "Approved (amended 2026-08-18)" was the only deviation — a variant string outside the vocabulary; the amendment was already recorded in the Decision text → **cell normalized to "Approved"** (record kept in the decision text).
- **Q2 new rows for S12-era decisions (paid policy, no-correction-schema, standing reasoning):** no — §14.2 rule 4 (section prose governs); they are owned by §16.2/§35.2/§24.2 prose and indexed via the ADR-008 amendment. ADR-001's text still said "Addis AI for STT only" — internally contradictory (same row lists Addis among user-selectable text-generation providers) and stale vs ADR-008/§12.11-5 → **rewritten**: Addis AI (SDK) is the exclusive STT provider and a user-selectable text-generation provider; Gemini/NVIDIA text-generation only; amendment dated.
- **Q3 ADR-024 pointer:** verified — OQ-004 (§69, OPEN, Google OAuth real vs stub) exists; no dangling pointer.
- **Q4 §12.11 parity:** §14's side clean — the seven §12.11 locked decisions cite ADR rows where applicable (row 5 → ADR-001); the full parity re-check is a §12-pass (S5–S9) deliverable, not a §14 change.

### Verification (S10-6)
Grep sweep: all ADR citations resolve within ADR-001…038 — zero dangling (only forward-looking "ADR-039 onward" rule text); ADR-005 retirement is dated per §14.2 rule 3; D4/D5 reversal precedent intact (§4.2).

### Corrections applied
§14.3 row ADR-001 (decision text) and ADR-008 (status cell). No other §14 changes — the section is otherwise audited-no-change. Register: §14 → closed (re-derived); NEXT → §15 (S11).

## F71 — S11: §15 Project structure re-derived (closed 2026-08-18)

Five stories kept; 8-question WH battery approved ("proceed"). Nine-point repo-drift table resolved (spec-side staleness corrected into the tree; zero client edits — freeze held):

1. **Recorder hook:** tree had `hooks/useAudioRecorder.js` (phantom); repo has `utils/useMediaRecorder.js` (only implementation, no other section names it) → tree + §15.6 corrected (name AND home = repo fact; §53 Mode-3 reuse anchor kept).
2. **Print surface:** §15.5 + §58.3 both said `components/print/`; repo has `components/report/print/ReportPrint.jsx` (more consistent with the §15.2.7 domain-folder rule) → both amended in the same pass.
3. **Reusable list:** added `MuiProviderSelect` (implemented) and `MuiReasoningSelect` (§46.17, **planned** — verified zero client/src references; created by the §54 correction round). S12-era §15.7.1 mirror miss corrected.
4. **utils:** added `sanitizeHtml.js` (§61.3 double gate), `wizardValidation.js` (§52), `useMediaRecorder.js`.
5. **auth/:** BrandPanel, GoogleOAuthButton, LoginForm, RegisterForm, validators.js (§48).
6. **landing/:** Hero, BranchStrip, CtaBand, HowItWorks, RuledPaper (§43).
7. **§15.3 root:** authoring-workspace node (AGENTS.md, prompt.md, `.opencode/`, task_plan.md, findings.md, progress.md, phase-6-backend-apis.md) — never imported/built/deployed; §66.3 paths now resolve (§15.8).
8. **§15.2.3 legend:** three-class state markers — `(scaffold)` / `(implemented)` / unmarked=planned, plus `(all implemented)` group form; applied across both trees (theme/assets reclassified to implemented — P3-created, not scaffold; backend env.js/constants.js/httpStatus.js implemented; logger/wavSplitter remain planned).
9. **§15.6:** hooks line (recorder hook lives in utils/) + client utils list extended.

### Verification
Grep: zero `useAudioRecorder` / `components/print/`; §58.3 path resolves; reusable-list diff vs repo = 30/30 implemented + 1 planned (MuiReasoningSelect); pages 11/11; §15.4 vs repo full match. No constants/packages introduced (§15.7.5). Register: §15 → closed (re-derived); NEXT → §12 (S5–S9).

## F72 — S5–S9: §12 System architecture re-derived (closed 2026-08-18)

Five stories kept; 7-question battery approved ("proceed"). Corrections (3):

1. **§12.3 client box** — "rich-text editor (planned @tiptap/react, §13.5)" → "(@tiptap/react + dompurify, §13.5 — installed)". Verified installed during the §15 pass (client/package.json).
2. **§12.3 Addis AI box** — "(Amharic STT + generation, fetch)" → "(… generation, SDK)" — stale S12-era string vs ADR-008/§16.8.
3. **§12.8 generation line** — overbroad "temperature, top-p, top-k, and max-output-token constants from §11" → provider-scoped: temperature across providers; top-p/top-k Gemini/NVIDIA-only (§16.4); reasoning effort rides the standing conversation default for reasoning-capable providers (§24.2, §16.6); max-output-token from §11.

### §12.11↔§14.3 parity re-check (deferred from §14, closed here)
Row 5 ("Amharic STT provided by Addis AI exclusively; Gemini and NVIDIA are text-generation providers only") is aligned with the amended ADR-001. Rows 1–4, 6, 7 are §12-owned locked decisions with no ADR rows — by design (§12.11 is the companion register). No new transport row: §12.8 prose + ADR-008 + §16.8 gate cover it.

### Verified current (no change)
SDK transport line §12.8, fallback chain, middleware chain, 30-day retention, 900 s/50 MB constants, dual-token JWT, mock/session rules, `/api/v1` health, no-correction-schema + reasoning-default correctly NOT duplicated in §12 (§12.1 never-duplicates rule). Post-edit grep on the §12 range: zero "fetch"-as-transport, zero "planned", zero overbroad "top-p, top-k".

Register: §12 → closed (re-derived) — **pass 1b complete**; NEXT → pass consistency sweep.

## F73 — Pass-1b consistency sweep (COMPLETE 2026-08-18)

Per-gate results:

- **G1 §11.7 inventory:** zero phantoms — `TRANSCRIPTION_STATUSES` (3× "no TRANSCRIPTION_STATUSES" — intentional negative), `NVIDIA_API_URL` (env §10.4, Required-no-default → correct home per the §11.2 rule; GEMINI_BASE_URL constant is the deliberate contrast), `DELETE`/`NOT_EXTENDED`/`SIGINT`/`SIGTERM`/`YYYY` (prose/platform, fine), env keys (ADDIS_API_KEY etc. — §10.4 homes), `ADDIS_AI_BASE_URL` (removal record only). Orphans: `NO_CONTENT`/`INTERNAL_SERVER_ERROR` (httpStatus) and six §11.5 mirror rows (ETHIOPIAN_MONTH_LABELS, FONT_SIZES, PICKER_DATE_FORMAT/TIME_FORMAT, REPORT_STATUS_LABELS, TOAST_AUTO_DISMISS_MS) have zero consumers document-wide BUT exist in the frozen P1 files (backend/utils/httpStatus.js, client/src/utils/constants.js) — the tables are transcripts. Resolution: (a) §11.6 completeness rule amended with a **transcript carve-out** (row present in the file stays until its consumer section is corrected; removal only with the file entry); (b) `INTERNAL_SERVER_ERROR` given a real pass-1b consumer (§12.5 global-handler line); (c) §11.5 rows stay — mirror-first (frontend pass adds the consuming references).
- **G2 §14.6 ADR citations:** `ADR-039` = forward-looking rule text (§14.2), not a citation. `ADR-002`/`021`/`022` zero citations — Owner-column anchored (021/022's owners §9.2/§9.4 are KERNEL-frozen); **ADR-002 citation added to §12.2 principle 4** ("(proxy rule, §16, ADR-002)").
- **G3 §15.8 paths:** all corrected-section paths resolve — `app/store.js` hits are `redux/`-context-relative (§15.2.7/§15.6); block-relative convention (`config/env.js`, `features/apiSlice.js`) accepted. Clean.
- **G4 §13 manifest mirrors:** **2 defects fixed**: (a) §13.4 client table lacked ALL 7 installed editor packages → 7 rows added verbatim (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-text-style`, `@tiptap/extension-underline`, `@tiptap/extension-text-align`, `@tiptap/extension-placeholder` — all ^3.30.1 — and `dompurify` ^3.4.13); (b) §13.5 "not yet installed" table still listed dompurify → row removed (addisai + NVIDIA-helper stay — verified not in backend manifest).
- **G5 §16.8 SDK gate:** 2 violations fixed — §33.6 wire-target restatement → "wire target per §16.4 (the SDK contract)"; §69 S12 closure record URL restatement → method-surface pointer-only. Re-verified: `chat_generate`/`/api/v2/stt`/`/api/stt`/`api.addisassistant.com` now appear ONLY in §16.4 (contract) + §16.8 (gate text).
- **G6 §-references:** 11/11 new cross-references resolve (§16.4/16.6/16.8, §24.2, §35.2, §46.17, §53, §54, §58.3, §61.3, §66.3).
- **G7 SC-6/SC-7:** no magic literals introduced (all named); no client-side provider keys/URLs.

Net change set: §11.6 wording, §12.2 (ADR-002), §12.5 (INTERNAL_SERVER_ERROR), §13.4 (+7 rows), §13.5 (−1 row), §33.6, §69 record. Register: sweep → completed; pass 1b fully closed; NEXT → step-5 review gate.

## F74 — Pass-1a data-model audit re-pass (closed 2026-08-18)

Owner request: "full plan for stage 2 pass 2, each schema with a correct field/value, hooks, method" — served as a schema-detail re-presentation + audit of the already-closed pass-1a sections (§17–§24A). Register pointer corrected: pass 2 = backend §25–§40, NOT §17–§24A (which were closed in pass 1a). Seven field registries re-read line-by-line (User §19, Branch §20, Report §21, Audio §22, Transcription §23, ChatConversation §24, Item §24A) plus §17.2–§17.7 and §18.1–§18.10.

**Corrections (2):**

1. **§19.3 two-TTL stale parenthetical → one-TTL doctrine.** "the only TTL declarations in the spec are the two of §18.3 (Report §21, Branch §20)" contradicted §18.3 (L4161–4174: exactly one — Report), §20.3, §21.3, §22.3, §23.3, §24.3, §24A.3, §18.10 gate, §20.10 gate, §17.2/§17.4. Reworded to "the only TTL declaration in the spec is the one of §18.3 (Report §21)". All other TTL statements already carried the one-TTL doctrine — the §19.3 phrase was the sole stale survivor of the Branch-TTL removal.
2. **§17.3 Report—ChatConversation cardinality 1—N → 1—1.** ERD cell contradicted §17.2 ("one per report"), §24.2 (`report` unique + sparse), §24.3 ("the proven §17.2/§17.3 one-conversation-per-report key"), §24.4 ("one row per report"). §24.1's gloss ("1—N exactly, i.e. a single conversation document") was a rationalization of the contradiction — corrected to "Report—ChatConversation 1—1" with the unique-sparse key cell mirroring the Transcription row; §24.1 sentence aligned.

**Verified no-change (3):**

- **A2 §24.3 chronology index** `{report, 'messages.createdAt': 1}` — no conflict with the §18.7 re-sort-on-read convention (the index serves the ordered re-merge; array position is never a key, §24.4).
- **A3 §24A.3 five indexes** — every index cites its consumer (§31.6/§50, §38/§49/§56, §6.10/§6.3); §18.3 proof rule satisfied; no field-level unique combined with a separate index; the one-comment partial unique is the model's only uniqueness (§24A.8).
- **A4 §23.2 `stt` subdoc** — §16.4 explicitly authorizes both persists: `requestId` (ADR-019 audit, L3565–3568) and `model` echo with null-if-unknown (L3569–3572); matches §23.2 and §23.10's gate exactly.

**Gate re-run:** §17.7 / §18.10 / §19.8 / §20.10 / §21.13 / §22.10 / §23.10 / §24.10 / §24A.8 grep gates re-read and satisfied post-edit (one-TTL wording, seven-entities-only, no snapshots/tombstones, raw+latest only, message triple, per-type item statuses, no invented fields, standalone sections). No constants, paths, or packages introduced.

Register: pass 1a closed + audit re-pass closed; pass 1b closed (F69–F73); NEXT → pass-1a/1b close-out report + commit request → pass 2 (backend §25–§40).

## F75 — 2026-08-19 — Route-contract review deliverable (pre-pass-2 input)

Owner demanded the complete per-endpoint request/response contract ("I asked you for every single endpoint"), then refined: no `/users` namespace ("a solo user can't call users"), no users management at all, group the file by frontend pages, JSON blocks only (no tables), then "proceed" → `.opencode/plan/route-contract-review.md` written (48 endpoints, 14 page groups + appendices; verified: 55 `###` headings = 48 endpoints + 7 cross-references, zero table lines).

- **Owner directives absorbed:** drop `GET /auth/me` (redux-persist hydration; also removes `optionalAuth` §28.4, the §42 boot-probe, §57.6 loading on it); drop `GET /auth/sessions` + `DELETE /auth/sessions/:sessionId` (cookies only; §28.2 rotation bookkeeping and the §57.4 sessions card removed); **no users management at all** (solo user — a solo user can't call users); branch-detail aggregate endpoint `GET /branches/:branchId/detail` (branch + paginated reports + analytics + items grouped by type, ADR-034 server-computed, §56.5); visits model — main branch always visits[0] in both create cases, main locked, `visits` ≥ 1, `visits[0].branch === branch` (422), `Type = visits.length` (kernel §6.4 + §21.2 amendment — sign-off item C1), `supervisorName` dropped (fullName rule §21.2); output to a file, role-play both roles per page.
- **Key correction (vs my earlier presentation):** `statusDistribution` = one `$group` per `REPORT_STATUSES` member — the four-status machine `draft → audio_attached → transcribed → generated` (§11.4 BR-06, §38.2), zero-filled, order preserved; KPIs `{reportsThisMonth, inProgress, generated, activeBranches, trends?}` literal §38.2.
- **Drift register (B1–B7):** B1 spec-internal `GET /reports/items` (§24A.3) vs `GET /analytics/items` (§38.2) → canonical analytics/items + wording fix; B2 `branchId` vs `branch` in §31/§29 → `branch`; B3 `supervisorName` still sent by current frontend (`ReportNew.jsx` step1Payload) → dropped; B4 frontend mock-era status vocabulary vs four-status machine; B5 the current frontend endpoint files register the legacy surface (accept/digest/generate/correct/correct/transcribe/content/revert, visitNo-scoped clips, POST /audios, /transcriptions plural, /auth/me, sessions) — full mapping to corrected routes (14 rows); B6 visits wire (frontend sends `[]` when no others — contract requires main at [0]); B7 mock transport legacy vocabulary (P7-deleted, recorded not corrected).
- **Decision list (C1–C8)** for owner sign-off: C1 kernel Type amendment; C2 supervisorName removal; C3 main-locked semantics (visits ≥1, [0] match, [0] undeletable, branch-swap re-validates); C4 branchId→branch; C5 branch-detail payload shape; C6 items canonical path; C7 `GET /reports/:reportId/items` returns `{ items: [...] }` (bounded, non-paginated) vs §38.2 paginated docs; C8 generations returns ReportDetailDto + latest in one response.
- Register: pass 1a/pass 1b closed; route-contract review appended as the pass-2 input; NEXT → pass-1a/1b close-out report + commit request → **pass 2 (backend §25–§40) Supervisor story gate**.

## F76 — 2026-08-19 — Route-contract fold into the spec (owner-approved "proceed"; review file deleted)

Owner: "plan to include route-contract-review.md in spec and next gate. remember, the route-contract-review.md will be deleted" → approved fold plan → executed one change set on `spec-correction` (spec + controlled files). The review file is deleted per the owner directive; its content lives in the spec (contract JSON blocks + §69.3.1 sign-off record).

- **Contract JSON blocks folded in:** §26.6 (health 200), §28 (register/login/refresh/logout/profile/avatar 200/201 + 409/422/429 shapes), §30 (POST/PATCH/archive/restore/DELETE), §30.2.1 (detail aggregate: branch + paginated reports + analytics `{reportsTotal, reportsThisMonth, statusDistribution (4-member 0-filled §38.2), openIssues, activitiesCompleted, commentCount, issuesTrend}` + items `{activities, issues, comments}`), §31 (create 201 with visits contract JSON, main-lock 422 example, PATCH 403/422, visits PUT, items `{items: [...]}`, generations single round-trip ReportDetailDto), §32 (upload 201 AudioDto, clips list, play headers, delete), §33 (TranscriptionDto 200, partial-failure `{completed, failed}`, 404 no-transcription, corrections/transcripts), §36 (chat GET 200 + POST 201 message surface `{role, content, provider, model, reasoning, createdAt}`), §37 (export content 200 JSON, docs flag-off → 404 not-mounted note), §38 (dashboard 200 JSON + items example + canonical-path note), §39 (search 200 with docs + matchedFields), §40 (seed/wipe 200 + not-mounted 404 note).
- **Removals applied:** §28 matrix — `GET /auth/me` row gone (hydration via redux-persist), sessions rows gone, `optionalAuth` removed (§28.4) with a §28.7 collision-heuristic fix; §42.3 boot-probe wording; §57.2/§57.6 sessions references; **§57.4 retired** (retirement pattern of §6.11, number kept); §56.5 rewritten to the detail aggregate (one call, never fans out).
- **Renames/wording:** `branchId` → `branch` wire field everywhere (route-param `:branchId` forms kept — §9.3); §24A.3 `GET /reports/items` → `GET /analytics/items` canonical (B1); §29.3 legacy visitNo wording already clean; §6.10 row 7 "Zero visits or no audio" → "No audio (visits are never zero…)".
- **Kernel C1 (owner-approved via "proceed"):** §6.4 Type-1/Type-2 rewritten (Type = visits.length; main at [0]), §5 BR-03 updated, §6.8 locked decision 3 updated, §21.2 `visits` field registry row rewritten (≥1, main-locked, index 0 undeletable), §21.7 visits-contract wording, §21.1 no-supervisorName note extended (422 if present).
- **Fold-time correction (review-file deviation):** the review file drafted "duplicate branch name → 409"; the spec's canonical rule §30.3/§30.7 (no unique index, duplicates allowed — §20.4) governs; the 409 wording was folded away and the deviation recorded at §69.3.1.
- **§69.3.1 fold record** added: C1–C8 sign-off dispositions (all RESOLVED; C1 kernel-approved), endpoint removals recorded, new endpoints recorded, fold-time correction recorded.
- **Verification:** all legacy backticked route literals in the spec are removal/retirement/correction-record contexts only (`GET /auth/me` 4×, sessions 2×, digest 1× — all negative); live endpoint rows counted in §28/§30/§31/§32/§33/§36/§37/§38/§39/§40 matrices (49 rows incl. the google stub — the contract's 48 grouping folded per page); matrices + JSON blocks present for every endpoint.
- Register: pass 2 input = the folded contract (§26.6/§28–§40); NEXT → close-out sweep + commit request (gated) → **pass 2 (backend §25–§40) Supervisor story gate**.

## F77 — 2026-08-19 — Pass 2 (backend §25–§40) exhaustive read + close-out (owner "proceed"; one change set)

Owner: "Exhaustively go through §25 §26 §27 §28 §29 §30 §31 §32 §33 §34 §35 §36 §37 §38 §39 §40 and plan to complete" → full plan presented (findings F1–F18 register, 18 supervisor stories, WH battery W1–W9); owner: "proceed" → all applied in one change set on `spec-correction`.

**Findings register (F1–F18) + derived answers, all applied:**

- **F1 (§31.6)** — folded JSON's "403 at `generated`" for `PATCH /reports/:reportId/content` removed: content editable at every status (BR-10; matrix errors were already "404, 422"). Added the allowed-at-every-status parenthetical to the JSON.
- **F2/F3 (§36.7/§36.4)** — example triples are now §11.4 register members (`gemini` / `gemini-3.1-flash-lite`, `"reasoning": "medium"`); the `anthropic`/`claude-3-5-sonnet-20241022` literals and the `"reasoning": false`/`null` values are gone. §36.4 states the rule: every message — user and assistant — carries the recorded `AI_REASONING_EFFORTS` string, never `null` (§24.2 registry: String required; the user turn records the effort governing it). Note added above the GET JSON: example values are register members only.
- **F4 (§39.3)** — search example corrected to branch-index semantics: `title: "19-08-26"` (report date), `subtitle: "Addis 6 Kilo"` (matched branch name), `matchedFields: ["name"]`; the item-text subtitle and `["latest","items.text"]` are gone (transcription/item text never indexed, §39.2). Prose now states `matchedFields` = the branch-index field(s) matched (`name` and/or `location`).
- **F5 (§40.2)** — seed response `users: 2` (the §25.3 persona account + the second user); prose records both accounts counted, the persona is not the current user, BR-13 exercisable at data level; stray "(D5)" marker removed (D5 is Translation — meaningless here).
- **F6 (§34.6)** — generation response aligned to the approved C8 ReportDetailDto single round-trip (`{ report, transcription: { latest, items } }`); the stale "ReportDto … and `data.content`" retired (grep: `data.content` now only in the negative context).
- **F7 (§37.5)** — content-retrieval prose corrected: content returned as stored (the `latest` HTML), sanitized per §61; the §58 PDF path formats from markup, TXT/CSV/XLSX strip client-side (W3 answer).
- **F8 (§28.7)** — duplicate-email 409 copy unified to §28.3's "An account with this email already exists" (§60.6 is samples-only; the register copies are the contract).
- **F9 (§26.4)** — no **public static mount** wording (uploads service-internal §32; avatar served only via authenticated `GET /auth/avatar`, §28.5) — the "avatar serving is not an Express route" contradiction fixed.
- **F10 (§40.4/§40.5)** — one 404 mechanism only: **conditional mount** (dev-only per §26.2 frozen config); `ensureMockEnabled` guard and its "Mock data is only available in development" copy removed — outside development any call falls to the §27.5 not-found handler (404 "Route not found"). §40.7 gate updated to "no `ensureMockEnabled` guard exists".
- **F11 (§31.4/§24A.2/§24A.4)** — persistence cross-refs corrected to §34.6 (the §34.4 schema references elsewhere are verified correct — §34.4 is "Structured-output schema & parsing").
- **F12 (§32.2/§32.8)** — video rejection is a plain MIME rule (recorder audio-only §53; no video path; NOT a deferred feature — §4.2 D1 is TTS): 422 with "Only audio recordings are supported" (inline copy, §60.6 samples-only); the "§19.1 placeholder message (deferred D1)" reference removed (§19.1 has no placeholder; the §32.8 "§19.1 (video out)" cross-check item removed).
- **F13 (§30.3)** — drafting artifact ("location optional? no — required per §20: …") cleaned.
- **F14 (§33.7)** — granularity explicit: per-audio; `completed` = audios whose chunks all succeeded in this call, `failed` = audios with failed/pending chunks (re-call re-runs only those; succeeded chunks skipped; spans idempotent) (W7 answer).
- **F15 (§32.3)** — clips-list prose names the paginated §27.6 shape (JSON was already paginated).
- **F16 (§38.2)** — "§24A's filtering table" removed: the item filter contract is defined first in §38.2 itself (verified: `dateFrom` appears nowhere else).
- **F17 (§36.6)** — row race is a raw 409 `CONFLICT` (§29 never remaps it; the client re-reads and retries naturally), matching the matrix's "409 (row race)" (W9 answer).
- **F18 (§15.5)** — `authEndpoints.js` tree comment updated to register/login/refresh/logout/google-stub/avatar; `profileEndpoints.js` "+ sessions" removed (§57.4 retired).
- **Also applied (4):** §28.3 matrix `PATCH /auth/profile` request includes `firstName?`/`lastName?` (matched §57.3's editable list); §28.8 grep gate includes the §28.6 stub (`GET /auth/google`); §28.2 rotation records the documented acceptance that a stolen refresh token stays usable until its 7-day expiry (reuse undetected without a store — mirror of the 15-min access-token window, W8 answer); §60.7 sample list drops the retired sessions empty-state ("No other active sessions").

**WH battery answers (W1–W9) applied per the plan:** W1 seeded rows owned by the calling user; the two fixture accounts are non-`user`-scoped writes (count 2). W2 reasoning always recorded, never null. W3 export content = stored `latest` HTML (sanitized); §58 flows extract per format. W4 matchedFields = branch-index fields. W5 video copy inline ("Only audio recordings are supported"). W6 conditional mount only. W7 per-audio granularity. W8 refresh-reuse acceptance documented. W9 raw 409.

**Verification:** grep gates re-run — `anthropic`/`claude`/`"reasoning": null|false`/`This email is already`/`ensureMockEnabled`/`§19.1 placeholder`/`deferred D1`/`24A's filtering`/`"users": 1`/`location optional`/`No other active` = 0 in the spec (remaining hits are §69.3.2 record quotes or the negative-context gates); §34.4 references verified schema-flavored (section exists — no over-fix); video references coherent (§32.2 rule, §32.6 matrix, §32.9 gate); §28.3 vs §28.7 copies identical; `data.content`/`ensureMockEnabled` only in negative contexts. Working files updated (task_plan register 16/16 closed; §69.3.2 record added).

Register: pass 2 CLOSED 2026-08-19 (16/16 dispositions; 12 re-derived, §25/§27/§29/§35/§38 audited-no-change). NEXT → close-out sweep (git status/diff + grep gates) + commit request `chore: spec-correction pass 2 backend close-out` (gated) → pass 3 (frontend §41–§60) Supervisor story gate.

## F78 — 2026-08-19 — Pass 3 (frontend §41–§60) UI/UX front-load + R1 design foundation (owner "proceed"; no commits per owner)

Owner: "for all pages just like you did for dashboard pages, make an exhaustive analysis and make each page UI/UX astonishing" → the frontend-design skill applied to every surface; full per-page analysis + diagrams presented; owner: "Now show me the full plan Pass 3 — frontend §41–§60 and UI/UX" → full plan (20-section register, 22 supervisor stories, WH battery, 13 rounds, verification, git protocol) presented; owner: "proceed, don't do 6. Git protocol (§9.8)" — plan approved, no commits, branch `spec-correction`.

**Design identity (locked):** "the supervisor's field notebook" on the dictation desk — one artifact metaphor per surface: ledger band (dashboard), sign-in sheet (login), intake sheet + name-reveal (register), date-stub index + file-tab cards (reports), document masthead + filing stamps (details), pre-printed form (wizard), registry signboards (branches), ID card (profile), margin-notes chat (chat), ruled index (search). Two normative rules added to §43.2: the Amharic-moment rule (content Amharic exactly once per page surface) and the data-presentation rule (tabular numerals + hairlines; no icon chips on KPI/stat presentation).

**R1 spec amendments applied (§66.6 same change set):** §43.2 per-surface identity + two rules; §46.17 MuiStatCard usage note (dashboard row superseded); §48.3 sign-in sheet (entry datum `TODAY · EC date`, left margin hairline, signing act, static brand panel); §48.4 intake sheet + name-reveal (helper text re-pointed); §49.2 the day's ledger band (supersedes the four-card row; bucket matrix xs 2×2 / sm date-row / md+ single row 1.4×); §49.3 four ledger cells; §49.6 breakpoint matrix row; §49.7 gates; §49.1 cross-ref; §51.2 document masthead (ቀን serif ~28px + ስም letterhead + Type/status stamp chips); §52.4 pre-printed ስም line; §56.3 signboard cell (Location column merged into the name cell subline; responsive rule + §56.7 matrix updated); §56.5 signboard header; §57.3 ID-card face; §69 OQ-014 (name-reveal mirror, open).

**Architect decisions:** ThemeToggle is conformant — §43.4 already defines the dark scheme, so no OQ row (paper identity is mode-aware, light-first). Waveform stays landing-only everywhere (static brand panel). The Location column's merge into the signboard cell was an Architect call (single source of the branch's identity; §56.3/§56.7 mirrors updated in the same change).

**Register:** pass 3 in progress; R1 complete → R2 shells. No commits (owner: don't do Git protocol).

## F79 — 2026-08-19 — Pass 3 FREEZE CORRECTION: spec-only scope (owner)

Owner: "why you touch backend/ or client/ working files doesn't permit to touch them" — the pass-3 "proceed" approved the PLAN, not client/backend edits; the freeze rule stands (no `backend/*` and no `client/*` edits while the spec is not fully corrected). Two client files touched in R2 were reverted via `git restore` (AppShell.jsx, GlobalSearchDialog.jsx); only `.opencode/plan/project-specification.md` + the working files remain modified.

**Pass 3 re-scoped to SPEC-ONLY.** The UI/UX directions land as normative spec amendments (§66.6), implementation is deferred to Stage 5 (frontend linking) after the Stage 3 hard gate, backend-first per Stage 4. Amendments completed after the correction: §50.4 date stub (serif 600 tabular DD-MM-YY), §50.5 ReportCard file-tab notch (border/pseudo-element, no new component), §55.2 margin-notes panel (paper tint + hairline top edge, ቀን serif, Amharic-once), §59.2 ruled index (serif key text). §47/§53/§54/§58/§60 audited-no-change (the §47.4 selected state already reads as the raised file tab; §58 naming closed at OQ-006). Register rows corrected from implementation-round evidence to amendment evidence. NEXT: per-section audit closes (§41/§42/§44/§45/§47/§53/§54/§58/§60 reads) to 20/20, then pass-3 close-out report + commit request (gated).

**F80 — Pass 3 audit reads closed 20/20 (2026-08-19).** Final audit reads performed on the remaining unread sections, all audited-no-change: §41 (frontend foundation — flat route map, guards, `_id` keying, static NotFound/AppErrorPage; no amendment needed), §42 (network layer — reauth chain incl. the no-boot-probe owner directive, envelope unwrap, tag families; no amendment), §44 (customizations — contracts bind; one stale reference fixed: §44.6 "KPI cards of §49" → "the dashboard's §49.2 ledger band is a flat ruled surface, not a card", same-change discipline with the §49.2 supersede), §45 (responsive — five buckets, icon-only rule, landscape clause, focus/motion; no amendment), §47 (layout — search trigger §47.5 and the raised file-tab selected state already normative; no amendment), §60 (universal UX — states protocol, single trigger API, toast catalogue, error boundary; no amendment). Combined with the earlier §47/§53/§54/§58 reads and the R1 re-derivations (§43/§46/§48–§52/§55–§57/§59), the pass-3 register is 20/20 dispositions, zero partials. NEXT: pass-3 close-out report + commit request (gated).

## F81 — 2026-08-19 — Pass 4 (cross-cutting §67/§68) re-derivation; register 51/51 (owner: "proceed"; spec-only)

Owner: "do it exhaustively and Read, understand and respect AGENTS.md findings.md progress.md prompt.md README.md task_plan.md" → all six files read in full; the exhaustive pass-4 plan (10 stories P4-S1…S10 + full WH battery) presented → owner: "proceed" — plan approved; spec-only (freeze stands).

**Citation-verification sweep (every §67 control citation re-read at its owning section):** §16.5 (retry schedule, 402→502 top-up→fallback, `.retryAfter` cap, STT chunk semantics — the bullet still said "the final transcription fuses the succeeded chunks", contradicting §33.7), §27.3 (AI tier caps provider calls; Retry-After maps into tier rejection), §31.8 (session template §27.7; conflicts surface as toast §27.5/§60 — no 422/409 wording), §33.7 (no partial merge ever persisted; per-audio granularity; re-run succeeds from failed/pending only), §36.6 (raw 409 CONFLICT never remapped; client re-reads/retries), §55.3 (sanitize rule before render), §34.6 (report-detail aggregate + §31.6 single round-trip), §40.4/§40.5 (session safety + conditional mount), §24.2 (standing reasoning S12), §19.2 (derived-name rule), §46.6 (ethiopianDate.js + MUI adapter), §63.6 (SC-1 real-Amharic wizard walk), §26.2/§26.6 (fail-fast boot; health endpoint), §62.3 (session-transaction hard delete, reference check), §13.5 (addisai row), §65.6 (no backups). §68.4 maxima greps: BR-19 / ADR-038 / OQ-014 / A6 / G9 / F9 / D5 / SC-8 — all confirmed unchanged.

**Corrections applied (one change set):**
- §16.5 (owning-section-first): stale "fuses the succeeded chunks" → the §33.7 no-partial-merge semantics (report stays `pending` until every chunk succeeded; the re-run succeeds from failed/pending audios only).
- §67.2 register re-derived: R-1 (paid-policy residual added; §16.2 is the current pricing reality), R-3 (residual → "report stays `pending`; no partial merge is ever persisted, §33.7"), R-4 (`.retryAfter` via SDK + OQ-011 + STT chunk marked failed), R-13 (cites verified — §46.16 editor output contract + §55.3 sanitize rule), R-14 (Fail-fast boot §26.2/§26.6; health endpoint §26.6 — the old §65.5 cite was wrong), R-15 (session template §31.8/§27.7 + toast §27.5/§60; chat-row race = raw 409 §36.6), R-17 (no-backups §65.6 + §62.3 unlink-after-commit order), R-20 (verified), R-21 (unchanged). **Four previously unregistered risk classes added:** R-22 AI credit exhaustion (402 → top-up message; STT cannot fall back — Addis-only ADR-001), R-23 Ethiopian-calendar conversion errors incl. Pagume (§46.6/§43.6 path; SC-2 walk gate), R-24 STT accuracy vs the SC-1 bar (no numeric claim — SC-8), R-25 addisai SDK single-vendor dependency (ADR-008 + §14.4/§13.7 replacement path) — each citing only existing controls (SC-8: no new control text, no numeric scoring).
- §67.3: new standing mitigation "Paid AI is a user-facing cost, not a silent one" (R-22). §67.5: cross-section mirrors updated (R-22…R-25, §33/§46/§16).
- §68.3: "Visit" row + main-locked `visits[0]` (never reordered/removed, §31.2-1/§31.9); "Wizard steps 1–5" → "Wizard steps (four)" (§52.2 four-step merged model); "Candidate → save flow" "(round-6)" token removed; **10 backfilled rows** (main-locked, report-detail aggregate, single round-trip, ephemeral candidate, conditional mount, top-up message, standing reasoning, derived name, ledger band) + backfill note restoring the §68.2 rule-2 discipline; §68.5 mirrors updated.

**Verification:** diff scope = spec + 3 working files only (no backend/client); "fuses the succeeded chunks"/"fuse of succeeded chunks" = 0 in the spec; every new control citation resolves to an authored subsection (resolution sweep); remaining "(round-6" hits are in-section amendment-provenance annotations, not the §68 table.

**Register: pass 4 CLOSED 51/51 dispositions (18 KERNEL untouched).** NEXT → pass-4 close-out report + commit request (explicit owner approval required) → Stage 3 (§63.9 C1–C6 audit; zero `TODO(open)` without an OQ row).

## F82 — 2026-08-19 — Stage 3: §63.9 specification-integrity audit (C1–C6) green; single-source-of-truth milestone (owner-approved plan)

Owner approved the Stage 3 plan ("proceed") with two C2 dispositions: the §15.6 planning-note tree row stays as the sanctioned repo manifest, and the §69.3.1 route-contract-review.md mention stays as the sanctioned deletion record.

**C1 — Internal links closed.** Read-only tooling (citation extractor vs heading index, kept in the planning tooling): 7931 citations vs 654 headings. **3 stale cites fixed:** §21.5 ×2 (nonexistent subsection — §31.4 status matrix and §25 mock rule retargeted to §58/§37, the real "exports are never persisted" homes) and §4.10 in §52.3 (nonexistent — reworded to "the one-payload submission of the original contract is superseded"). The §N.M-K convention resolves against its base by design. Zero unresolved.

**C2 — No work-note leaks.** Nine `editor.md §x` provenance citations pruned to decision-only form (dates kept, paths dropped): §14.4, §46.16 ×5, §53.5, §54.2, §66.9. Two tokens kept per owner disposition (manifest + deletion record). `editor.md` count = 0.

**C3 — TOC injected.** **One missing entry fixed: §24A (Item Model)** — the list jumped §24→§25; added with its anchor. Anchor-resolution check: 70/70 numbered entries resolve; Part dividers + TOC itself intentionally unlinked.

**C4 — No reserved anchors.** Green ("reserved anchor" only in §63.9's own definition).

**C5 — No external dependence.** One dangling pointer fixed: §30.2 "the review file's draft 409" → "the draft contract's 409". Remaining artifact mentions = the two sanctioned C2 tokens only.

**C6 — Sign-off.** Single run green ⇒ single-source-of-truth milestone; record appended as §69.3.3. `TODO(open)` reconciliation: the marker exists only at its 5 definitional sites — zero markers without a §69 row; every OPEN OQ (003/004/008/009/010/011/012/013/014) has its owning-section pointer + blocks column.

**Verification:** C1 re-run after the edits = zero misses; diff scope = spec + 3 working files only. Register reconciled 51/51 zero partials (18 KERNEL untouched). NEXT → Stage-3 close-out report + commit request (gated) → §9.8 branch lifecycle → Stage 4 (backend-first re-implementation, §15.4).

## F83 — 2026-08-19 — Effort reorientation: implementation & re-implementation (owner directives)

The spec-correction effort closed with `7fb1580` (owner: "only commit" — no push, no branch lifecycle, no Stage 4). The owner then gave three directives that reorient the effort from correction to implementation and re-implementation:

1. **Reorientation:** make AGENTS.md, findings.md, progress.md, prompt.md, task_plan.md state implementation & re-implementation instead of spec-correction.
2. **Strict protocol chain (verbatim):** Phase protocol (§66) + specs (`.opencode/plan/*`) + skills (`.opencode/skills/*`) + AGENTS.md + findings.md + progress.md + task_plan.md → role agent = Supervisor + Software Architect/Engineer/UI-UX + Design Lead ⇒ implementation ⇒ Postman-like tests until all green (backend only) ⇒ phase-protocol step 5 (backend only: request to run the script to test and verify) ⇒ document ⇒ phase-protocol step 6 ⇒ ready for the next.
3. **Hard gate (verbatim):** unless the backend is completed, the frontend is never re-implemented.

**Consequences recorded:**
- The role model gains **Design Lead** (owner directive): agent = Supervisor + Software Architect/Engineer/UI-UX + Design Lead; the owner remains the interaction partner only.
- Per-phase flow for every backend phase: implement → Postman-like tests until all green (backend only) → step 5 (backend only: request to run the script to test and verify) → document → step 6 → ready for the next. At the step-5 gate of backend sub-phases the owner runs the test script to test and verify.
- Stage 4 (backend implementation per §15.4) is NEXT; Stage 5 (frontend re-implementation) is strictly gated on backend completion — zero `client/*` edits during Stage 4.
- Branch lifecycle stays gated: implementation moves to a new branch per §9.8 and `spec-correction` is deleted, only with explicit owner approval.
- The §66.5 chain now reads: standing instructions → corrected spec as sole behavioral input → logical reasoning → implementation; the corrected spec (51/51, C1–C6 green, §69.3.3) is the complete behavioral contract — the codebase is implemented toward it, never cited as justification.

**Change set (same change):** AGENTS.md (repository status + protocol section), prompt.md (full rewrite — correction content becomes the closed record, operative content is implementation & re-implementation), task_plan.md (title/goal/Next Step/stages/standing rules), findings.md (F83), progress.md (session log). Spec untouched (already committed at `7fb1580`). NEXT → Stage 4 (backend-first per §15.4; per-phase flow above).

## F84 — 2026-08-19 — Stage 4 prep (branch created, plan laid, NOT started)

Owner directive: "commit, checkout and prepare for stage 4 but don't start". Executed:

- **Commit** `b58082e chore: reorient controlled files to implementation & re-implementation` on `spec-correction` (the 5 controlled files; 171 insertions / 117 deletions).
- **Checkout:** new branch `stage-4-backend` created from `spec-correction` (owner's "checkout" = the §9.8 branch lifecycle — new implementation branch; `spec-correction` retained, deletion still gated).
- **Prep (no backend/client files touched):**
  - Backend state audited: P1 foundation only (`config/env.js`, `utils/constants.js`, `utils/httpStatus.js`); full §13.3/§13.5 dependency set already installed (express 5.2, mongoose 9.7, winston, express-validator, multer, bcryptjs, jsonwebtoken, helmet, cors, compression, express-mongo-sanitize, express-rate-limit, cookie-parser, dayjs, axios, mongoose-paginate-v2, express-async-handler, dotenv, winston-daily-rotate-file) → **no installs planned** (§66.8; §16.4 NVIDIA helper P7-conditional, never proactive). `server.js`/`app.js` absent → `npm run dev` fails until sub-phase 1.
  - §15.4 tree + §66.9 P6 rows read as the Stage-4 contract; six sub-phases laid into task_plan.md (foundation → models → identity → domain APIs → aggregations → seeding & sweepers) each with owning sections, §15.4 deliverables, exit gates, and the per-phase flow (implement → Postman-like tests until all green (backend only) → step 5 = owner runs the test script → document → step 6 → ready for the next).
  - Stage 4 COMPLETE definition recorded: §15.4 tree implemented, every endpoint Postman-green with result ledger, backend on :4000; then (and only then) Stage 5 frontend re-implementation.
- **State:** working tree = 3 controlled files modified (task_plan, findings, progress) — uncommitted, awaiting the next gated commit. NEXT: Stage 4 sub-phase 1 (Foundation, §26/§27) — NOT started until the owner's go.

## F85 — 2026-08-19 — All branches merged to main; only main left (owner directive)

Owner directive: "add, commit, push, merge all branches to main and clean them from local/remote and ensure only main is left". Executed:

- **Commit:** `b1a5ff5 chore: stage 4 prep (sub-phase plan, F84, session log)` on `stage-4-backend` (the 3 pending working files).
- **Push:** `spec-correction` + `stage-4-backend` pushed to origin (phase-4-frontend-pages and main were already in sync).
- **Merges (conflict-free — linear chain off `main` 8ce7b2a, three `--no-ff` merge commits on `main`):** `merge: phase 4 frontend pages (close-out)` (71 files — phase-4 client pages + mirrors), `merge: spec-correction corrections + reorientation (close-out)` (9 files — spec corrections + reorientation + prompt.md), `merge: stage 4 backend prep (implementation ready)` (3 files). `main` pushed to origin (8ce7b2a..8c2374c).
- **Cleanup:** `phase-4-frontend-pages`, `spec-correction`, `stage-4-backend` deleted locally (`git branch -d`, all merged) and remotely (`git push origin --delete`). Verified: local + remote show **only `main`/`origin/main`**.
- **Record:** branch-lifecycle lines in AGENTS.md/task_plan.md updated (post-merge record, same-change discipline §66.6). Stage 4 continues from `main` — sub-phase branches per §9.8. NEXT: Stage 4 sub-phase 1 (Foundation, §26/§27) — awaiting the owner's go.

## F86 — 2026-08-19 — Exhaustive backend analysis + full implementation plan (owner approved)

Owner directive: "make exhaustive analysis and prepare a full backend implementation plan". Four explore agents extracted the corrected spec's backend surface (data layer §17–§24A/§18 conventions/§11.3/§16; foundation+identity §26–§29/§13.3/§13.5; domain APIs §30–§36 incl. §31.4 transition-guard table; aggregations+gates §37–§40/§61–§63/§66.9 P6-P7/§66.10-11). Plan synthesized, presented, owner approved with three decisions: **per-sub-phase branches** (§9.8), **hand-rolled allowlist sanitizer** (§61.3/§61.4, no new dep), **start sub-phase 1 on plan-mode lift**.

**Ground-truth audit of the P1 foundation (gaps to fix):**
1. `backend/utils/constants.js` — `REPORT_STATUSES` still the OLD 5-state (`reviewed`,`completed`); corrected §11.4 = 4-state `['draft','audio_attached','transcribed','generated']`. **Stale — must re-sync.**
2. `constants.js` ships the BANNED `ADDIS_AI_BASE_URL = 'https://api.addisassistant.com'` — §16.7: "No `ADDIS_AI_BASE_URL` constant exists (removed 2026-08-18 — SDK-internal)". **Must be deleted.**
3. Missing: `ITEM_TYPES`, `ITEM_STATUSES`, `ITEM_STATUSES_BY_TYPE`, `AI_REASONING_DEFAULT` (`'off'`).
4. **addisai ^0.2.0 is a §13.5 planned install with entrance gate "P6 transport phase"** → installs at sub-phase 4 (corrects F84's "no installs planned" — that held only until the transport phase). NVIDIA helper P7-conditional, never proactive.
5. Server-side sanitize-on-write (§61.3): owner decision = hand-rolled allowlist sanitizer (no manifest change).
6. §38.5 Ethiopian-month bucketing needs a backend calendar util → §15.4 tree amendment `utils/ethiopianDate.js` (mirror of client §6.3/§43.6), same-commit (§66.6).
7. `env.js` (frozen, fail-fast, §10.4 required set + defaults) and `httpStatus.js` (§11.6) verified CORRECT — no change.

**Stage-4 execution plan finalized into task_plan.md** (sub-phases 1–6 with per-file inventories, endpoint matrices, exit gates, per-phase flow; finalized branch map). NEXT: sub-phase 1 (Foundation & constants re-sync, §26/§27/§11) on `phase-6-backend-foundation`.

## F87 — 2026-08-19 — Terminal-visible verification contract (owner directive)

Owner directive: the step-5 verification run must show every request/response JSON + PASS/FAIL on the terminal so the owner can watch each check live and gate sub-phase transitions with confidence. Owner asked for the requirement to be **strictly stated first** in the controlled files and the spec, then implemented.

**Architect decision (owner: "you know your role"):**
1. **Scripts live in the repo** under `backend/scripts/` (`test-<NN>-<name>.mjs`, per sub-phase) — a versioned, reproducible artifact for the step-5 gate across all six sub-phases (better than ephemeral temp tooling).
2. **Node 24 + built-in `fetch`** (not bash/curl, not Python): a single Node process fires requests concurrently — the whole suite runs in ~2–3 s; bash+curl cost ~40–60 s (105 sequential `curl.exe` process spawns on Windows). Zero new dependencies (§66.8 clean).
3. **Terminal-visible output per check:** request (method + path) → response status + full JSON body → PASS/FAIL; non-HTTP checks labeled `MODEL CHECK` / `UNIT` / `SWEEPER`; suite ends `PASS=N FAIL=M` + non-zero exit on any failure.
4. **Grep-gate boundary:** scripts write via `process.stdout.write` — no `console.log` literal — so the §9.5/§63.4 "no console.log in backend/" gates stay green. This resolved the collision that a naive `backend/scripts/` would have caused.
5. **Per-endpoint visibility:** suites group checks per endpoint (`─── <endpoint> ───` section headers) with an `--only=<endpoint>` filter — per-endpoint focus without 30 fragmented files.
6. **Operational note:** restart the backend before each suite run — the in-memory rate-limit store resets on restart (15-min global window).

**Amendment set applied (one change set, §66.6):** spec §63.10 (new normative subsection), §15.4 tree `scripts/` entry, §63.4 Scripts gate row; AGENTS.md (per-phase flow step 5 + Verify commands); prompt.md (§7 rewritten to the Node/fetch terminal-visible standard, curl example replaced); task_plan.md (verification script contract block); findings F87; progress log. Sub-phase 1 execution resumes after this set lands (owner: "then ask me to back to the Sub-phase 1").

## F88 — 2026-08-19 — Sub-phase 1 close-out findings + long-running-command rule

**Exhaustive sub-phase 1 review (owner request) — verdict: implemented correctly, suite 12/12 green.** Findings:

1. **`npm run dev` broken (owner report) — TWO root causes, both confirmed:**
   - **nodemon restart loop:** nodemon 3.1.14 default `ignoreRoot` = `.git/.nyc_output/.sass-cache/bower_components/coverage/node_modules` only — `backend/logs/*` is watched; every Winston file write restarts the server forever. Fix: `backend/nodemon.json` with `ignore: ["logs/**", "*.log"]` (+ §15.4 tree entry, same commit).
   - **EADDRINUSE:** the agent's leftover detached background server held :4000 (PID 9908); nodemon's child exited(1) and retried forever. Fix: free the port at handoff; temp mongod (PID 10756, temp dbpath) stopped — the MongoDB service mongod (PID 6724) covers 27017.
2. **Magic literals (§11.2):** `errors.js` used `err.statusCode === 400` → `httpStatus.BAD_REQUEST`; `err.code === 11000` → new constant `MONGO_DUPLICATE_KEY_ERROR_CODE = 11000` (+ §11.3 row). Both fixed in this change set.
3. **Boot fail-fast (§26.6):** `mongoose.connect` without `serverSelectionTimeoutMS` hung ~30 s when Mongo was down. Fixed: `MONGO_CONNECT_TIMEOUT_MS = 5000` (+ §11.3 row), passed to connect.
4. **Spec gap — §26.4/§27.2 chain lists omitted `express.json`:** the implementation correctly inserts it before the sanitizer (body must be parsed to strip `$`/`.` operators). Both lists amended (same commit).
5. **Deferrals recorded (not bugs):** sub-phase-1 inventory's "pagination helper, session middleware" are over-inclusive — the §15.4 tree has no such files; pagination arrives with read endpoints (sub-phase 4), sessions with identity (sub-phase 3); CastError mapping deferred to sub-phase 2 (models); the §61.3 hand-rolled allowlist sanitizer (owner decision) is a separate concern from the mongoSanitize Express-5 shim — lands at sub-phase 4. env.js "pre-defined .env" slot = backend/.env (no root .env exists) — accepted derivation.

**Long-running-command rule (owner directive, strictly stated in AGENTS.md, findings, progress, task_plan, prompt.md, spec §63.10):** commands must return promptly — never burn a timeout; prohibited: `nohup … & disown` backgrounding (holds the capture pipe), `Start-Process -RedirectStandardOutput/-RedirectStandardError` (blocks until child exit), recursive `grep -r` over node_modules, `sleep` > 3 s chains; detached dev servers start via a single redirect-free `Start-Process -WindowStyle Hidden`; readiness verified separately; a timed-out command is a failed command.

## F89 — 2026-08-19 — Sub-phase 2 (models §19–§24A) implementation findings

**Suite:** `node scripts/test-02-models.mjs` — **PASS=39 FAIL=0, exit 0**, DB-free (in-memory: document construction, `validate()`, `toJSON`, bcrypt). Groups: user / branch / report / audio / transcription / conversation / item / cross-model gates; `--only=<group>` verified (user → 6/6, item → 5/5). No server required for the step-5 run (non-HTTP checks, §63.10).

**Mongoose 9 introspection facts (assertion-relevant, verified in installed 9.9.1):**
1. `SchemaType.instance` returns **`'ObjectId'`** (capital D) — the historical `'ObjectID'` form is gone; the suite's first run failed 12 checks on this alone.
2. `schema.paths` includes the Mongoose-managed **`__v`** bookkeeping path — path-set assertions filter it (it is not a §N.2 registry field; transforms strip it from output).
3. Pre-save hooks live in a **Kareem instance** at `schema.s.hooks` (v9 `Schema.prototype.pre` delegates to `this.s.hooks.pre(...)`); `schema._pres` no longer exists. Hook-presence check: `schema.s?.hooks?._pres?.get('save')` (internal but stable; no public hook-enumeration API exists).
4. A plain String path without enum reports `enumValues === []` (not `undefined`).
5. Object-form enums work (`enum: LANGUAGE_CODES` → values `['am','en']`); frozen constant arrays work (`enum: REPORT_STATUSES`).
6. TTL/unique/sparse/partial declarations all read back exactly via `schema.indexes()` — the cross-model TTL-singleton and unique-edge assertions are direct.

**Model-layer decisions (flagged per the §69 rule — derived, not invented):**
1. `messages[]` message subdocs carry `_id: false` — §24.7's exposed surface is exactly `role, content, provider, model, reasoning, createdAt`; `_id:false` keeps serialized messages to exactly those six.
2. Transcription `raw`/`latest` are `required: true` with no default — §23.4 creates the row only at STT completion with both set; the registry's "(null until transcription completes)" describes the pre-row state, never a live null row.
3. Item `status`/`rating` carry custom shape-only validators (per-type set via `ITEM_STATUSES_BY_TYPE`; rating integer 0–5 + comment-only) with plain `enum`/`min`/`max` as the second net (§24A.3); status has **no schema default** (generation writes `completed`/`reported`, §24A.2).
4. No custom write statics in the model files — Mongoose's native `{ session }` options satisfy §18.5; the §28/§31/§34 flows (sub-phases 3–4) invoke them from caller-owned sessions.
5. The one TTL index is declared bare on `archivedAt` (no partial) — null-`archivedAt` docs are exempt by TTL semantics; matches the §18.3 declaration literally.
6. mongoose-paginate-v2 application deferred to sub-phase 4 with the pagination helper (F88).

**Real defects caught by the suite (fixed in the same change set):**
1. `status` default was the literal `'draft'` and `language` default the literal `'am'` — §17.7 gate (no literal status/domain strings in schema files) → now `REPORT_STATUSES[0]` / `LANGUAGE_CODES.am`.
2. `ChatConversation.messages` was missing `required: true` (§24.2 registry "yes (default [])").
3. User `toJSON`/`toObject` serialized an in-memory `password` value despite `select: false` (select only affects DB projections) — the transform now also deletes `password` (§19.5 "excluded from every transform" hardening).

**No spec/§11/§15.4 changes needed** — the §15.4 tree already names `models/`, every referenced constant already exists in `utils/constants.js`, and §13.3 deps (mongoose, mongoose-paginate-v2, bcryptjs) were already installed. Same-change discipline: working files only (this findings row, progress log, task_plan status block).

## F90 — 2026-08-19 — Sub-phase 3 (Identity §28/§29) implementation findings

**Suite:** `node scripts/test-03-identity.mjs` — **PASS=38 FAIL=0, exit 0** across seven groups via the restart-between-groups protocol (the §27.3 auth tier is 20 req/15 min): bootstrap (unit + register) 9/9, login 6/6, refresh 4/4, profile 6/6, avatar 5/5, misc 7/7 (incl. the two new logout checks), ratelimit 1/1 (the 21st rapid hit is the first 429, run isolated). Regressions on the same change set: test-01-foundation 12/12, test-02-models 39/39. Step 5 accepted by the owner; live server on :4000 + Atlas.

**Three real defects caught at integration (Mongoose 9.9.1 / lib facts — spec mirrors updated in the same change set):**
1. **Mongoose 9 async `pre('save')` hooks receive no `next`** — the §19 `hashPassword` hook (`async function hashPassword(next)` + `next()`) crashed with `TypeError` on the first real save. Latent since sub-phase 2 (test-02 constructs docs but never saves). Fixed to a pure-async hook (return the hash promise).
2. **`lean({ virtuals: true })` silently no-ops in Mongoose 9** (built-in lean virtuals removed; requires the `mongoose-lean-virtuals` plugin, outside the §13.5 set) — `fullName` came back `undefined` on all lean read paths. Fix: read paths hand full documents to the DTO mapper (`toUserDto` consumes `doc.toJSON()` — the ADR-017 transform includes the virtual). Spec amended in the same change set: §18.4 read paths, §27.7 read contract, the §20/§21/§22/§23/§24 read-contract lines (5 `.lean({ virtuals: true })` mentions), and the user.model.js virtual docblock.
3. **express-rate-limit v8.6.2 handler exposes only `resetKey`/`getKey`** (no `windowMs`/`limit`) — the UNIT-style tier introspection check was replaced by a wire-level assertion: auth responses carry `RateLimit-Policy: "20-in-15min"; q=20; w=900` + `RateLimit: "20-in-15min"; r=…; t=900` (check 24).

**Interop/behavior facts (assertion-relevant):**
1. `import { normalizeEmail } from 'validator'` fails at runtime (CJS named-export interop) — use `import validator from 'validator'` + destructure. express-validator named imports work.
2. express `clearCookie` emits `Expires=Thu, 01 Jan 1970 00:00:00 GMT` (no `Max-Age=0`) — cookie-clear assertions tolerate both forms.

**Derived decisions (flagged per the §69 rule — never invented):**
1. Fixture emails are per-run unique (`sp3.<runid>.<rand>@example.com`); one invisible Atlas row per suite run (no delete endpoint; single-user app — accepted).
2. Register names derive from the email local part (first segment + remainder joined by `.`); client-supplied names rejected 422.
3. The at-least-one-field PATCH rule is a whole-body validator mounted after multer so it can see `req.file`; 422 message 'Provide at least one field to update'; whole-body failures carry `field: ''` in details (the §29 details shape has no contract field name for whole-body errors — the message carries the meaning).
4. Avatar: deterministic filename `<userId>.<ext>` under `uploads/avatar/` (gitignored); two-phase write (file first, then document) with best-effort unlinks of the new file on failure and the previous file on success; paths stored relative and served via `path.resolve(process.cwd(), avatar)`; `Cache-Control: private, max-age=300` (derived); a missing file is the same 404 as a missing avatar.
5. Derived copy additions: 'Sign in to continue' (401), 'Profile updated', 'Invalid identifier' (CastError), 'File is too large' (MulterError LIMIT_FILE_SIZE), 'Avatar must be a JPEG, PNG, or WebP image' (fileFilter), 'Too many requests — please wait a moment and try again.' (rate-limit body).
6. Forged-token checks (expired access, refresh-as-access) sign with the real secrets imported from `config/env.js` (sanctioned read; values never printed).
7. No dummy password-compare (documented acceptance — the identical-401 shape is preserved).
8. `EXTENSION_BY_MIME` in auth.controller.js is keyed by the `AVATAR_ALLOWED_MIME_TYPES` constant values (a mirror, not a new literal source; the mapped values are file-format facts).

**GAP closed:** the misc group gained the two missing §28.3 logout checks (65: logout without a session → 200 idempotent; 66: logout with a session → both cookies cleared to `Expires=Thu, 01 Jan 1970`). Trailing newline restored in routes/index.js.

**Watch items (accepted, not defects):**
1. A multipart avatar with a valid file but a 422-failing field leaves an orphaned file (deterministic filename → overwritten by the next successful upload; uploads dir gitignored).
2. The `previous` read in updateProfile sits outside the try (a throw there would leak the new file — unreachable in practice: authenticate already loaded the user).
3. test-01-foundation's `process.env.TEST_BASE` is a known drift candidate for the §63.4 process.env gate — flagged for a gate-clarification pass.

**Grep gates clean:** no `console.log` (suite uses `process.stdout.write`); `role` only in the §24 chat message schema; no `GOOGLE_` env reads; no numeric status literals; `2592000` only in constants.js; no `.id` access outside model transforms; no logger calls in the auth surface (JWT/cookie values never logged — ADR-019); auth surface = exactly 7 endpoints, stub mounted once at `/auth`.

**Spec amendments in the same change set (§66.6):** §15.4 tree — `utils/errors.js` row + `(implemented)` markers for logger/errors/mongoSanitize/rateLimit/auth/auth.routes/auth.controller/validation/user.validator; §18.4 read paths; §27.7 read contract; §20–§24 read-contract lines (lean-virtuals wording); user.model.js virtual docblock.

**Environment lesson (recorded):** the owner's 23:03 `npm run dev` hit EADDRINUSE because the session's detached test-runner chain still held :4000. Discipline: kill the session dev-server chain when suite work ends — never hand off a busy port. Both chains were killed and the port verified free before the step-5 handoff.

## F91 — Sub-phase 4 grounding + plan approval (domain APIs §30–§36)
- **Plan approved by the owner ("Proceed…exhaustively"):** full plan delivered twice (final version = the complete 13-section plan with deep derivation reasoning; D8 resolved as option 1 + the row-ledger refinement). Execution began 2026-08-20.
- **Grounding reads (all verified against the spec, no drift):** §22/§23/§24/§24A model registries (paths, indexes, transforms, TTL doctrine), §11.3/§11.4/§11.6 constants + httpStatus (all present in `utils/constants.js` incl. ITEM_TYPES/ITEM_STATUSES/ITEM_STATUSES_BY_TYPE/AI_REASONING_DEFAULT; `ADDIS_AI_BASE_URL` correctly absent), §13.3/§13.5 (addisai ^0.2.0 planned, P6 gate = this sub-phase; `mongoose-paginate-v2` ^1.9.5 already installed), §38.5 Ethiopian-month bucketing (date interpreted through Ethiopian calendar month boundaries; null date excludes the bucket, 404-free), §61.3/§61.4 sanitize-on-write policy (server = hand-rolled allowlist sanitizer per owner decision; dompurify is client-only; "strips markup, never content"; `±` passes through), §62 sweeper (two passes; branch removal is reference-checked; exactly one TTL = Report archivedAt; audio files unlinked after commit, retried by orphan sweep).
- **Backend codebase grounding (no drift from spec):** 7 model files match §19–§24A exactly (path sets, indexes, single TTL, transforms, Item validators, ChatConversation 6-field message surface); `config/env.js` is the only `process.env` reader but lacks FFMPEG_PATH/FFPROBE_PATH + the addisai SDK instance (§16.7 — to add); `middleware/rateLimit.js` `isTieredPath` covers `/generations|/corrections|/chat` but NOT the §33.8 PUT-transcription ai tier (real gap — to fix); `routes/index.js` mounts only auth (registry pattern confirmed); `utils/errors.js` CustomError + toErrorEnvelope (CastError/MulterError/ValidationError/11000 mappings present); validation harness `req.validated = {body,params,query}` confirmed; `app.js` fixed chain + single `/api/v1` mount confirmed; `mongoose-paginate-v2` present in manifest.
- **Immediate next:** branch `phase-6-backend-domains` from main 875b13d → `npm i addisai@^0.2.0` → SDK surface verification vs §16.4/§16.7 (drift → this finding) → ffmpeg/ffprobe availability check → implement per plan order.

## F92 — Sub-phase 4 execution: pass-1 gaps, integration defects, live-suite verdicts
- **Pass-1 audit (commit `c722298`):** env.js FFMPEG/FFPROBE + SDK instance correct (§16.7 verified live); rateLimit PUT-transcription rule correct but the `/chat` regex was method-blind (GET chat = global per §36.3 — fixed to a POST-messages rule); `stt.audios` ledger schema correct but the DTO leaked it (transform now strips it — D21); test-02's ledger assertion was wrong-direction (flipped to assert exclusion).
- **Integration defects found by the live suite (each fixed in the same change set):** (1) the addisai ^0.2.0 TTT surface is the OpenAI-style `ChatCompletion` — the spec's §16.4 "SDK-normalized `{text, finish_reason}`" describes a surface the shipped SDK does not expose (recorded in §16.4 + §69; adapter maps `choices[0].message.content`); (2) Gemini `responseSchema` rejects union `type` arrays (`['string','null']` → 400 "Proto field is not repeating") — the adapter normalizes unions to their non-null member (the server-side §34.4 validator stays strict); (3) the Item model's per-type status validator cannot run on partial updates (no `this.type` in the update context) — the §31.6 "fetch row, validate manually" controller gate is the enforcement (no runValidators; OQ-021); (4) root-mounted routers (audio/transcription/chat) with `router.use(authenticate)` 401'd every unmatched `/api/v1/*` path (404-envelope regression) — authenticate is per-route on those routers; (5) the §34.3 generation prompt needed the verbatim schema block + "single strings" instruction (the model returned objects for daySummary/overallAssessment); (6) stale MongoDB indexes violated the spec — a unique `user_1_name_1` branch index (§20.3 bans it), unscoped `status_1`, `user_1_createdAt_-1`, `chatconversations.user_1_updatedAt_-1` — dropped; (7) `mergeRawTexts` trims segments (all-whitespace → '' per D18).
- **Live-suite verdicts (2026-08-20):** the owner-provided real recording (187.7 s webm) exercises the whole pipeline for real: ffmpeg webm→PCM conversion + 4×60 s chunks + 4 real addis STT calls (requestId captured, `stt.model` null-as-expected) → real addis TTT generation → §6 canonical render with the §64.5 ± labels → Item rows (activities completed / issues reported) → `transcribed → generated` gateway → gemini surgical correction with the SC-3 ±-token preservation gate (the provider keys `changed[].field` by the Amharic labels — the merge maps by label) → Mode-1 save → revert semantics (403 at generated; full restore cycle on a transcribed report) → gemini chat with a real Amharic assistant answer. The second PUT → 422 "All clips are already transcribed" (D20 ledger idempotency).
- **Owner directives honored:** no live NVIDIA anywhere (adapter static-only; `deepseek flash 4` registry id = §16.8 deployment-time catalog-validation item); the frontend date contract (client sends the ISO of `ethiopianToGregorian` local-noon; server `ethiopianDate.js` mirrors the client algorithm exactly — epoch 1724221, local components; generation prompt + §38.5 bucketing use the mirror); the real-file STT/TTT tests run on addis + gemini only.

## F93 — Pre-commit validation audit (2026-08-20): five defects found and fixed
- Exhaustive re-audit of the whole sub-phase-4 change set before step 6 (role: Supervisor + Architect/Design Lead; fresh-eyes re-read of every new file + cross-cutting gate sweeps). Validated clean: file inventory vs §15.4 (exact), AI_MODELS registry `default`/`reasoning` shape (chain model resolution live-proven), manifests (addisai ^0.2.0), no console.log/process.env outside allowed homes, axios confined to gemini/nvidia adapters, no numeric status literals, envelope everywhere, BR-13 scoping, sessions on every write, sanitizer/SDK gates, mirrors complete.
- **Defects found and fixed in the same change set:**
  1. **ethiopianMonthRange noon-bound (real data-accuracy defect):** the §38.5 range started at 12:00Z of the first Gregorian day — a report dated on the first day of an Ethiopian month (client local-noon ISO stores at 09:00Z) fell OUTSIDE `reportsThisMonth`. Fixed: calendar-day midnight bounds `[00:00Z day1, 00:00Z day-after-last)`; new suite unit U3b proves Nahase 1 (09:00Z + 00:00Z) and Nahase 30 (09:00Z) inside, day before/after excluded.
  2. **audio.validator literal `max: 100`** — replaced with `PAGINATION_MAX_LIMIT` (the no-magic-literals gate).
  3. **playClip suffix-range semantics:** `bytes=-N` returned the first N bytes; the RFC 7233 suffix form now returns the last N (open-ended `bytes=start-` already correct).
  4. **Multipart chain ordering:** the upload/transcripts `language`/`durationSec` chains ran before multer (empty body) so invalid values passed unvalidated — the chains now run after `clipUpload.single(...)` (routes reordered; validated live).
  5. **Cosmetic:** sanitizer dead code (`decodeEntities`/`ENTITY_MAP`) removed; the allowlist tightened to the EXACT client set `p/br/strong/em/span` (dropped the `b`/`i` aliases).
- **Final suite state (all green after the fixes):** unit 10 (U3b added), branches 17, reports 35, audio 11, transcription 7, realpipeline 22 (real AI), ratelimit 12, sourcegates 10 — 124 checks; regressions test-01 12/12, test-02 39/39; node --check sweep clean; dev chain killed, port free. Ready for step 6.

## F94 — Sub-phase 4 step 6 executed: commit + merge + sync + clean (2026-08-20)
- Commit `93dd8ad` (amended to include `.opencode/opencode.json` — the opencode config change: `lsp: true`, model pin, compaction prune; owner-instructed) on `phase-6-backend-domains`, pushed; fast-forward merged to `main` (875b13d..93dd8ad) and pushed; branch deleted local + remote. Only `main` remains (owner-approved sequence).
- Final suite state carried into `main`: test-04 124/124 green (unit 10, branches 17, reports 35, audio 11, transcription 7, realpipeline 22, ratelimit 12, sourcegates 10) + regressions test-01 12/12, test-02 39/39; node --check sweep clean.
- NEXT: sub-phase 5 (aggregations §37–§39) — dashboard rollups (§38.2 statusDistribution, activityByBranch live-join, issuesTrend 30-day), reports-detail analytics (§37), §39 search resolving the OQ-009 inert `search` filter, route mounts (`analytics`, `search`), `test-05-aggregations.mjs`, same mirrors discipline.

## F95 — Sub-phase 5 (aggregations §37–§39) implementation findings
- Implemented per the approved plan (branch `phase-6-backend-aggregations` from main 9d3b026): the §39.2 text index on Branch (`{user, name: 'text', location: 'text'}` — the backend's ONE text index, §20.3 amended in the same set; test-02 branch-index check amended), `services/search.service.js` (the only $text caller — branch text search with `$language: 'none'` → report resolution via $in on live branch refs → merged §27.4 slicing; no RegExp anywhere), `services/drive.service.js` (the dormant §37 Google boundary + `resolveOfficialTokens` — the §64.6 export-time ± resolution, pure + unit-tested), `controllers/analytics.controller.js` (the §38.7-named aggregation home — dashboard with all 8 aggregates + trends vs the previous Ethiopian month, items with the full §38.2 filter contract), `controllers/search.controller.js` + `controllers/export.controller.js`, 3 validators, 3 route modules (export root-mounted with per-route authenticate — the F92 404-envelope lesson; analytics/search path-scoped), registry mounts in the §26.5 order, `scripts/test-05-aggregations.mjs`.
- **Live-suite verdicts (2026-08-20):** test-05 46/46 green — unit 4, dashboard 3 (empty-account zeros; the full fixture with Ethiopian-month boundary dates — Nahase-1-included, day-before-excluded — exact kpis, trends deltas, 4-slice order, activityByBranch $lookup names, 30-day zero-filled issuesTrend), items 13 (every filter + the D27 literal-escape proof `q=pump.` → 0), search 14 (branch-name/location matches, visit-resolution with the own-branch subtitle per §39.3, type filter, includeArchived, quotes-only 422, Ethiopian DD-MM-YY titles), export 6 (the §37.5 payload with ± as-is + live visit names, 422 no-latest, archived 200, docs 404 unmounted, BR-13), sourcegates 6 (**the §39.2 exit gate verified LIVE — text-index count = 1 with weights {name, location}**; no RegExp/$regex in search.service; $group confined to the two named homes; no exportedAt). Regressions green: test-01 12, test-02 39, test-03 37, test-04 124. No AI calls anywhere in the suite (fixture statuses/transcriptions/items arranged directly through the models).
- **Integration fixes in the same set:** (1) the search service's visit-matched subtitle returned the RESOLVING branch's name — §39.3's "(the matched one, or the report's own branch when the match came from a visit)" means the report's OWN branch name — fixed with a live name map for own branches outside the matched set (matchedFields/score still come from the resolving branch); (2) the dashboard `generatedDelta` must compare the month-bucketed generated counts (this-month vs prev-month), not the total vs prev-month — fixed with a dedicated `generatedThisMonth` count; (3) suite bugs: the request helper dropped setCookies (401 cascade), fixture arrangement needed an explicit mongoose connect, the Mongo text-index live shape uses the internal `_fts` key + `weights` (the gate now checks weights), and two assertion slips (IT8 count, the Ethiopian title day arithmetic).
- **Derivations registered (§69, D27–D40):** items q literal-escaped $regex (D27), $text language 'none' (D28), items sort date desc (D29), quotes stripped by the chain (D30), trends emitted from real month-bucketed data (D31), §38.2 example `status=open`→`status=reported` (D32), export content as-stored (D33), dormant drive service + ± resolver (D34), report results carry status (D35), includeArchived widens both sources (D36), merged-list pagination (D37), items window $gte/$lte (D38), null-date reports with title '' (D39), matchedFields post-query derivation (D40). OQ-009 note: §39 global search is live; the §50 reports-list filter dialog stays deferred.

## F96 — Sub-phase 5 pre-commit validation audit (2026-08-20): two minor defects fixed
- Owner-requested exhaustive pre-commit validation (role: Supervisor + Architect/Design Lead) — fresh-eyes re-read of every new file + an explicit unused-import/variable sweep. **Two minor defects found and fixed in the same change set:** (1) `services/drive.service.js` `exportToDocs` computed `resolved` before the `EXPORT_DOCS_ENABLED` throw — an unused variable in the reachable path — the resolution call now lives in the flag-on branch (the dormant §37.7 boundary stays honest); (2) the test-05 suite imported the Branch model without ever calling it (fixtures go through the API) — removed. All named imports verified used across the 11 new backend files (the heuristic's default-import flags were false positives — `asyncHandler`/models are used). Everything else validated clean (inventory vs §15.4, logical validity of search/analytics/export per D27–D40, cross-cutting rules, mirrors).
- Post-fix re-verification: unit 4/4 + sourcegates 6/6 green (the touched surfaces; no behavior change) — the full test-05 46/46 + regressions (test-01 12, test-02 39, test-03 37, test-04 124) already green from the execution run. Change set staged on `phase-6-backend-aggregations`. NEXT: step 5 owner live run → step 6 gated commit.

## F97 — Sub-phase 5 step 6 executed: commit + merge + sync + clean (2026-08-20)
- Commit `9a82c1c` on `phase-6-backend-aggregations` (20 files: the §37/§38/§39 implementation + mirrors + working files), pushed; fast-forward merged to `main` (9d3b026..9a82c1c) and pushed; branch deletion follows. `.opencode/opencode.json` (the running opencode session's own config rewrite — compaction auto/prune flip) committed with the close-out records per the owner's "commit all changes".
- Final suite state carried into `main`: test-05 46/46 (unit 4, dashboard 3, items 13, search 14, export 6, sourcegates 6 — the live text-index-count-1 gate) + regressions test-01 12/12, test-02 39/39, test-03 37/37, test-04 124/124 (incl. the real-AI realpipeline 22/22); node --check sweep clean.
- NEXT: sub-phase 6 (seeding & sweepers §40/§61/§62) — mock/ deterministic seed + wipe endpoints (session-safe, ADR-037, §40.5 env gating), jobs/sweeper (single in-process timer, two passes — archived-report TTL + orphan-audio sweep, §62), suite `test-06-*.mjs`, mirrors.
