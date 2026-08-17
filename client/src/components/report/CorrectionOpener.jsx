/**
 * @module components/report/CorrectionOpener
 *
 * The Mode-2/3 entry shared by every writing-surface host (the
 * transcription step's story card and the report step's body card):
 * the circular AutoFix action at the card header's top right plus the
 * CorrectionDialog mount it opens — one implementation, ADR-033.
 * The opener is disabled until the host is ready (nothing is
 * fabricated where nothing is known, §52.7).
 */
import { useCallback, useState } from "react";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import CorrectionDialog from "./CorrectionDialog";
import { WIZARD } from "../../utils/constants";

/**
 * @param {Object} props
 * @param {boolean} props.disabled - Host not ready yet (no content to correct).
 * @param {string|null} props.reportId - The report the correction targets.
 * @param {Function} props.onApply - The §54.3 apply contract:
 *   (instruction, provider) → Promise<boolean>.
 */
export default function CorrectionOpener({ disabled, reportId, onApply }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  return (
    <>
      <Tooltip title={WIZARD.transcription.addCorrection}>
        <span>
          <IconButton
            onClick={() => setDialogOpen(true)}
            disabled={disabled}
            aria-label={WIZARD.transcription.addCorrection}
            sx={{
              width: 36,
              height: 36,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              "&:hover": { bgcolor: "primary.dark" },
              "&.Mui-disabled": {
                bgcolor: "action.disabledBackground",
                color: "action.disabled",
              },
            }}
          >
            <AutoFixHighIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <CorrectionDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        reportId={reportId}
        onApply={onApply}
      />
    </>
  );
}