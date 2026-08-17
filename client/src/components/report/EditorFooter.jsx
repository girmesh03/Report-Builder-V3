/**
 * @module components/report/EditorFooter
 *
 * The §53.5 persistent footer — the icon row under the §53 editor:
 * the save-state line on the left ("Saved HH:mm" / "Unsaved changes" /
 * "Saving…" / "✓ Saved just now" / "No changes yet", from §11.4
 * chrome) and Revert + Save on the right — Revert disabled while the
 * content is unmodified, Save success-colored right after a save and
 * error-colored while modified but unsaved. Shared by every writing
 * surface host (the transcription step's story card and the report
 * step's body card) — one implementation, ADR-033.
 */
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import RestoreIcon from "@mui/icons-material/Restore";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { WIZARD } from "../../utils/constants";

/**
 * @param {Object} props
 * @param {string|null} props.lastSavedAt - "HH:mm" of the last write.
 * @param {boolean} props.saving - A save is in flight.
 * @param {boolean} props.reverting - A revert is in flight.
 * @param {boolean} props.justSaved - The brief ✓ Saved just now window.
 * @param {boolean} props.dirty - The document diverged from the seed.
 * @param {boolean} props.canRevert - latest exists or the document is dirty.
 * @param {Function} props.onSave - The boundary-read save.
 * @param {Function} props.onRevert - The single-undo revert.
 */
export default function EditorFooter({
  lastSavedAt,
  saving,
  reverting,
  justSaved,
  dirty,
  canRevert,
  onSave,
  onRevert,
}) {
  const status = saving
    ? WIZARD.modes.saving
    : justSaved
      ? WIZARD.modes.savedJustNow
      : dirty
        ? WIZARD.modes.unsaved
        : lastSavedAt
          ? WIZARD.modes.savedAt.replace("{time}", lastSavedAt)
          : WIZARD.modes.noChanges;

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 1,
        px: 2,
        py: 1,
      }}
    >
      <Typography
        variant="caption"
        color={justSaved ? "success.main" : "text.secondary"}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          minHeight: 18,
        }}
      >
        {justSaved ? <CheckCircleOutlinedIcon fontSize="small" /> : null}
        {status}
      </Typography>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          ml: "auto",
        }}
      >
        <IconButton
          size="small"
          aria-label={WIZARD.modes.revertToOriginal}
          onClick={onRevert}
          disabled={!canRevert || saving}
          loading={reverting}
          sx={{ width: 32, height: 32 }}
        >
          <RestoreIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          aria-label={WIZARD.modes.save}
          onClick={onSave}
          disabled={reverting}
          loading={saving}
          color={dirty ? "error" : justSaved ? "success" : "default"}
          sx={{ width: 32, height: 32 }}
        >
          <SaveOutlinedIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}