/**
 * @module components/reusable/MuiConfirmDialog
 *
 * Every destructive or irreversible confirmation (§46.9): archive,
 * restore, delete, session revoke, leave-with-unsaved. Built on
 * MuiDialog (§46.10); fullscreen below 600px (§45.6). The message is a
 * full sentence in plain end-user language (§12.5).
 */
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import MuiButton from "./MuiButton";
import MuiDialog from "./MuiDialog";

/**
 * @param {Object} props
 * @param {boolean} props.open - Dialog visibility.
 * @param {Function} props.onClose - Cancel/backdrop/Escape close.
 * @param {Function} props.onConfirm - Runs the action and closes.
 * @param {string} props.title - Dialog title.
 * @param {string} props.message - Plain-language sentence (§12.5).
 * @param {string} [props.confirmText] - Confirm button label.
 * @param {string} [props.cancelText] - Cancel button label.
 * @param {string} [props.confirmColor] - Role color; error for deletes.
 */
export default function MuiConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmColor = "primary",
}) {
  return (
    <MuiDialog
      open={open}
      onClose={onClose}
      title={title}
      maxWidth="xs"
      actions={
        <>
          <MuiButton variant="outlined" onClick={onClose}>
            {cancelText}
          </MuiButton>
          <MuiButton color={confirmColor} onClick={onConfirm}>
            {confirmText}
          </MuiButton>
        </>
      }
    >
      <Box sx={{ pt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </Box>
    </MuiDialog>
  );
}

MuiConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  confirmColor: PropTypes.string,
};