/**
 * @module components/reusable/MuiRecorder
 *
 * The device recording strip (§46.17 — §52.6): a circular record/stop
 * button, a live `MM:SS` timer, and after stop a per-clip chip with
 * re-record (discards the take — the §52.6 label binding, never an
 * upload) and Add (appends the take as a clip of the labelled visit,
 * §32). MediaRecorder API; `onPermissionError` surfaces the §60 error
 * toast + the MuiFileInput fallback hint via the owning form.
 */
import { useRef, useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import StopIcon from "@mui/icons-material/Stop";
import AddIcon from "@mui/icons-material/Add";
import ReplayIcon from "@mui/icons-material/Replay";
import { AUDIO_MAX_DURATION_SEC } from "../../utils/constants";

/**
 * @param {Object} props
 * @param {Function} [props.onClipReady] - Emits the Blob take after stop.
 * @param {Function} [props.onPermissionError] - Permission-denied callback (§60 toast + fallback hint).
 * @param {boolean} [props.disabled] - Disables the recorder.
 * @param {number} [props.maxDurationSec] - Recording cap, defaults to the §11.3 mirror.
 */
export default function MuiRecorder({
  onClipReady,
  onPermissionError,
  disabled = false,
  maxDurationSec = AUDIO_MAX_DURATION_SEC,
}) {
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const elapsedRef = useRef(0);

  const [state, setState] = useState("idle"); // idle | recording | has-take | error
  const [elapsed, setElapsed] = useState(0);
  const [take, setTake] = useState(null);
  const [takeSeconds, setTakeSeconds] = useState(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      elapsedRef.current = 0;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        setTake(blob);
        setTakeSeconds(elapsedRef.current);
        setState("has-take");
      };
      recorder.start();
      setState("recording");
      setElapsed(0);
      timerRef.current = setInterval(() => {
        elapsedRef.current += 1;
        setElapsed(elapsedRef.current);
        if (elapsedRef.current >= maxDurationSec) {
          stopRecording();
        }
      }, 1000);
    } catch {
      setState("error");
      if (onPermissionError) onPermissionError();
    }
  }, [maxDurationSec, onPermissionError, stopRecording]);

  const discardTake = useCallback(() => {
    setTake(null);
    setTakeSeconds(0);
    setElapsed(0);
    setState("idle");
  }, []);

  const addTake = useCallback(() => {
    if (take && onClipReady) {
      onClipReady({ blob: take, durationSec: takeSeconds });
    }
    discardTake();
  }, [take, takeSeconds, onClipReady, discardTake]);

  const formatTime = (secs) => {
    const s = Math.max(0, Math.floor(secs));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${String(m).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      {state === "recording" ? (
        <Tooltip title="Stop recording">
          <IconButton sx={{ color: "error.main" }} aria-label="Stop recording" onClick={stopRecording} size="small">
            <StopIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip title="Record">
          <span>
            <IconButton
              sx={{ color: "error.main" }}
              aria-label="Record"
              onClick={startRecording}
              disabled={disabled || state === "has-take"}
              size="small"
            >
              <FiberManualRecordIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      )}
      <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: "tabular-nums", minWidth: 52 }}>
        {formatTime(state === "has-take" ? takeSeconds : elapsed)}
      </Typography>
      {state === "has-take" ? (
        <>
          <Chip size="small" label={`Take ${formatTime(takeSeconds)}`} />
          <Tooltip title="Re-record — discards this take">
            <IconButton aria-label="Re-record" onClick={discardTake} size="small">
              <ReplayIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Add take">
            <IconButton aria-label="Add take" onClick={addTake} size="small">
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </>
      ) : null}
    </Box>
  );
}

MuiRecorder.propTypes = {
  onClipReady: PropTypes.func,
  onPermissionError: PropTypes.func,
  disabled: PropTypes.bool,
  maxDurationSec: PropTypes.number,
};