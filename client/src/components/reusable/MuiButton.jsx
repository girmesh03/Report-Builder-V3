/**
 * @module components/reusable/MuiButton
 *
 * The single button (§46.3) — composed by every surface. Icon-only
 * buttons stay raw IconButton, never MuiButton (§44.2).
 */
import PropTypes from "prop-types";
import Button from "@mui/material/Button";

/**
 * @param {Object} props
 * @param {('contained'|'outlined'|'text')} [props.variant] - Button variant (default contained).
 * @param {string} [props.color] - Theme color role (default primary).
 * @param {('small'|'medium'|'large')} [props.size] - Density (default small).
 * @param {boolean} [props.loading] - Native MUI loading state (disables + shows indicator).
 * @param {('center'|'start'|'end')} [props.loadingPosition] - Indicator placement (default center).
 * @param {ReactNode} [props.loadingIndicator] - Replaces the default CircularProgress.
 * @param {ReactNode} [props.startIcon] - Leading icon slot.
 * @param {ReactNode} [props.endIcon] - Trailing icon slot.
 * @param {boolean} [props.fullWidth] - Full-width in form columns (§46.3).
 * @param {boolean} [props.disabled] - Disables the control.
 * @param {ReactNode} props.children - Button label.
 * @param {Function} [props.onClick] - Click handler.
 * @param {Object} [props.sx] - Style overrides.
 * @param {string} [props.type] - Native button type (button/submit).
 */
export default function MuiButton({
  variant = "contained",
  color = "primary",
  size = "small",
  loading = false,
  loadingPosition = "center",
  loadingIndicator,
  startIcon,
  endIcon,
  fullWidth,
  disabled,
  children,
  onClick,
  sx,
  type,
  ...rest
}) {
  return (
    <Button
      variant={variant}
      color={color}
      size={size}
      fullWidth={fullWidth}
      disabled={disabled}
      onClick={onClick}
      type={type}
      startIcon={startIcon}
      endIcon={endIcon}
      loading={loading}
      loadingPosition={loadingPosition}
      loadingIndicator={loadingIndicator}
      sx={{ flexShrink: 0, ...sx }}
      {...rest}
    >
      {children}
    </Button>
  );
}

MuiButton.propTypes = {
  variant: PropTypes.oneOf(["contained", "outlined", "text"]),
  color: PropTypes.string,
  size: PropTypes.oneOf(["small", "medium", "large"]),
  loading: PropTypes.bool,
  loadingPosition: PropTypes.oneOf(["center", "start", "end"]),
  loadingIndicator: PropTypes.node,
  startIcon: PropTypes.node,
  endIcon: PropTypes.node,
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  children: PropTypes.node,
  onClick: PropTypes.func,
  sx: PropTypes.object,
  type: PropTypes.string,
};