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
 * Step 1 (Basic info & Visits) and step 2 (Audio) are implemented;
 * steps 3–4 render a placeholder surface. Next on step 1 validates
 * the step (the two client-mirrored rules) and advances on success;
 * Next on step 2 creates the report — the §4.10 one-payload
 * submission (step-1 metadata + the staged clip ids, CR-064) — and
 * navigates to the new report's details page (CR-013). Nothing is
 * posted before then: leaving or closing the browser before the
 * audio submission saves no report (CR-006).
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
import SummaryRibbon from "../components/report/SummaryRibbon";
import { selectAuthUser } from "../redux/features/authSlice";
import { useListBranchesQuery } from "../redux/features/branchesEndpoints";
import { useCreateReportMutation } from "../redux/features/reportsEndpoints";
import { layoutConfig } from "../theme/themePrimitives";
import { WIZARD, TOAST_CATALOGUE } from "../utils/constants";
import { showToast } from "../utils/toast";
import { ethiopianToGregorian, gregorianToEthiopian } from "../utils/ethiopianDate";
import { validateStep1 } from "../utils/wizardValidation";

/**
 * The quiet stand-in for steps 2–4 until their surfaces land.
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
  const [createReport, { isLoading: creatingReport }] = useCreateReportMutation();
  const [activeStep, setActiveStep] = useState(0);
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

  const handlePrev = () => setActiveStep((current) => Math.max(0, current - 1));

  const handleNext = async () => {
    if (activeStep === 0) {
      const valid = await form.trigger();
      if (!valid) {
        stepRef.current?.focusFirstError();
        return;
      }
    }
    if (activeStep === 1) {
      try {
        const report = await createReport({
          date: ethiopianToGregorian(watched.date).toISOString(),
          clockIn: watched.clockIn?.format("HH:mm"),
          clockOut: watched.clockOut?.format("HH:mm"),
          branch: watched.branch,
          visits: (watched.visits ?? []).map((visit) => ({
            branch: visit.branch,
            clockIn: visit.clockIn?.format("HH:mm"),
            clockOut: visit.clockOut?.format("HH:mm"),
          })),
          audios: clipIds,
        }).unwrap();
        showToast("success", TOAST_CATALOGUE.report.created);
        navigate(`/reports/${report._id}`);
      } catch (error) {
        showToast("error", error?.message ?? TOAST_CATALOGUE.error.generic);
        contentRef.current?.focus();
      }
      return;
    }
    setActiveStep((current) => Math.min(current + 1, WIZARD.steps.length - 1));
  };

  const confirmLeave = () => {
    setCloseOpen(false);
    navigate("/reports");
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
          onClose={() => setCloseOpen(true)}
        />

        <Divider sx={{ my: 2, maxWidth: layoutConfig.contentMaxWidth, mx: "auto" }} />
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
            (activeStep === 1 && (clipIds.length === 0 || uploadsPending))
          }
          nextLoading={creatingReport}
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
