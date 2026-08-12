/**
 * @module components/landing/RuledPaper
 *
 * The §43.2/§48.2 hero motif (round-9b composition, owner review): a
 * flat ruled dictation desk — evenly spaced hairline rules on the
 * page itself, cardless (no frame, no fill, no radius). Nothing is
 * written on it; it is the paper waiting for the day's report. Used
 * with the waveform signature by the §48.2 hero and statically by
 * the §48.3 Brand panel.
 *
 * The only animation in the product (§43.2): a low-opacity waveform
 * traced once across the rules ("the spoken report") which, after
 * its first display, persists — the stroke animation holds its final
 * drawn state (`forwards`). Under `prefers-reduced-motion` the wave
 * is shown fully drawn without any animation (§43.2/§45.8).
 *
 * @param {Object} props
 * @param {boolean} [props.waveform] - Traces the signature onto the rules (hero only).
 */
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import { keyframes } from "@emotion/react";

const trace = keyframes`
  from { stroke-dashoffset: 1; }
  to { stroke-dashoffset: 0; }
`;

const RULES = 9;

const Waveform = () => (
  <Box
    component="svg"
    viewBox="0 0 300 36"
    preserveAspectRatio="none"
    aria-hidden="true"
    sx={{
      position: "absolute",
      left: 0,
      right: 0,
      top: "50%",
      height: 48,
      transform: "translateY(-50%)",
      color: "primary.main",
      opacity: 0.45,
    }}
  >
    <Box
      component="path"
      d="M0 18 C 30 2, 60 2, 90 18 C 110 28, 130 28, 150 18 C 180 2, 210 2, 240 18 C 260 26, 280 26, 300 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      pathLength="1"
      sx={{
        strokeDasharray: 1,
        strokeDashoffset: 1,
        animation: `${trace} 2.6s ease-out 0.4s forwards`,
        ["@media (prefers-reduced-motion: reduce)"]: {
          strokeDashoffset: 0,
          animation: "none",
        },
      }}
    />
  </Box>
);

export default function RuledPaper({ waveform = false }) {
  return (
    <Box
      sx={{
        position: "relative",
        height: { xs: 130, md: 170 },
        width: "100%",
      }}
    >
      {Array.from({ length: RULES }, (_, index) => (
        <Box
          key={index}
          sx={{
            position: "absolute",
            left: 0,
            right: 0,
            top: `${((index + 0.5) / RULES) * 100}%`,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        />
      ))}
      {waveform ? <Waveform /> : null}
    </Box>
  );
}

RuledPaper.propTypes = {
  waveform: PropTypes.bool,
};