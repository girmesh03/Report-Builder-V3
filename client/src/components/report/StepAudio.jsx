/**
 * @module components/report/StepAudio
 *
 * The wizard's audio step (§52.6, CR-048…CR-065): one narration
 * surface for the whole day — the record orb (CR-051), a quiet
 * attach action and whole-canvas drops (CR-050/053), take cards
 * with playback and actions (CR-056…059), progress dots with a
 * living hint (CR-060), and the raw-report peek (CR-061). Next is
 * the page's gate: disabled until at least one take exists (CR-063);
 * the page builds the §4.10 payload from the step-1 values plus the
 * staged clip ids and creates the report (CR-064), then navigates
 * to its details page (CR-013).
 *
 * The step is controlled — the page owns the takes rows (CR-011:
 * going back to step 1 must show exactly what was recorded, so the
 * data survives the step's unmount). Every gate mirrors the §11.3
 * mirrors (MIME allowlist, 50 MB size cap, 15-minute duration cap);
 * rejects surface in the toast and inline helpers (CR-054/055), and
 * the same-file skip is a note only (CR-053).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import Typography from "@mui/material/Typography";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MuiButton from "../reusable/MuiButton";
import MuiConfirmDialog from "../reusable/MuiConfirmDialog";
import RecordOrb from "./RecordOrb";
import TakeCard from "./TakeCard";
import {
  useUploadStagedClipMutation,
  useDeleteClipMutation,
} from "../../redux/features/audioEndpoints";
import useMediaRecorder from "../../utils/useMediaRecorder";
import { showToast } from "../../utils/toast";
import {
  WIZARD,
  TOAST_CATALOGUE,
  AUDIO_ALLOWED_MIME_TYPES,
  AUDIO_MAX_SIZE_BYTES,
  AUDIO_MAX_DURATION_SEC,
} from "../../utils/constants";
import { ethiopianToGregorian, formatEthiopianDate } from "../../utils/ethiopianDate";
import { orange } from "../../theme/themePrimitives";

const makeFormData = (file, durationSec) => {
  const formData = new FormData();
  formData.append("clip", file, file.name);
  formData.append("durationSec", String(durationSec));
  return formData;
};

const readDurationSec = (file) =>
  new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const audioEl = new Audio();
    audioEl.preload = "metadata";
    audioEl.onloadedmetadata = () => {
      const secs = Math.ceil(audioEl.duration);
      URL.revokeObjectURL(objectUrl);
      resolve(Number.isFinite(secs) && secs > 0 ? secs : 0);
    };
    audioEl.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(0);
    };
    audioEl.src = objectUrl;
  });

/**
 * @param {Object} props
 * @param {Object[]} props.takes - The page-owned take rows:
 *   `{ clip, name, size, busy }`; `clip` is null while uploading.
 * @param {Function} props.setTakes - Page state setter for the rows.
 * @param {Object} props.values - The watched step-1 form values (peek chips).
 * @param {string|null} props.userName - The profile's full name (peek chip).
 * @param {Function} props.branchNameOf - Branch id → name (peek chip).
 */
export default function StepAudio({ takes, setTakes, values, userName, branchNameOf }) {
  const fileInputRef = useRef(null);
  const replaceIndexRef = useRef(null);
  const takesRef = useRef(takes);

  const [uploadStagedClip] = useUploadStagedClipMutation();
  const [deleteClip] = useDeleteClipMutation();

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [replaceIndex, setReplaceIndex] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [peekOpen, setPeekOpen] = useState(false);
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    takesRef.current = takes;
  }, [takes]);

  const updateReplaceIndex = useCallback((value) => {
    replaceIndexRef.current = value;
    setReplaceIndex(value);
  }, []);

  const addTake = useCallback(
    async (file, durationSec) => {
      const index = takesRef.current.length;
      setTakes((prev) => [
        ...prev,
        { clip: null, name: file.name, size: file.size, busy: true },
      ]);
      try {
        const clip = await uploadStagedClip(makeFormData(file, durationSec)).unwrap();
        setTakes((prev) =>
          prev.map((take, i) =>
            i === index ? { clip, name: file.name, size: file.size, busy: false } : take,
          ),
        );
        setNotes([]);
      } catch {
        setTakes((prev) => prev.filter((_, i) => i !== index));
        showToast("error", TOAST_CATALOGUE.audio.uploadFailed);
      }
    },
    [setTakes, uploadStagedClip],
  );

  const handleClip = useCallback(
    async ({ blob, durationSec }) => {
      const fileName = `take-${takesRef.current.length + 1}.webm`;
      const file = new File([blob], fileName, { type: blob.type || "audio/webm" });
      const target = replaceIndexRef.current;
      if (target === null) {
        await addTake(file, durationSec);
        return;
      }
      const oldClipId = takesRef.current[target]?.clip?._id;
      setTakes((prev) =>
        prev.map((take, i) => (i === target ? { ...take, busy: true } : take)),
      );
      try {
        const clip = await uploadStagedClip(makeFormData(file, durationSec)).unwrap();
        if (oldClipId) {
          try {
            await deleteClip(oldClipId).unwrap();
          } catch {
            // The slot is replaced regardless — the old clip is orphaned.
          }
        }
        setTakes((prev) =>
          prev.map((take, i) =>
            i === target ? { clip, name: fileName, size: file.size, busy: false } : take,
          ),
        );
      } catch {
        setTakes((prev) =>
          prev.map((take, i) => (i === target ? { ...take, busy: false } : take)),
        );
        showToast("error", TOAST_CATALOGUE.audio.uploadFailed);
      }
      updateReplaceIndex(null);
    },
    [addTake, deleteClip, setTakes, updateReplaceIndex, uploadStagedClip],
  );

  const { state: recordState, elapsed, start, stop } = useMediaRecorder({
    onClipReady: handleClip,
    onCap: () => showToast("info", TOAST_CATALOGUE.audio.cap),
    onPermissionError: () => showToast("warning", TOAST_CATALOGUE.audio.permissionDenied),
  });

  const handleFiles = useCallback(
    async (fileList) => {
      const files = Array.from(fileList ?? []);
      const notes = [];
      let added = false;
      for (const file of files) {
        if (!AUDIO_ALLOWED_MIME_TYPES.includes(file.type)) {
          notes.push(WIZARD.audio.mimeNote);
          showToast("warning", TOAST_CATALOGUE.audio.rejectedMime);
          continue;
        }
        if (file.size > AUDIO_MAX_SIZE_BYTES) {
          notes.push(WIZARD.audio.sizeNote);
          showToast("warning", TOAST_CATALOGUE.audio.rejectedSize);
          continue;
        }
        const duplicate = takesRef.current.some(
          (take) => take.name === file.name && take.size === file.size,
        );
        if (duplicate) {
          notes.push(WIZARD.audio.duplicateNote);
          continue;
        }
        const durationSec = await readDurationSec(file);
        if (durationSec > AUDIO_MAX_DURATION_SEC) {
          notes.push(WIZARD.audio.durationNote);
          showToast("warning", TOAST_CATALOGUE.audio.rejectedDuration);
          continue;
        }
        await addTake(file, durationSec);
        added = true;
      }
      if (notes.length && !added) {
        setNotes(notes);
      }
    },
    [addTake],
  );

  const onDragOver = (event) => {
    event.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = () => setDragOver(false);

  const onDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    handleFiles(event.dataTransfer.files);
  };

  const onFilePick = (event) => {
    const files = event.target.files;
    if (files?.length) {
      handleFiles(files);
    }
    event.target.value = "";
  };

  const handleDeleteConfirmed = async () => {
    const index = confirmDelete;
    setConfirmDelete(null);
    const clipId = takesRef.current[index]?.clip?._id;
    if (!clipId) {
      return;
    }
    try {
      await deleteClip(clipId).unwrap();
      setTakes((prev) => prev.filter((_, i) => i !== index));
      showToast("success", TOAST_CATALOGUE.clip.deleted);
    } catch (error) {
      showToast("error", error?.message ?? TOAST_CATALOGUE.error.generic);
    }
  };

  const takeCount = takes.filter((take) => take.clip).length;
  const hintCopy =
    takeCount === 0
      ? WIZARD.audio.progressHint.empty
      : takeCount <= 2
        ? WIZARD.audio.progressHint.few
        : WIZARD.audio.progressHint.many;

  const dateLabel = formatEthiopianDate(ethiopianToGregorian(values.date));
  const timesLabel = `${values.clockIn?.format("HH:mm") ?? "—"} – ${
    values.clockOut?.format("HH:mm") ?? "—"
  }`;
  const narrationLine =
    takeCount === 0
      ? "—"
      : takeCount === 1
        ? WIZARD.audio.narrationOne
        : WIZARD.audio.narrationMany.replace("{count}", takeCount);

  const replaceHint = replaceIndex !== null ? (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <Typography variant="caption" color="text.secondary">
        {WIZARD.audio.orbReplace.replace("{number}", replaceIndex + 1)}
      </Typography>
      <MuiButton variant="text" size="small" onClick={() => updateReplaceIndex(null)}>
        {WIZARD.audio.replaceCancel}
      </MuiButton>
    </Box>
  ) : null;

  const attachAction = (
    <MuiButton
      variant="text"
      size="small"
      startIcon={<AttachFileIcon fontSize="small" />}
      onClick={() => fileInputRef.current?.click()}
    >
      {WIZARD.audio.attach}
    </MuiButton>
  );

  const orbRegion = (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
      <RecordOrb state={recordState} elapsed={elapsed} onStart={start} onStop={stop} />
      {replaceHint}
    </Box>
  );

  return (
    <Box tabIndex={-1} sx={{ outline: "none" }}>
      <Box
        sx={{
          position: "relative",
          borderRadius: 2,
          border: "2px dashed",
          borderColor: dragOver ? orange[400] : "divider",
          bgcolor: dragOver ? orange[50] : "transparent",
          transition: "border-color 150ms ease, background-color 150ms ease",
          p: { xs: 2, sm: 3 },
        }}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {takes.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              py: 4,
              textAlign: "center",
            }}
          >
            <Typography variant="h6">{WIZARD.audio.inviteTitle}</Typography>
            <Typography variant="body2" color="text.secondary">
              {WIZARD.audio.inviteParts}
            </Typography>
            {orbRegion}
            {attachAction}
            <Typography variant="caption" color="text.secondary">
              {WIZARD.audio.attachHint}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2 }}>
            <Box
              sx={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
              }}
            >
              {notes.length > 0 ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                  {notes.map((note) => (
                    <Typography key={note} variant="caption" color="warning.main">
                      {note}
                    </Typography>
                  ))}
                </Box>
              ) : null}
              {takes.map((take, index) => (
                <TakeCard
                  key={take.clip?._id ?? `pending-${index}`}
                  take={take}
                  index={index}
                  onReRecord={() => updateReplaceIndex(index)}
                  onDelete={() => setConfirmDelete(index)}
                />
              ))}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {takes.map((take, index) => (
                  <Box
                    key={take.clip?._id ?? `dot-${index}`}
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: orange[400],
                      opacity: take.busy ? 0.4 : 1,
                    }}
                  />
                ))}
                <Typography variant="caption" color="text.secondary">
                  {hintCopy}
                </Typography>
              </Box>
              <Box>
                <MuiButton
                  variant="text"
                  size="small"
                  endIcon={
                    <ExpandMoreIcon
                      fontSize="small"
                      sx={{
                        transform: peekOpen ? "rotate(180deg)" : "none",
                        transition: "transform 150ms ease",
                      }}
                    />
                  }
                  onClick={() => setPeekOpen((open) => !open)}
                >
                  {WIZARD.audio.peekToggle}
                </MuiButton>
                <Collapse in={peekOpen}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                      p: 1.5,
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      bgcolor: "background.paper",
                    }}
                  >
                    <Typography variant="subtitle2">{WIZARD.audio.peekTitle}</Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                      <Chip size="small" label={dateLabel} variant="outlined" />
                      <Chip size="small" label={branchNameOf(values.branch)} variant="outlined" />
                      <Chip size="small" label={timesLabel} variant="outlined" />
                      <Chip size="small" label={userName ?? "—"} variant="outlined" />
                    </Box>
                    <Typography variant="body2">{narrationLine}</Typography>
                  </Box>
                </Collapse>
              </Box>
              {attachAction}
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: { xs: "flex-end", md: "center" },
                gap: 1,
              }}
            >
              {orbRegion}
            </Box>
          </Box>
        )}
      </Box>

      <input
        ref={fileInputRef}
        type="file"
        accept={AUDIO_ALLOWED_MIME_TYPES.join(",")}
        multiple
        hidden
        onChange={onFilePick}
      />

      <MuiConfirmDialog
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDeleteConfirmed}
        title={WIZARD.audio.deleteTitle}
        message={WIZARD.audio.deleteMessage}
        confirmText={WIZARD.audio.deleteConfirm}
        cancelText={WIZARD.audio.deleteCancel}
        confirmColor="error"
      />
    </Box>
  );
}

StepAudio.propTypes = {
  takes: PropTypes.arrayOf(
    PropTypes.shape({
      clip: PropTypes.shape({
        _id: PropTypes.string,
        durationSec: PropTypes.number,
      }),
      name: PropTypes.string,
      size: PropTypes.number,
      busy: PropTypes.bool,
    }),
  ).isRequired,
  setTakes: PropTypes.func.isRequired,
  values: PropTypes.object.isRequired,
  userName: PropTypes.string,
  branchNameOf: PropTypes.func.isRequired,
};