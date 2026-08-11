/**
 * @module components/reusable/MuiStepper
 *
 * The wizard step indicator (§46.17, §52): the §44.5 dot style with
 * step labels; only visited steps are clickable; step labels collapse
 * to dots below 600px.
 */
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Step from "@mui/material/Step";
import StepButton from "@mui/material/StepButton";
import Stepper from "@mui/material/Stepper";
import StepLabel from "@mui/material/StepLabel";
import CheckIcon from "@mui/icons-material/Check";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

/**
 * @param {Object} props
 * @param {string[]} props.steps - Ordered step labels.
 * @param {number} props.activeStep - Current step index.
 * @param {Function} [props.onStepClick] - Called with the step index for visited steps only.
 * @param {boolean} [props.orientation] - Vertical when true (default horizontal).
 * @param {Object} [props.sx] - Style overrides.
 */
export default function MuiStepper({
  steps,
  activeStep,
  onStepClick,
  orientation = "horizontal",
  sx,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Stepper
      activeStep={activeStep}
      orientation={orientation}
      sx={{
        "& .MuiStepConnector-line": { borderColor: "divider" },
        ...sx,
      }}
    >
      {steps.map((label, index) => {
        const visited = index < activeStep;
        const isCurrent = index === activeStep;
        const clickable = visited && Boolean(onStepClick);

        return (
          <Step key={label} completed={visited}>
            {clickable ? (
              <StepButton onClick={() => onStepClick(index)}>
                {isMobile ? null : label}
              </StepButton>
            ) : (
              <StepLabel
                icon={
                  visited ? (
                    <CheckIcon fontSize="small" color="primary" />
                  ) : (
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        backgroundColor: isCurrent ? "primary.main" : "divider",
                      }}
                    />
                  )
                }
                sx={{ fontWeight: isCurrent ? 600 : 400 }}
              >
                {isMobile ? null : label}
              </StepLabel>
            )}
          </Step>
        );
      })}
    </Stepper>
  );
}

MuiStepper.propTypes = {
  steps: PropTypes.arrayOf(PropTypes.string).isRequired,
  activeStep: PropTypes.number.isRequired,
  onStepClick: PropTypes.func,
  orientation: PropTypes.oneOf(["horizontal", "vertical"]),
  sx: PropTypes.object,
};