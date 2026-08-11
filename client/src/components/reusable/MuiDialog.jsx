/**
 * @module components/reusable/MuiDialog
 *
 * The only dialog wrapper (§44.4, §46.10). MuiConfirmDialog and the
 * date picker's mobile mode build on it; GlobalSearchDialog is the one
 * standalone exception (§46.15). Fullscreen below 600px or below 900px
 * in landscape (§45.6).
 */
import PropTypes from "prop-types";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Slide from "@mui/material/Slide";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { forwardRef } from "react";

const SlideTransition = forwardRef(function SlideTransition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

/**
 * @param {Object} props
 * @param {boolean} props.open - Dialog visibility.
 * @param {Function} props.onClose - Close handler (Escape/backdrop).
 * @param {ReactNode} [props.children] - Dialog body (DialogContent).
 * @param {ReactNode} [props.actions] - Action slot (MuiConfirmDialog contract).
 * @param {ReactNode} [props.title] - Title node (DialogTitle).
 * @param {('xs'|'sm'|'md'|'lg'|'xl')} [props.maxWidth] - Width bound.
 * @param {boolean} [props.fullWidth] - Full-width within maxWidth.
 */
export default function MuiDialog({
  open,
  onClose,
  children,
  actions,
  title,
  maxWidth = "sm",
  fullWidth = true,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isBelowMd = useMediaQuery(theme.breakpoints.down("md"));
  const isLandscape = useMediaQuery("(orientation: landscape)");
  const fullscreen = isMobile || (isLandscape && isBelowMd);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullscreen}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      TransitionComponent={fullscreen ? SlideTransition : undefined}
      disableEnforceFocus
      disableRestoreFocus
      slotProps={{
        paper: {
          sx: {
            borderRadius: fullscreen ? 0 : 2.5,
          },
        },
      }}
    >
      {title ? <DialogTitle>{title}</DialogTitle> : null}
      <DialogContent dividers sx={{ maxHeight: 400, overflowY: "auto", p: 0 }}>
        {children}
      </DialogContent>
      {actions ? <DialogActions>{actions}</DialogActions> : null}
    </Dialog>
  );
}

MuiDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node,
  actions: PropTypes.node,
  title: PropTypes.node,
  maxWidth: PropTypes.oneOf(["xs", "sm", "md", "lg", "xl"]),
  fullWidth: PropTypes.bool,
};
