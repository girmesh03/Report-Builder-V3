/**
 * @module components/reusable/MuiTextField
 *
 * All text entry (§46.4): single-line, multiline, and passwords (an
 * internal eye toggle on type="password"). Every text input carries a
 * start adornment (§44.2). The component `ref` forwards to the real
 * `<input>` element (MUI's TextField sends its ref to the root slot;
 * `slotProps.input.ref` is the input) — the RHF/imperative contract.
 */
import { useState, useCallback, forwardRef } from "react";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

/**
 * @param {Object} props
 * @param {string} [props.label] - Field label.
 * @param {string} [props.placeholder] - Placeholder hint.
 * @param {('text'|'password'|'number'|'email'|'search'|'tel'|'url')} [props.type] - Native input type (default text).
 * @param {('small'|'medium')} [props.size] - Density (default small).
 * @param {boolean} [props.required] - Marks the field required.
 * @param {boolean} [props.disabled] - Disables the field.
 * @param {boolean} [props.multiline] - Renders a multiline field.
 * @param {number} [props.rows] - Fixed rows for multiline.
 * @param {number} [props.maxRows] - Growth cap for multiline (§45.5).
 * @param {boolean} [props.fullWidth] - Full-width inside form columns.
 * @param {boolean} [props.error] - Validation error state.
 * @param {string} [props.helperText] - Manual-resolver message (§46.4), reserved space.
 * @param {ReactNode} [props.startAdornment] - Leading adornment (icon).
 * @param {ReactNode} [props.endAdornment] - Trailing adornment (the password eye overrides it).
 * @param {Object} [props.slotProps] - Passed to the underlying TextField.
 * @param {Object} [props.sx] - Style overrides.
 */
const MuiTextField = forwardRef(function MuiTextField(props, ref) {
  const {
    label,
    placeholder,
    type = "text",
    size = "small",
    required = false,
    disabled = false,
    multiline = false,
    rows,
    maxRows,
    fullWidth = true,
    error = false,
    helperText,
    startAdornment,
    endAdornment,
    slotProps,
    sx,
    ...rest
  } = props;

  const [showPassword, setShowPassword] = useState(false);

  const togglePassword = useCallback(
    (event) => {
      event.preventDefault();
      setShowPassword((prev) => !prev);
    },
    []
  );

  const isPassword = type === "password";
  const effectiveType = isPassword && showPassword ? "text" : type;

  const passwordEye = isPassword ? (
    <InputAdornment position="end">
      <Tooltip title={showPassword ? "Hide password" : "Show password"}>
        <IconButton
          aria-label={showPassword ? "Hide password" : "Show password"}
          onMouseDown={togglePassword}
          onMouseUp={togglePassword}
          edge="end"
          tabIndex={-1}
        >
          {showPassword ? (
            <VisibilityOffIcon fontSize="small" />
          ) : (
            <VisibilityIcon fontSize="small" />
          )}
        </IconButton>
      </Tooltip>
    </InputAdornment>
  ) : null;

  const effectiveEndAdornment = isPassword ? passwordEye : endAdornment;

  return (
    <TextField
      label={label}
      placeholder={placeholder}
      type={effectiveType}
      size={size}
      required={required}
      disabled={disabled}
      multiline={multiline}
      rows={rows}
      maxRows={maxRows}
      fullWidth={fullWidth}
      error={error}
      helperText={helperText}
      inputRef={ref}
      slotProps={{
        ...slotProps,
        input: {
          startAdornment,
          endAdornment: effectiveEndAdornment,
          ...slotProps?.input,
        },
      }}
      sx={sx}
      {...rest}
    />
  );
});

MuiTextField.displayName = "MuiTextField";

export default MuiTextField;