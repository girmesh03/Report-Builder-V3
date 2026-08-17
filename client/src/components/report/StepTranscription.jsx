/**
 * @module components/report/StepTranscription
 *
 * The transcription step of the §52 wizard (round-7 amendment — the
 * two-card restructure): two sections under the ribbon and stepper —
 * I. the audio card (the day's takes: header with icon/title/
 * subtitle and the "x of y" count, transcription progress, the take
 * rows in a height-capped scroll region, the single Transcribe act
 * covering only the unheard takes, §52.6), II. the transcription
 * card (the day's story: header with the circular correction opener,
 * the §53 editor with its toolbar — borderless, framed by the card
 * — and the icon footer of §53.5: the save-state line, Revert,
 * Save). The STORY is the report's `latest` slot (§53.2 "transcription
 * review segment"): before any correction it is the client-joined
 * per-take `raw` texts; a save persists it (report-level
 * `PATCH /reports/:reportId/content`).
 *
 * Correction (round-6/round-7): the correction dialog (field text
 * or a recorded instruction transcribed by the STT-only endpoint)
 * sends the typed instruction with the existing transcription to
 * `POST /reports/:reportId/correct` (text mode, chosen provider);
 * the returned CANDIDATE fills the SAME live editor as an editable
 * draft — dirty, never staged, no Accept step. Save persists it to
 * `latest`; Revert restores the raw transcription (single undo).
 * The step is presentational-owner: Next is gated on the report
 * being `transcribed` (reported to the page via `onReadyChange`).
 *
 * Zero-lag host (§53.3 round-5): the editor owns its document; the
 * step reads it at controlled boundaries (`surfaceRef.getContent()`
 * on Save) and tracks divergence through the dirty boolean — never
 * the HTML per keystroke. The seed (`storyDraft || storyHtml`) never
 * changes while typing; external refreshes clear the draft so the
 * fresh story re-seeds. A generated candidate lands through the
 * imperative `applyCandidate()` (fills the live document, marks it
 * dirty) — the seed follows so later boundary reads agree.
 *
 * Not-ready states: no report yet (stepper jump) → the empty state;
 * report with no transcription → the audio card's act + the
 * transcription card's empty state (nothing is fabricated where
 * nothing is known, §52.7).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import Box from "@mui/material/Box";
import MuiEmptyState from "../reusable/MuiEmptyState";
import AudioCard from "./AudioCard";
import TranscriptionCard from "./TranscriptionCard";
import { useListClipsQuery } from "../../redux/features/audioEndpoints";
import {
  useListTranscriptionsQuery,
  useTranscribeReportMutation,
  useReTranscribeMutation,
} from "../../redux/features/transcriptionEndpoints";
import {
  useGetReportQuery,
  useUpdateContentMutation,
  useRevertContentMutation,
  useCorrectContentMutation,
} from "../../redux/features/reportsEndpoints";
import { plainToHtml } from "../../utils/sanitizeHtml";
import { WIZARD, TOAST_CATALOGUE } from "../../utils/constants";
import { showToast } from "../../utils/toast";

const formatDuration = (secs) => {
  const s = Math.max(0, Math.floor(secs));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(m).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
};

/**
 * @param {Object} props
 * @param {string|null} props.reportId - The created report (null when the
 *   user jumps here before the create act).
 * @param {Function} props.onReadyChange - Reports `transcribed` readiness
 *   to the page (the Next gate).
 */
export default function StepTranscription({ reportId, onReadyChange }) {
  const { data: reportData } = useGetReportQuery(
    { reportId, withContent: true },
    { skip: !reportId },
  );
  const { data: clipsData } = useListClipsQuery(
    { reportId, visitNo: 1 },
    { skip: !reportId },
  );
  const { data: transcriptionsData } = useListTranscriptionsQuery(reportId, {
    skip: !reportId,
  });

  const [transcribeReport] = useTranscribeReportMutation();
  const [reTranscribe] = useReTranscribeMutation();
  const [updateContent] = useUpdateContentMutation();
  const [revertContent] = useRevertContentMutation();
  const [correctContent] = useCorrectContentMutation();

  const [transcribing, setTranscribing] = useState(false);
  const [failedIds, setFailedIds] = useState([]);
  const [playingNumber, setPlayingNumber] = useState(null);
  const [storyDraft, setStoryDraft] = useState("");
  const [storyDirty, setStoryDirty] = useState(false);
  const [storyError, setStoryError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const surfaceRef = useRef(null);
  const justSavedTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      window.clearTimeout(justSavedTimerRef.current);
    };
  }, []);

  const report = reportData ?? null;
  const clips = useMemo(() => clipsData ?? [], [clipsData]);
  const transcriptions = useMemo(
    () => transcriptionsData ?? [],
    [transcriptionsData],
  );
  const transcriptionsByAudio = useMemo(() => {
    const byAudio = new Map();
    transcriptions.forEach((row) => byAudio.set(row.audio, row));
    return byAudio;
  }, [transcriptions]);

  // Readiness is DATA-derived, never the stale status: a newly
  // attached take at `transcribed` (BR-10 — adding never rewinds the
  // status) leaves the step not-ready — the Transcribe act reappears
  // for the unheard take, the story hides (nothing is fabricated
  // where nothing is known, §52.7), and Next stays gated.
  const ready =
    clips.length > 0 &&
    clips.every((clip) => transcriptionsByAudio.has(clip._id));

  useEffect(() => {
    onReadyChange(ready);
  }, [ready, onReadyChange]);

  // The pre-save story: the client-joined per-take raw texts, in
  // take order, one paragraph each — the same shape the editor
  // emits, so the story renders identically before and after a save.
  const joinedStoryHtml = useMemo(
    () =>
      clips
        .map((clip) => transcriptionsByAudio.get(clip._id))
        .filter(Boolean)
        .map((row) => plainToHtml(row.raw))
        .join("\n"),
    [clips, transcriptionsByAudio],
  );

  const storyHtml = report?.latest ? report.latest : joinedStoryHtml;

  const transcribedCount = clips.filter((clip) =>
    transcriptionsByAudio.has(clip._id),
  ).length;
  const totalDurationSec = clips.reduce(
    (sum, clip) => sum + (clip.durationSec ?? 0),
    0,
  );
  const storyMeta =
    ready && clips.length > 0
      ? `${clips.length} ${clips.length === 1 ? "take" : "takes"} · ${formatDuration(totalDurationSec)}`
      : undefined;

  // The persistent editing seed: the persisted story until a boundary
  // write captures the draft; the seed never changes while typing (the
  // dirty flag flips alone) so the zero-lag editor is never clobbered
  // (§53.3). External story refreshes clear the draft so the fresh
  // story re-seeds.
  const editSeed = storyDraft || storyHtml;

  const handleDirtyChange = useCallback(
    (dirty) => {
      // Round-8.2 (§53.5): any edit clears the highlighted-field state.
      // Round-8.5 (seed-sync stability, §53.3): a STABLE identity — the
      // churning arrow recreated `applyExternal` on every parent render,
      // which re-ran MuiEditor's seed-sync effect and re-seeded the
      // stale `value` whenever the live HTML diverged (any formatting):
      // the font-size mark died in the same tick it applied, and
      // deleting all text then blurring refilled the deleted text.
      if (dirty) setStoryError(null);
      setStoryDirty(dirty);
    },
    [],
  );

  const handleTranscribe = async () => {
    setTranscribing(true);
    try {
      const result = await transcribeReport(reportId).unwrap();
      setFailedIds(result?.failed ?? []);
      setStoryDraft("");
      setStoryDirty(false);
      setStoryError(null);
      showToast("success", TOAST_CATALOGUE.transcription.ready);
    } catch {
      setFailedIds(
        clips
          .map((clip) => clip._id)
          .filter((clipId) => !transcriptionsByAudio.has(clipId)),
      );
      showToast("error", TOAST_CATALOGUE.error.generic);
    } finally {
      setTranscribing(false);
    }
  };

  const handleReTranscribe = async (transcriptionId) => {
    try {
      await reTranscribe({ reportId, transcriptionId }).unwrap();
      setStoryDraft("");
      setStoryDirty(false);
      setStoryError(null);
      showToast("success", TOAST_CATALOGUE.transcription.retried);
    } catch (error) {
      showToast("error", error?.message ?? TOAST_CATALOGUE.error.generic);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Boundary read: the editor serializes its live document once,
      // here — never per keystroke (§53.3). Round-8.5 (§53.5): an
      // undefined read (editor not mounted) and an empty document
      // both read as `""` — the draft fallback is GONE because it
      // resurrected the last saved content (`storyDraft` is set on
      // every successful save): deleting all text then saving
      // persisted the old text instead of blocking. The draft
      // remains the edit seed only, never a save source.
      const content = surfaceRef.current?.getContent() ?? "";
      // Round-8.2 pre-validation (§53.5): an empty story is rejected
      // locally — the field highlights instead of a server round-trip
      // returning "Check the highlighted fields" with nothing
      // highlighted; a broken boundary read can never turn into an
      // empty write.
      if (!content.trim()) {
        setStoryError("Write the story before saving");
        return;
      }
      setStoryError(null);
      setStoryDraft(content);
      await updateContent({ reportId, content }).unwrap();
      setStoryDirty(false);
      setJustSaved(true);
      window.clearTimeout(justSavedTimerRef.current);
      justSavedTimerRef.current = window.setTimeout(
        () => setJustSaved(false),
        4000,
      );
      // Round-8.3: the §42.4 normalization unwraps the envelope and drops
      // its `message` — `result?.message` was always undefined and fell
      // back to the generic error copy on a SUCCESS toast. The domain
      // catalogue constant is the copy source (§11.5).
      showToast("success", TOAST_CATALOGUE.transcription.saved);
    } catch (error) {
      // Round-8.2 (§53.5): the §42.4 normalization maps 422 `details`
      // to `fieldErrors` — the content-field message highlights the
      // story editor ("check the highlighted fields" becomes true).
      setStoryError(error?.fieldErrors?.content ?? null);
      showToast("error", error?.message ?? TOAST_CATALOGUE.error.generic);
    } finally {
      setSaving(false);
    }
  };

  const handleRevertToOriginal = async () => {
    setReverting(true);
    try {
      // The single undo (BR-11): with a persisted story the server
      // restores `latest → raw`; without one there is only the local
      // draft to discard (the editor re-seeds the joined transcription
      // — no server round-trip needed).
      if (report?.latest) {
        await revertContent(reportId).unwrap();
        showToast("success", TOAST_CATALOGUE.transcription.reverted);
      }
      setStoryDraft("");
      setStoryDirty(false);
      setStoryError(null);
    } catch (error) {
      showToast("error", error?.message ?? TOAST_CATALOGUE.error.generic);
    } finally {
      setReverting(false);
    }
  };

  // The candidate model: the generated correction returns the
  // candidate HTML — it fills the LIVE editor as an editable draft
  // (dirty), and Save persists it. Nothing is staged; there is no
  // Accept step (§54.3). Stable identity (round-8, §54.7) so the
  // memoized correction dialog's apply contract never churns.
  const applyCandidate = useCallback((content) => {
    if (!content) {
      return;
    }
    setStoryError(null);
    setStoryDraft(content);
    surfaceRef.current?.applyCandidate?.(content);
  }, []);

  // The correction dialog's apply contract: the typed (or STT-filled)
  // instruction + the existing transcription (the report's `latest`,
  // read server-side) + the chosen provider generate the candidate.
  // Resolves `true` on success (the dialog closes); on failure the
  // error is toasted and RETHROWN (round-8.2, §54.2) so the dialog can
  // highlight the instruction field from the normalized
  // `fieldErrors.instruction` (the §42.4 mapping). `result.content` —
  // not `result.data.content` — because the §42.4 normalization
  // already unwraps the envelope (round-8 amendment); the old read
  // silently no-oped the candidate.
  const handleApplyCorrection = useCallback(
    async (instruction, provider) => {
      try {
        const result = await correctContent({
          reportId,
          mode: "text",
          instruction,
          provider,
        }).unwrap();
        applyCandidate(result?.content);
        showToast("success", TOAST_CATALOGUE.correction.generated);
        return true;
      } catch (error) {
        showToast("error", error?.message ?? TOAST_CATALOGUE.error.generic);
        throw error;
      }
    },
    [reportId, correctContent, applyCandidate],
  );

  // The last persisted write's clock time for the save-state line —
  // approximate (`updatedAt` moves on any mutation; the mock keeps no
  // per-field timestamp, documented at §66.10).
  const lastSavedAt =
    report?.latest && report?.updatedAt
      ? dayjs(report.updatedAt).format("HH:mm")
      : null;

  const canRevert = Boolean(report?.latest) || storyDirty;

  if (!reportId) {
    return (
      <MuiEmptyState
        title={WIZARD.transcription.emptyTitle}
        description={WIZARD.transcription.emptyDescription}
        minHeight="280px"
      />
    );
  }

  return (
    <Box
      tabIndex={-1}
      sx={{ outline: "none", mt: 3, display: "flex", flexDirection: "column", gap: 2.5 }}
    >
      <AudioCard
        clips={clips}
        transcriptionsByAudio={transcriptionsByAudio}
        transcribedCount={transcribedCount}
        ready={ready}
        transcribing={transcribing}
        failedIds={failedIds}
        playingNumber={playingNumber}
        onPlayingChange={setPlayingNumber}
        onTranscribe={handleTranscribe}
        onReTranscribe={handleReTranscribe}
        onRetry={handleTranscribe}
      />
      <TranscriptionCard
        ref={surfaceRef}
        ready={ready}
        meta={storyMeta}
        seed={editSeed}
        lastSavedAt={lastSavedAt}
        saving={saving}
        reverting={reverting}
        justSaved={justSaved}
        dirty={storyDirty}
        fieldError={storyError}
        canRevert={canRevert}
        onDirtyChange={handleDirtyChange}
        onSave={handleSave}
        onRevert={handleRevertToOriginal}
        onApplyCorrection={handleApplyCorrection}
        reportId={reportId}
      />
    </Box>
  );
}

StepTranscription.propTypes = {
  reportId: PropTypes.string,
  onReadyChange: PropTypes.func.isRequired,
};