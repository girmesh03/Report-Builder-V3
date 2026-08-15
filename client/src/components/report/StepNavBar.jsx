/**
 * @module components/report/StepNavBar
 *
 * The wizard's Previous/Next bar (§52): one component in two
 * placements — fixed to the viewport bottom below `md` (the page
 * wraps it in a sticky shell) and in reading order at the end of the
 * step content from md up. Its buttons, labels and behavior are
 * identical at every size. Next is disabled by the owning page while
 * the current step's must-haves are unmet. "Finish" is not this
 * bar's job — the report step's final button arrives with that
 * step's own implementation.
 */
import Box from "@mui/material/Box";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import MuiButton from "../reusable/MuiButton";
import { layoutConfig } from "../../theme/themePrimitives";
import { WIZARD } from "../../utils/constants";

/**
 * @param {Object} props
 * @param {Function} props.onPrev - Moves to the previous step.
 * @param {Function} props.onNext - Validates and advances.
 * @param {boolean} [props.prevDisabled] - True on the first step.
 * @param {boolean} [props.nextDisabled] - True while the step's must-haves are unmet.
 * @param {boolean} [props.nextLoading] - Submission in flight (the audio step's create).
 */
export default function StepNavBar({
  onPrev,
  onNext,
  prevDisabled = false,
  nextDisabled = false,
  nextLoading = false,
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        py: 2,
        maxWidth: layoutConfig.contentMaxWidth,
        width: "100%",
        mx: "auto",
      }}
    >
      <MuiButton
        variant="text"
        startIcon={<ChevronLeftIcon />}
        onClick={onPrev}
        disabled={prevDisabled}
      >
        {WIZARD.nav.previous}
      </MuiButton>
      <MuiButton
        variant="contained"
        endIcon={<ChevronRightIcon />}
        onClick={onNext}
        disabled={nextDisabled}
        loading={nextLoading}
      >
        {WIZARD.nav.next}
      </MuiButton>
    </Box>
  );
}