/**
 * @module components/report/StepReport
 *
 * The report step of the §52 wizard (step 4) — the posture machine of
 * §52.8: `transcribed` → the generation desk (GenerateCard, §34.2);
 * `reviewed` → the report body card (ReportBodyCard — the re-purposed
 * §53 editor host #2, corrections, ± token guidance, §53.5 footer);
 * `completed` (Edit-mode re-entry) → the body card + the Export menu
 * (print / TXT; XLSX/CSV disabled until the §58 exports round).
 * Any other status (stepper jump before the transcription) → the
 * step's empty state — nothing is fabricated where nothing is known
 * (§52.7).
 *
 * Finish (the step's Next): "Create" on the Add flow, "Finish" on
 * Edit-mode re-entry — the §52.10 Mode-1 leave-guard: save-if-dirty
 * (the boundary-read save, `?? ""` semantics) then navigate to the
 * §51 details page. A `transcribed` report has no body yet — the
 * generate act is the must-have, so finish is refused with the
 * generate-first toast. An empty body blocks with the highlighted
 * field + helper (round-8.2). The host's busy state (generating or
 * saving) is reported up so the page disables the nav while work is
 * in flight.
 *
 * Stale-`latest` notice (§54.8): if the persisted story changed while
 * this step was mounted (a step-3 re-transcription after going back)
 * and the host is not editing, the storyChangeNotice line shows until
 * the user acts.
 */
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import MuiEmptyState from "../reusable/MuiEmptyState";
import LoadingSpinner from "../reusable/LoadingSpinner";
import GenerateCard from "./GenerateCard";
import ReportBodyCard from "./ReportBodyCard";
import useCorrection from "./useCorrection";
import useEditorHost from "./useEditorHost";
import {
  useGetReportQuery,
  useGenerateReportMutation,
} from "../../redux/features/reportsEndpoints";
import { WIZARD, TOAST_CATALOGUE } from "../../utils/constants";
import { showToast } from "../../utils/toast";

/**
 * @param {Object} props
 * @param {string|null} props.reportId - The report (null when the user
 *   jumps here before the create act).
 * @param {Function} props.onBusyChange - Reports generating/saving to
 *   the page (the Next button's disable + loading).
 * @param {import("react").Ref} ref - Exposes `finish()` — the step's
 *   Next act (the page calls it; precedent: `focusFirstError`).
 */
const StepReport = forwardRef(function StepReport(
  { reportId, onBusyChange },
  ref,
) {
  const navigate = useNavigate();
  const { data: reportData, isLoading } = useGetReportQuery(
    { reportId, withContent: true },
    { skip: !reportId },
  );
  const [generateReport, { isLoading: generating }] =
    useGenerateReportMutation();

  const surfaceRef = useRef(null);

  // The shared §53.6 surface handler (ADR-033 — the report body is
  // editor host #2; the copy rows are report-flavored, §11.5).
  const host = useEditorHost({
    reportId,
    surfaceRef,
    latest: reportData?.latest ?? null,
    updatedAt: reportData?.updatedAt ?? null,
    copy: {
      emptyBlock: WIZARD.report.emptyBlock,
      savedToast: TOAST_CATALOGUE.report.saved,
      revertedToast: TOAST_CATALOGUE.report.reverted,
    },
  });
  const handleApplyCorrection = useCorrection({
    reportId,
    applyCandidate: host.applyCandidate,
  });

  const report = reportData ?? null;
  const busy = generating || host.saving;

  useEffect(() => {
    onBusyChange(busy);
  }, [busy, onBusyChange]);

  // The editing seed: the persisted body until a boundary write
  // captures the draft (zero-lag, §53.3). The ±-guidance presence is
  // boundary-computed — the same seed shape the editor reads, so the
  // strip's visibility always agrees with the live document.
  const editSeed = host.draft || report?.latest || "";
  const hasTokens = editSeed.includes("±");

  // Stale-latest detection (§54.8): the persisted body changed while
  // mounted (going back to step 3 re-transcribes → `latest` moves) and
  // the host is not editing → the notice shows. Any edit dismisses it.
  const [stale, setStale] = useState(false);
  const seenLatestRef = useRef(null);
  useEffect(() => {
    if (host.dirty) {
      setStale(false);
      return;
    }
    const latest = report?.latest ?? null;
    if (seenLatestRef.current !== null && seenLatestRef.current !== latest) {
      setStale(true);
    }
    seenLatestRef.current = latest;
  }, [report?.latest, host.dirty]);

  const handleGenerate = async () => {
    try {
      await generateReport(reportId).unwrap();
      showToast("success", TOAST_CATALOGUE.generation.ready);
    } catch (error) {
      showToast("error", error?.message ?? TOAST_CATALOGUE.error.generic);
    }
  };

  const handleFinish = async () => {
    if (!reportId) {
      return;
    }
    if (report?.status === "transcribed") {
      // No body yet — the generate act is the step's must-have.
      showToast("error", WIZARD.report.generateFirst);
      return;
    }
    if (host.dirty) {
      // The Mode-1 leave-guard (§52.10): save-if-dirty. A false
      // return means blocked — empty body (field highlighted) or a
      // failed write — stay on the step.
      const saved = await host.handleSave();
      if (!saved) {
        return;
      }
    }
    navigate(`/reports/${reportId}`);
  };

  useImperativeHandle(ref, () => ({ finish: handleFinish }));

  if (!reportId) {
    return (
      <MuiEmptyState
        title={WIZARD.report.generateEmptyTitle}
        description={WIZARD.report.generateEmptyDescription}
        minHeight="280px"
      />
    );
  }

  if (isLoading) {
    return (
      <Box
        tabIndex={-1}
        sx={{
          outline: "none",
          mt: 3,
          display: "flex",
          justifyContent: "center",
          minHeight: 280,
          alignItems: "center",
        }}
      >
        <LoadingSpinner />
      </Box>
    );
  }

  const canExport = report?.status === "completed";

  return (
    <Box
      tabIndex={-1}
      sx={{ outline: "none", mt: 3, display: "flex", flexDirection: "column", gap: 2.5 }}
    >
      {report?.status === "transcribed" ? (
        <GenerateCard generating={generating} onGenerate={handleGenerate} />
      ) : report?.status === "reviewed" || canExport ? (
        <ReportBodyCard
          ref={surfaceRef}
          seed={editSeed}
          lastSavedAt={host.lastSavedAt}
          saving={host.saving}
          reverting={host.reverting}
          justSaved={host.justSaved}
          dirty={host.dirty}
          fieldError={host.error}
          canRevert={host.canRevert}
          hasTokens={hasTokens}
          showNotice={stale}
          canExport={canExport}
          onDirtyChange={host.handleDirtyChange}
          onSave={host.handleSave}
          onRevert={host.handleRevertToOriginal}
          onApplyCorrection={handleApplyCorrection}
          reportId={reportId}
        />
      ) : (
        <MuiEmptyState
          title={WIZARD.report.generateEmptyTitle}
          description={WIZARD.report.generateEmptyDescription}
          minHeight="280px"
        />
      )}
    </Box>
  );
});

StepReport.propTypes = {
  reportId: PropTypes.string,
  onBusyChange: PropTypes.func.isRequired,
};

export default StepReport;