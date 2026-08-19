/**
 * @module components/report/CorrectionDialog
 *
 * The transcription step's correction request (round-7 amendment,
 * §54.7; round-8 amendment, §54.2): one dialog where the user states
 * WHAT should be corrected — typed into the editor-like borderless
 * field (same font stack/size as the story surface, underline
 * removed, placeholder kept), or spoken through the mic (the clip is
 * transcribed by the STT-only endpoint and the returned text fills
 * the field for editing). The provider menu (default Addis — the
 * label-less compact Select, §46.17) and the mic sit BELOW the
 * field, right aligned. Apply sends the field text as the
 * instruction with the existing transcription (the report's
 * `latest`, read server-side) to the correction endpoint; on success
 * the host fills the live editor with the candidate and the dialog
 * closes — on failure the dialog stays open with the text preserved
 * and the error toasted.
 *
 * The dialog owns its instruction/provider/recorder state; the mic
 * follows the three states idle → recording (stop square, pulsing)
 * → STT in flight (spinner replaces the icon). The recording
 * mechanics are the §52.6 `useMediaRecorder` (cap + permission
 * toasts); the mock's STT substitutes a deterministic canned
 * instruction (documented §66.10 limitation). The dialog is memoized
 * and its recorder callback is stable (round-8, §54.2): parent
 * churn never re-renders it, and the recorder's `start` identity
 * never changes mid-session. The STT/apply reads target the
 * envelope-unwrapped result (`result.text`, `result.content` — the
 * §42.4 normalization returns the payload directly).
 *
 * Round-8.1 zero-lag field (§54.2): the instruction input owns its
 * value INSIDE itself — typing re-renders only that small subtree,
 * never the dialog (provider row, mic, actions stay untouched); the
 * dialog learns only emptiness FLIPS (the Apply disabled state) and
 * reads the live text at Apply through the imperative `getValue()`;
 * the STT transcription lands through `seed(text)`. Closing the
 * dialog discards the field's draft (the standard dialog pattern —
 * a FAILED apply keeps the dialog open, so the text is never lost
 * mid-attempt).
 */
import {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import MicIcon from "@mui/icons-material/Mic";
import StopIcon from "@mui/icons-material/Stop";
import { keyframes } from "@emotion/react";
import MuiButton from "../reusable/MuiButton";
import MuiDialog from "../reusable/MuiDialog";
import MuiProviderSelect from "../reusable/MuiProviderSelect";
import MuiTextField from "../reusable/MuiTextField";
import { useTranscribeInstructionMutation } from "../../redux/features/reportsEndpoints";
import useMediaRecorder from "../../utils/useMediaRecorder";
import { AI_PROVIDERS, TOAST_CATALOGUE, WIZARD } from "../../utils/constants";
import { showToast } from "../../utils/toast";

const recordingPulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(211, 47, 47, 0.35); }
  70% { box-shadow: 0 0 0 8px transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }
`;

/**
 * The zero-lag instruction field (round-8.1, §54.2 — the §53.3
 * doctrine): a controlled input that owns its value INSIDE itself.
 * Typing re-renders only this subtree — the dialog, provider row,
 * mic and actions never see a keystroke. The host learns only
 * emptiness FLIPS (the Apply disabled state) and reads the live
 * text at Apply through the imperative `getValue()`; the STT
 * transcription lands through `seed(text)`.
 */
const InstructionField = forwardRef(function InstructionField(
  { disabled, placeholder, ariaLabel, onEmptyChange, error = null, onClearError },
  ref,
) {
  const [value, setValue] = useState("");
  const emptyRef = useRef(true);

  useImperativeHandle(
    ref,
    () => ({
      getValue: () => value,
      seed: (text) => {
        setValue(text);
        const empty = text.trim() === "";
        if (empty !== emptyRef.current) {
          emptyRef.current = empty;
          onEmptyChange(empty);
        }
        if (error) onClearError?.();
      },
    }),
    [value, onEmptyChange, error, onClearError],
  );

  return (
    <MuiTextField
      variant="standard"
      placeholder={placeholder}
      multiline
      minRows={2}
      maxRows={4}
      disabled={disabled}
      value={value}
      error={Boolean(error)}
      helperText={error ?? undefined}
      onChange={(event) => {
        setValue(event.target.value);
        const empty = event.target.value.trim() === "";
        if (empty !== emptyRef.current) {
          emptyRef.current = empty;
          onEmptyChange(empty);
        }
        // Round-8.2 (§54.2): typing clears the highlighted instruction
        // field.
        if (error) onClearError?.();
      }}
      aria-label={ariaLabel}
      sx={{
        "& .MuiInput-underline:before, & .MuiInput-underline:after": {
          display: "none",
        },
        "& .MuiInputBase-root": {
          fontFamily: '"Noto Serif Ethiopic", "Inter", sans-serif',
          fontSize: "1.0625rem",
          lineHeight: 1.75,
          color: "text.primary",
        },
        "& .MuiInputBase-inputMultiline": {
          bgcolor: "background.paper",
          borderRadius: 1.5,
          px: 1.25,
          py: 1,
          // Round-8.2 (§54.2): the 422 instruction message highlights
          // the field with a stable 1px frame.
          border: 1,
          borderColor: error ? "error.main" : "transparent",
        },
      }}
    />
  );
});

InstructionField.displayName = "InstructionField";

InstructionField.propTypes = {
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
  ariaLabel: PropTypes.string,
  onEmptyChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  onClearError: PropTypes.func,
};

/**
 * @param {Object} props
 * @param {boolean} props.open - Dialog visibility.
 * @param {string|null} props.reportId - The report the correction targets.
 * @param {Function} props.onClose - Close (Cancel / Escape / backdrop).
 * @param {Function} props.onApply - (instruction, provider) → Promise<boolean>:
 *   applies the candidate to the live editor, toasts, resolves `true` on
 *   success (the dialog closes) or `false` after an error toast (it stays).
 */
function CorrectionDialog({ open, reportId, onClose, onApply }) {
  const [instructionEmpty, setInstructionEmpty] = useState(true);
  const [instructionError, setInstructionError] = useState(null);
  const [provider, setProvider] = useState(AI_PROVIDERS[0]);
  const [applying, setApplying] = useState(false);
  const [sttBusy, setSttBusy] = useState(false);
  const sttBusyRef = useRef(false);
  const instructionRef = useRef(null);

  const [transcribeInstruction] = useTranscribeInstructionMutation();

  const handleEmptyChange = useCallback((empty) => {
    setInstructionEmpty(empty);
  }, []);

  const handleClipReady = useCallback(
    async ({ blob, durationSec }) => {
      if (sttBusyRef.current) {
        return;
      }
      sttBusyRef.current = true;
      setSttBusy(true);
      const file = new File([blob], "instruction.webm", {
        type: blob.type || "audio/webm",
      });
      const formData = new FormData();
      formData.append("clip", file, file.name);
      formData.append("durationSec", String(durationSec));
      try {
        const result = await transcribeInstruction({ reportId, formData }).unwrap();
        instructionRef.current?.seed(result?.text ?? "");
      } catch (error) {
        showToast("error", error?.message ?? TOAST_CATALOGUE.error.generic);
      } finally {
        sttBusyRef.current = false;
        setSttBusy(false);
      }
    },
    [reportId, transcribeInstruction],
  );

  const handleCap = useCallback(() => {
    showToast("info", TOAST_CATALOGUE.audio.cap);
  }, []);

  const handlePermissionError = useCallback(() => {
    showToast("warning", TOAST_CATALOGUE.audio.permissionDenied);
  }, []);

  const { state: recorderState, start, stop } = useMediaRecorder({
    onClipReady: handleClipReady,
    onCap: handleCap,
    onPermissionError: handlePermissionError,
  });

  const recording = recorderState === "recording";
  const busy = applying || sttBusy;

  const handleApply = async () => {
    setApplying(true);
    try {
      const instruction = instructionRef.current?.getValue() ?? "";
      const ok = await onApply(instruction.trim(), provider);
      if (ok) {
        onClose();
      }
    } catch (error) {
      // Round-8.2 (§54.2): the 422 instruction message highlights the
      // field ("check the highlighted fields" becomes true); anything
      // else stays toast-only.
      setInstructionError(error?.fieldErrors?.instruction ?? null);
    } finally {
      setApplying(false);
    }
  };

  // Round-8.2 (§54.2): closing drops the highlight so a fresh open
  // never inherits a stale field error (effect-free reset).
  const handleDialogClose = useCallback(() => {
    setInstructionError(null);
    onClose();
  }, [onClose]);

  return (
    <MuiDialog
      open={open}
      onClose={handleDialogClose}
      title={WIZARD.modes.revision}
      actions={
        <>
          <MuiButton variant="text" onClick={onClose} disabled={applying}>
            {WIZARD.modes.cancel}
          </MuiButton>
          <MuiButton
            variant="contained"
            onClick={handleApply}
            loading={applying}
            disabled={instructionEmpty || sttBusy || recording}
          >
            {WIZARD.modes.apply}
          </MuiButton>
        </>
      }
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          p: 2,
        }}
      >
        <InstructionField
          ref={instructionRef}
          disabled={busy}
          placeholder={WIZARD.modes.instructionPlaceholder}
          ariaLabel={WIZARD.modes.instructionPlaceholder}
          onEmptyChange={handleEmptyChange}
          error={instructionError}
          onClearError={() => setInstructionError(null)}
        />
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 1.5,
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ width: { xs: "100%", sm: 180 }, minWidth: 140 }}>
            <MuiProviderSelect
              value={provider}
              onChange={setProvider}
              disabled={busy}
            />
          </Box>
          <Tooltip title={WIZARD.modes.recordInstruction}>
            <span>
              <IconButton
                onClick={recording ? stop : start}
                disabled={applying || sttBusy}
                aria-label={
                  sttBusy
                    ? WIZARD.modes.transcribingInstruction
                    : WIZARD.modes.recordInstruction
                }
                size="small"
                sx={{
                  flexShrink: 0,
                  width: 36,
                  height: 36,
                  color: recording ? "error.main" : "text.secondary",
                  ...(recording && {
                    animation: `${recordingPulse} 1.4s ease-out infinite`,
                    "@media (prefers-reduced-motion: reduce)": {
                      animation: "none",
                    },
                  }),
                }}
              >
                {sttBusy ? (
                  <CircularProgress size={18} color="inherit" />
                ) : recording ? (
                  <StopIcon fontSize="small" />
                ) : (
                  <MicIcon fontSize="small" />
                )}
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>
    </MuiDialog>
  );
}

CorrectionDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  reportId: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
};

export default memo(CorrectionDialog);