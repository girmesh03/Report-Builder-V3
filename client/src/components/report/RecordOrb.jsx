/**
 * @module components/report/RecordOrb
 *
 * The audio step's record control (CR-051, §52.6): a warm-orange orb
 * (§43.2 — orange is reserved for audio) that rests as a filled
 * circle with a mic glyph and, while recording, swells into a ring
 * with a rounded stop square and a soft outward pulse, with the live
 * `MM:SS` timer below (tabular figures so the digits never shift).
 *
 * Re-record arming (CR-058, round-3 amendment): with
 * `replaceNumber` set the idle orb becomes a dashed ring holding the
 * target take's number in a small solid disc — distinct from idle
 * (mic) and recording (solid ring + stop + pulse); while recording
 * with a target the number rides as a corner badge. Presentational —
 * the owning step wires the recorder mechanics (useMediaRecorder)
 * and the placement (centered on the empty canvas, at the top of the
 * column once takes exist).
 */
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import MicIcon from "@mui/icons-material/Mic";
import StopIcon from "@mui/icons-material/Stop";
import { keyframes } from "@emotion/react";
import { orange } from "../../theme/themePrimitives";
import { WIZARD } from "../../utils/constants";

const pulseRing = keyframes`
  0% { box-shadow: 0 0 0 0 ${orange[200]}; }
  70% { box-shadow: 0 0 0 18px transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }
`;

const formatTime = (secs) => {
  const s = Math.max(0, Math.floor(secs));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(m).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
};

/**
 * @param {Object} props
 * @param {('idle'|'recording')} props.state - Recorder state from useMediaRecorder.
 * @param {number} props.elapsed - Live seconds while recording.
 * @param {Function} props.onStart - Starts a session.
 * @param {Function} props.onStop - Stops the session (the take is emitted).
 * @param {number|null} [props.replaceNumber] - Armed re-record target (1-based take number).
 */
export default function RecordOrb({ state, elapsed, onStart, onStop, replaceNumber = null }) {
  const recording = state === "recording";
  const armed = replaceNumber !== null;
  const label = recording
    ? WIZARD.audio.orbStop
    : armed
      ? WIZARD.audio.orbReplace.replace("{number}", replaceNumber)
      : WIZARD.audio.orbStart;
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
      <Box sx={{ position: "relative" }}>
        <Tooltip title={label}>
          <Box
            component="button"
            type="button"
            aria-label={label}
            onClick={recording ? onStop : onStart}
            sx={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              border: "none",
              p: 0,
              transition:
                "background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease",
              ...(recording
                ? {
                    backgroundColor: "transparent",
                    border: `4px solid ${orange[400]}`,
                    transform: "scale(1.08)",
                    animation: `${pulseRing} 1.6s ease-out infinite`,
                    "&:hover": { borderColor: orange[500] },
                  }
                : armed
                  ? {
                      backgroundColor: "transparent",
                      border: `2px dashed ${orange[500]}`,
                      "&:hover": { borderColor: orange[700] },
                    }
                  : {
                      backgroundColor: orange[400],
                      boxShadow: `0 4px 14px ${orange[300]}`,
                      "&:hover": { backgroundColor: orange[500], transform: "translateY(-1px)" },
                    }),
              "&:focus-visible": { outline: `2px solid ${orange[700]}`, outlineOffset: 3 },
              "&:active": { transform: "scale(0.97)" },
              "@media (prefers-reduced-motion: reduce)": {
                animation: "none",
                transition: "none",
              },
            }}
          >
            {recording ? (
              <StopIcon sx={{ color: orange[800], fontSize: 26 }} />
            ) : armed ? (
              <Box
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  backgroundColor: orange[400],
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 14,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {replaceNumber}
              </Box>
            ) : (
              <MicIcon sx={{ color: "#fff", fontSize: 30 }} />
            )}
          </Box>
        </Tooltip>
        {recording && armed ? (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 22,
              height: 22,
              borderRadius: "50%",
              backgroundColor: orange[700],
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
              border: `2px solid ${orange[50]}`,
            }}
          >
            {replaceNumber}
          </Box>
        ) : null}
      </Box>
      <Box sx={{ height: 20 }}>
        {recording ? (
          <Box
            component="span"
            sx={{
              fontVariantNumeric: "tabular-nums",
              color: orange[800],
              fontWeight: 600,
              letterSpacing: 0.5,
            }}
          >
            {formatTime(elapsed)}
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}

RecordOrb.propTypes = {
  state: PropTypes.oneOf(["idle", "recording"]).isRequired,
  elapsed: PropTypes.number.isRequired,
  onStart: PropTypes.func.isRequired,
  onStop: PropTypes.func.isRequired,
  replaceNumber: PropTypes.number,
};