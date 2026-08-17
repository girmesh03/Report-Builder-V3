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
 * the HTML per keystroke. The seed (`host.draft || storyHtml`, from
 * the shared §53.6 surface handler) never changes while typing;
 * external refreshes clear the draft so the fresh story re-seeds. A
 * generated candidate lands through the imperative `applyCandidate()`
 * (fills the live document, marks it dirty) — the seed follows so
 * later boundary reads agree.
 *
 * Not-ready states: no report yet (stepper jump) → the empty state;
 * report with no transcription → the audio card's act + the
 * transcription card's empty state (nothing is fabricated where
 * nothing is known, §52.7).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import MuiEmptyState from "../reusable/MuiEmptyState";
import AudioCard from "./AudioCard";
import TranscriptionCard from "./TranscriptionCard";
import useEditorHost from "./useEditorHost";
import useCorrection from "./useCorrection";
import { useListClipsQuery } from "../../redux/features/audioEndpoints";
import {
  useListTranscriptionsQuery,
  useTranscribeReportMutation,
  useReTranscribeMutation,
} from "../../redux/features/transcriptionEndpoints";
import { useGetReportQuery } from "../../redux/features/reportsEndpoints";
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

  const [transcribing, setTranscribing] = useState(false);
  const [failedIds, setFailedIds] = useState([]);
  const [playingNumber, setPlayingNumber] = useState(null);
  const surfaceRef = useRef(null);

  // The §53.6 surface handler (ADR-033 — shared with the report step's
  // body card): the draft seed override, the dirty flag, the field-error
  // slot, the save/revert busy states, the "Saved just now" window, and
  // the boundary operations (dirty reporting, the `?? ""` boundary-read
  // save, the single-undo revert, the candidate fill). The save-state
  // copy rows stay transcription-flavored here (§11.5 catalogue).
  const host = useEditorHost({
    reportId,
    surfaceRef,
    latest: reportData?.latest,
    updatedAt: reportData?.updatedAt,
    copy: {
      emptyBlock: "Write the story before saving",
      savedToast: TOAST_CATALOGUE.transcription.saved,
      revertedToast: TOAST_CATALOGUE.transcription.reverted,
    },
  });

  // The correction dialog's apply contract (§54.3): candidate fills the
  // LIVE editor as an editable draft (dirty, never staged, no Accept
  // step); on failure the error is toasted and RETHROWN (round-8.2,
  // §54.2) so the dialog can highlight the instruction field from the
  // normalized `fieldErrors.instruction`. The read is `result.content`
  // — the §42.4 normalization already unwraps the envelope.
  const handleApplyCorrection = useCorrection({
    reportId,
    applyCandidate: host.applyCandidate,
  });

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
  // attached take at `transcribed` (adding never rewinds the
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
  const editSeed = host.draft || storyHtml;

  const handleTranscribe = async () => {
    setTranscribing(true);
    try {
      const result = await transcribeReport(reportId).unwrap();
      setFailedIds(result?.failed ?? []);
      // A fresh story is on the way: drop the draft so the fresh
      // story re-seeds (the seed never changes while typing, §53.3).
      host.resetDraft();
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
      host.resetDraft();
      showToast("success", TOAST_CATALOGUE.transcription.retried);
    } catch (error) {
      showToast("error", error?.message ?? TOAST_CATALOGUE.error.generic);
    }
  };

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
        lastSavedAt={host.lastSavedAt}
        saving={host.saving}
        reverting={host.reverting}
        justSaved={host.justSaved}
        dirty={host.dirty}
        fieldError={host.error}
        canRevert={host.canRevert}
        onDirtyChange={host.handleDirtyChange}
        onSave={host.handleSave}
        onRevert={host.handleRevertToOriginal}
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