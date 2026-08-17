/**
 * @module pages/ReportNew
 *
 * The report-creation wizard (§52) — one vertical working surface of
 * four regions: the header strip (the day-skeleton summary ribbon
 * with the page title and the close action), the four-step stepper,
 * the step content, and the Previous/Next bar.
 *
 * Below `md` the ribbon/stepper block sticks to the top and the nav
 * bar sticks to the bottom of the viewport while the step content is
 * the only scrolling region; from md up everything sits in natural
 * flow with the content centered at the readable
 * layoutConfig.contentMaxWidth. Step changes move focus to the step
 * content.
 *
 * Flow (round-4 amendment — two-payload creation, §4.10):
 * step 1's Next CREATES the report (metadata + visits only) →
 * `draft`; a failed create keeps the user on step 1 with the
 * server's message applied to the fields (§52.11). Step 2's Next is
 * the ATTACH act: each still-staged take binds to the report
 * (uploadClip with its staged id) → `audio_attached`; on any failure
 * the bound takes stay bound, the rest stay staged, and the user
 * stays on step 2. Going back to step 1 preserves everything — the
 * re-entry writes PATCH the date and visits (no second report is
 * created). Step 3 (transcription) gates Next on the report being
 * `transcribed`.
 *
 * Close: after the report exists the close action leaves directly
 * (the report is saved — nothing to confirm, §52.11); before that a
 * confirmation dialog guards the unsaved draft: leaving or
 * closing the browser before the create saves no report.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useSelector } from "react-redux";
import { useForm, useWatch } from "react-hook-form";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import ConstructionOutlinedIcon from "@mui/icons-material/ConstructionOutlined";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import MuiConfirmDialog from "../components/reusable/MuiConfirmDialog";
import MuiEmptyState from "../components/reusable/MuiEmptyState";
import MuiStepper from "../components/reusable/MuiStepper";
import StepAudio from "../components/report/StepAudio";
import StepBasicInfo from "../components/report/StepBasicInfo";
import StepNavBar from "../components/report/StepNavBar";
import StepTranscription from "../components/report/StepTranscription";
import SummaryRibbon from "../components/report/SummaryRibbon";
import { selectAuthUser } from "../redux/features/authSlice";
import { useListBranchesQuery } from "../redux/features/branchesEndpoints";
import { useUploadClipMutation } from "../redux/features/audioEndpoints";
import {
  useCreateReportMutation,
  useUpdateReportMutation,
  useUpdateVisitsMutation,
} from "../redux/features/reportsEndpoints";
import { layoutConfig } from "../theme/themePrimitives";
import { WIZARD, TOAST_CATALOGUE } from "../utils/constants";
import { showToast } from "../utils/toast";
import {
  ethiopianToGregorian,
  gregorianToEthiopian,
} from "../utils/ethiopianDate";
import { validateStep1 } from "../utils/wizardValidation";

/**
 * The quiet stand-in for the report step (step 4) until its surface
 * lands in the report round.
 */
function StepPlaceholder() {
  return (
    <MuiEmptyState
      icon={<ConstructionOutlinedIcon />}
      title={WIZARD.placeholder.title}
      description={WIZARD.placeholder.description}
      minHeight="280px"
    />
  );
}

export function Component() {
  const theme = useTheme();
  const isBelowMd = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const user = useSelector(selectAuthUser);
  const { data, isLoading: branchesLoading } = useListBranchesQuery({});
  const [createReport, { isLoading: creatingReport }] =
    useCreateReportMutation();
  const [updateReport] = useUpdateReportMutation();
  const [updateVisits] = useUpdateVisitsMutation();
  const [uploadClip] = useUploadClipMutation();
  const [activeStep, setActiveStep] = useState(0);
  const [reportId, setReportId] = useState(null);
  const [attaching, setAttaching] = useState(false);
  const [transcriptionReady, setTranscriptionReady] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [takes, setTakes] = useState([]);
  const contentRef = useRef(null);
  const stepRef = useRef(null);

  const branches = useMemo(() => data?.docs ?? [], [data]);
  const branchNameOf = useMemo(() => {
    const byId = new Map(branches.map((branch) => [branch._id, branch.name]));
    return (branchId) => byId.get(branchId) ?? "—";
  }, [branches]);

  const clipIds = useMemo(
    () =>
      takes
        .map((take) => take.clip?._id)
        .filter((clipId) => typeof clipId === "string"),
    [takes],
  );
  const uploadsPending = takes.some((take) => take.busy);

  const form = useForm({
    mode: "onBlur",
    defaultValues: {
      date: gregorianToEthiopian(new Date()),
      clockIn: null,
      clockOut: null,
      branch: null,
      visits: [],
    },
  });

  const watched = useWatch({ control: form.control });
  const step1Ready = Object.keys(validateStep1(watched)).length === 0;

  useEffect(() => {
    contentRef.current?.focus();
  }, [activeStep]);

  const step1Payload = () => ({
    date: ethiopianToGregorian(watched.date).toISOString(),
    clockIn: watched.clockIn?.format("HH:mm"),
    clockOut: watched.clockOut?.format("HH:mm"),
    branch: watched.branch,
    visits: (watched.visits ?? []).map((visit) => ({
      branch: visit.branch,
      clockIn: visit.clockIn?.format("HH:mm"),
      clockOut: visit.clockOut?.format("HH:mm"),
    })),
  });

  /**
   * The server's 422 `fieldErrors` are applied to the step-1 fields
   * (field names mirror the create validator's). Round-8.2 amendment:
   * the §42.4 normalization already maps `details` → `fieldErrors` —
   * the old read of `error.data.details` never survived it, so
   * "check the highlighted fields" highlighted nothing (§48.3).
   */
  const applyServerDetails = (error) => {
    const fieldErrors = error?.fieldErrors;
    if (!fieldErrors) {
      return;
    }
    Object.entries(fieldErrors).forEach(([field, message]) => {
      const match = /^visits\[(\d+)\]\.(\w+)$/.exec(field ?? "");
      if (match) {
        form.setError(`visits.${match[1]}.${match[2]}`, {
          message,
        });
      } else if (
        ["date", "clockIn", "clockOut", "branch"].includes(field)
      ) {
        form.setError(field, { message });
      }
    });
  };

  /**
   * Step 1 Next — CREATE (first time) or PATCH (re-entry). The report
   * is created from metadata + visits ONLY; the takes bind at the
   * step-2 attach act. On failure: stay on step 1, fields carry the
   * server's message, nothing is lost.
   */
  const handleStep1Next = async () => {
    const valid = await form.trigger();
    if (!valid) {
      stepRef.current?.focusFirstError();
      return;
    }
    const payload = step1Payload();
    if (reportId) {
      try {
        await Promise.all([
          updateReport({ reportId, reportDate: payload.date }).unwrap(),
          updateVisits({ reportId, visits: payload.visits }).unwrap(),
        ]);
        setActiveStep(1);
      } catch (error) {
        applyServerDetails(error);
        showToast(
          "error",
          error?.data?.message ??
            error?.message ??
            TOAST_CATALOGUE.error.generic,
        );
      }
      return;
    }
    try {
      const report = await createReport(payload).unwrap();
      setReportId(report._id);
      showToast("success", TOAST_CATALOGUE.report.created);
      setActiveStep(1);
    } catch (error) {
      applyServerDetails(error);
      showToast(
        "error",
        error?.data?.message ?? error?.message ?? TOAST_CATALOGUE.error.generic,
      );
      contentRef.current?.focus();
    }
  };

  /**
   * Step 2 Next — the ATTACH act (§4.10): every take still
   * staged binds by its staged id; on any failure the bound takes
   * stay bound (their rows are marked `attached` so the retry only
   * re-sends the rest), the user stays on step 2, and the takes are
   * kept. All bound → advance to step 3.
   */
  const handleStep2Next = async () => {
    if (!reportId) {
      return;
    }
    setAttaching(true);
    const pending = takes.filter((take) => take.clip?._id && !take.attached);
    let failed = false;
    for (const take of pending) {
      const formData = new FormData();
      formData.append("stagedClipId", take.clip._id);
      try {
        const clip = await uploadClip({
          reportId,
          visitNo: 1,
          formData,
        }).unwrap();
        setTakes((prev) =>
          prev.map((row) =>
            row.clip?._id === clip._id ? { ...row, attached: true } : row,
          ),
        );
      } catch {
        failed = true;
      }
    }
    setAttaching(false);
    if (failed) {
      showToast("error", TOAST_CATALOGUE.audio.attachFailed);
      return;
    }
    showToast("success", TOAST_CATALOGUE.audio.attached);
    setActiveStep(2);
  };

  const handleNext = () => {
    if (activeStep === 0) {
      handleStep1Next();
      return;
    }
    if (activeStep === 1) {
      handleStep2Next();
      return;
    }
    setActiveStep((current) => Math.min(current + 1, WIZARD.steps.length - 1));
  };

  const handlePrev = () => setActiveStep((current) => Math.max(0, current - 1));

  const confirmLeave = () => {
    setCloseOpen(false);
    navigate("/reports");
  };

  const handleClose = () => {
    if (reportId) {
      navigate("/reports");
      return;
    }
    setCloseOpen(true);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          position: isBelowMd ? "sticky" : "static",
          top: 0,
          zIndex: isBelowMd ? 2 : undefined,
          bgcolor: isBelowMd ? "background.default" : "transparent",
        }}
      >
        <SummaryRibbon
          date={watched.date}
          clockIn={watched.clockIn}
          clockOut={watched.clockOut}
          branchName={watched.branch ? branchNameOf(watched.branch) : null}
          userName={user?.fullName ?? null}
          onClose={handleClose}
        />

        <Divider
          sx={{ my: 2, maxWidth: layoutConfig.contentMaxWidth, mx: "auto" }}
        />
        <Box sx={{ maxWidth: layoutConfig.contentMaxWidth, mx: "auto" }}>
          <MuiStepper
            steps={WIZARD.steps}
            activeStep={activeStep}
            onStepClick={setActiveStep}
          />
        </Box>
      </Box>

      <Box
        ref={contentRef}
        tabIndex={-1}
        sx={{
          outline: "none",
          mt: 3,
          mb: 3,
          maxWidth: layoutConfig.contentMaxWidth,
          width: "100%",
          mx: "auto",
        }}
      >
        {activeStep === 0 ? (
          <StepBasicInfo
            ref={stepRef}
            control={form.control}
            branches={branches}
            branchesLoading={branchesLoading}
            branchNameOf={branchNameOf}
          />
        ) : activeStep === 1 ? (
          <StepAudio takes={takes} setTakes={setTakes} />
        ) : activeStep === 2 ? (
          <StepTranscription
            reportId={reportId}
            onReadyChange={setTranscriptionReady}
          />
        ) : (
          <StepPlaceholder />
        )}
      </Box>

      <Box
        sx={{
          position: isBelowMd ? "sticky" : "static",
          bottom: 0,
          zIndex: isBelowMd ? 2 : undefined,
          bgcolor: isBelowMd ? "background.default" : "transparent",
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <StepNavBar
          onPrev={handlePrev}
          onNext={handleNext}
          prevDisabled={activeStep === 0}
          nextDisabled={
            (activeStep === 0 && !step1Ready) ||
            (activeStep === 1 &&
              (clipIds.length === 0 || uploadsPending || attaching)) ||
            (activeStep === 2 && !transcriptionReady)
          }
          nextLoading={creatingReport || attaching}
        />
      </Box>

      <MuiConfirmDialog
        open={closeOpen}
        onClose={() => setCloseOpen(false)}
        onConfirm={confirmLeave}
        title={WIZARD.close.title}
        message={WIZARD.close.message}
        confirmText={WIZARD.close.confirm}
        cancelText={WIZARD.close.cancel}
      />
    </Box>
  );
}

export default Component;
