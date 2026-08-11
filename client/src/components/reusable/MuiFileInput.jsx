/**
 * @module components/reusable/MuiFileInput
 *
 * The multi-file audio upload input (§46.17): a dashed drop-zone
 * surface. `accept` mirrors the §32 AUDIO_ALLOWED_MIME_TYPES mirror
 * (§11.3) — never a hard-coded list here; selection + drag-drop; per
 * file size limit with §60 toast/inline reject messages; repeated-pick
 * dedupe; each accepted file becomes a clip of the labelled visit
 * (§52.6) via the owning form's §42 create-clip call.
 */
import { useRef, useCallback, useState } from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import DeleteIcon from "@mui/icons-material/Delete";
import UploadIcon from "@mui/icons-material/Upload";
import { AUDIO_MAX_SIZE_BYTES, AUDIO_ALLOWED_MIME_TYPES } from "../../utils/constants";

/**
 * @param {Object} props
 * @param {readonly string[]} [props.accept] - Mirrored MIME list (§32) — defaults to the §11.3 mirror.
 * @param {boolean} [props.multiple] - Multi-file selection.
 * @param {Function} props.onFiles - Emits accepted File[].
 * @param {Function} [props.onReject] - Emits rejected { file, reason } (size/type).
 * @param {boolean} [props.disabled] - Disables the drop zone.
 */
export default function MuiFileInput({
  accept = AUDIO_ALLOWED_MIME_TYPES,
  multiple = true,
  onFiles,
  onReject,
  disabled = false,
}) {
  const inputRef = useRef(null);
  const [selected, setSelected] = useState([]);
  const [rejects, setRejects] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback(
    (fileList) => {
      if (!fileList) return;
      const incoming = Array.from(fileList);
      const accepted = [];
      const rejected = [];

      incoming.forEach((file) => {
        if (!accept.includes(file.type)) {
          rejected.push({ file, reason: "type" });
          return;
        }
        if (file.size > AUDIO_MAX_SIZE_BYTES) {
          rejected.push({ file, reason: "size" });
          return;
        }
        if (selected.some((s) => s.name === file.name && s.size === file.size)) {
          rejected.push({ file, reason: "duplicate" });
          return;
        }
        accepted.push(file);
      });

      if (accepted.length > 0) {
        setSelected((prev) => (multiple ? [...prev, ...accepted] : accepted));
        onFiles(accepted);
      }
      if (rejected.length > 0) {
        setRejects(rejected);
        if (onReject) onReject(rejected);
      }
    },
    [accept, multiple, selected, onFiles, onReject]
  );

  const removeFile = useCallback(
    (index) => {
      setSelected((prev) => prev.filter((_, i) => i !== index));
    },
    []
  );

  return (
    <Box>
      <Box
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (!disabled) handleFiles(e.dataTransfer.files);
        }}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
          flexDirection: "column",
          border: "2px dashed",
          borderColor: isDragging ? "primary.main" : "divider",
          borderRadius: 2,
          px: 2,
          py: 3,
          textAlign: "center",
          cursor: disabled ? "not-allowed" : "pointer",
          "&:hover": disabled
            ? undefined
            : { borderColor: "primary.main", backgroundColor: "action.hover" },
        }}
      >
        <UploadIcon color="action" />
        <Typography variant="body2" color="text.secondary">
          {multiple ? "Drop audio files here, or click to browse" : "Drop an audio file here, or click to browse"}
        </Typography>
        <input
          ref={inputRef}
          type="file"
          hidden
          multiple={multiple}
          accept={accept.join(",")}
          disabled={disabled}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </Box>
      {selected.length > 0 ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 1 }}>
          {selected.map((file, index) => (
            <Box key={`${file.name}-${file.size}`} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Chip size="small" label={file.name} />
              <Tooltip title="Remove">
                <IconButton aria-label="Remove file" size="small" onClick={() => removeFile(index)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          ))}
        </Box>
      ) : null}
      {rejects.length > 0 ? (
        <Box sx={{ mt: 1 }}>
          {rejects.map((r, index) => (
            <Typography key={index} variant="caption" color="error.main" display="block">
              {r.reason === "size"
                ? `${r.file.name} exceeds the size limit`
                : r.reason === "duplicate"
                  ? `${r.file.name} was already picked`
                  : `${r.file.name} is not a supported audio format`}
            </Typography>
          ))}
        </Box>
      ) : null}
    </Box>
  );
}

MuiFileInput.propTypes = {
  accept: PropTypes.arrayOf(PropTypes.string),
  multiple: PropTypes.bool,
  onFiles: PropTypes.func.isRequired,
  onReject: PropTypes.func,
  disabled: PropTypes.bool,
};