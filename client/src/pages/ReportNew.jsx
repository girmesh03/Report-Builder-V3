/**
 * @module pages/ReportNew
 *
 * The report-creation wizard (§52) — one vertical working surface of
 * five regions: the page header ("New report" + close action with a
 * leave confirmation), the four-step stepper, the day-skeleton
 * summary ribbon, the step content, and the Previous/Next bar.
 *
 * Below `md` the header/stepper/ribbon block sticks to the top and
 * the nav bar sticks to the bottom of the viewport while the step
 * content is the only scrolling region; from md up everything sits
 * in natural flow with the content centered at the readable
 * layoutConfig.contentMaxWidth. Step changes move focus to the step
 * heading.
 *
 * Step 1 (Basic info & Visits) is implemented; steps 2–4 render a
 * placeholder surface. Next on step 1 validates the step (the two
 * client-mirrored rules) and advances on success — nothing is posted
 * here: the report comes into existence at the audio step's
 * submission, so leaving or closing the browser before then saves
 * nothing.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useSelector } from "react-redux";
import { useForm, useWatch } from "react-hook-form";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import CloseIcon from "@mui/icons-material/Close";
import ConstructionOutlinedIcon from "@mui/icons-material/ConstructionOutlined";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import MuiConfirmDialog from "../components/reusable/MuiConfirmDialog";
import MuiEmptyState from "../components/reusable/MuiEmptyState";
import MuiPageHeader from "../components/reusable/MuiPageHeader";
import MuiStepper from "../components/reusable/MuiStepper";
import StepBasicInfo from "../components/report/StepBasicInfo";
import StepNavBar from "../components/report/StepNavBar";
import SummaryRibbon from "../components/report/SummaryRibbon";
import { selectAuthUser } from "../redux/features/authSlice";
import { useListBranchesQuery } from "../redux/features/branchesEndpoints";
import { layoutConfig } from "../theme/themePrimitives";
import { WIZARD } from "../utils/constants";
import { gregorianToEthiopian } from "../utils/ethiopianDate";
import { validateStep1 } from "../utils/wizardValidation";

/**
 * The quiet stand-in for steps 2–4 until their surfaces land.
 * @param {Object} props
 * @param {number} props.index - Step index (1-based in the list).
 */
function StepPlaceholder({ index }) {
  return (
    <MuiEmptyState
      icon={<ConstructionOutlinedIcon />}
      title={`${WIZARD.steps[index]} — ${WIZARD.placeholder.title}`}
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
  const [activeStep, setActiveStep] = useState(0);
  const [closeOpen, setCloseOpen] = useState(false);
  const headingRef = useRef(null);
  const stepRef = useRef(null);

  const branches = useMemo(() => data?.docs ?? [], [data]);
  const branchNameOf = useMemo(() => {
    const byId = new Map(branches.map((branch) => [branch._id, branch.name]));
    return (branchId) => byId.get(branchId) ?? "—";
  }, [branches]);

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
    headingRef.current?.focus();
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
        <MuiPageHeader
          title={WIZARD.pageTitle}
          actions={
            <Tooltip title={WIZARD.closeLabel}>
              <IconButton
                aria-label={WIZARD.closeLabel}
                onClick={() => setCloseOpen(true)}
              >
                <CloseIcon />
              </IconButton>
            </Tooltip>
          }
        />
        <MuiStepper
          steps={WIZARD.steps}
          activeStep={activeStep}
          onStepClick={setActiveStep}
        />
        <SummaryRibbon
          date={watched.date}
          clockIn={watched.clockIn}
          clockOut={watched.clockOut}
          branchName={watched.branch ? branchNameOf(watched.branch) : null}
          userName={user?.fullName ?? null}
        />
      </Box>

      <Box ref={headingRef} tabIndex={-1} sx={{ outline: "none", mt: 3, mb: 2 }}>
        <Typography variant="h6" component="h2">
          {WIZARD.stepHeadings[activeStep]}
        </Typography>
      </Box>

      <Box
        sx={{
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
        ) : (
          <StepPlaceholder index={activeStep} />
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
          nextDisabled={activeStep === 0 && !step1Ready}
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
