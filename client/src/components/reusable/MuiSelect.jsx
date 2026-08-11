/**
 * @module components/reusable/MuiSelect
 *
 * All dropdown selection (§46.5) — the bordered, arrowed field style
 * of §44.5. The dropdown paper is capped at 300px.
 */
import { forwardRef } from "react";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import FormHelperText from "@mui/material/FormHelperText";
import MenuItem from "@mui/material/MenuItem";

/**
 * @param {Object} props
 * @param {Array<{value: string|number, label: string}>} props.options - Selectable options.
 * @param {string|number|null} [props.value] - Controlled value.
 * @param {Function} [props.onChange] - Change handler.
 * @param {string} [props.label] - Field label (also the floating label).
 * @param {('small'|'medium')} [props.size] - Density (default small).
 * @param {boolean} [props.fullWidth] - Full-width inside form columns.
 * @param {boolean} [props.disabled] - Disables the field.
 * @param {boolean} [props.error] - Validation error state.
 * @param {string} [props.helperText] - Manual-resolver message (§46.5).
 * @param {string} [props.placeholder] - Placeholder hint shown when empty.
 * @param {ReactNode} [props.startAdornment] - Leading adornment (icon).
 * @param {ReactNode} [props.endAdornment] - Trailing adornment.
 */
const MuiSelect = forwardRef(function MuiSelect(props, ref) {
  const {
    options,
    value,
    onChange,
    label,
    size = "small",
    fullWidth = true,
    disabled = false,
    error = false,
    helperText,
    placeholder,
    startAdornment,
    endAdornment,
    ...rest
  } = props;

  return (
    <FormControl size={size} fullWidth={fullWidth} disabled={disabled} error={error}>
      {label ? <InputLabel>{label}</InputLabel> : null}
      <Select
        ref={ref}
        value={value ?? ""}
        onChange={onChange}
        label={label}
        size={size}
        displayEmpty={Boolean(placeholder)}
        startAdornment={startAdornment}
        endAdornment={endAdornment}
        MenuProps={{
          slotProps: {
            paper: { sx: { maxHeight: 300 } },
          },
        }}
        {...rest}
      >
        {placeholder ? (
          <MenuItem value="" disabled>
            {placeholder}
          </MenuItem>
        ) : null}
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
      {helperText ? <FormHelperText>{helperText}</FormHelperText> : null}
    </FormControl>
  );
});

MuiSelect.displayName = "MuiSelect";

export default MuiSelect;