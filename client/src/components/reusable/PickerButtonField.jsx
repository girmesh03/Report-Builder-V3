/**
 * @module components/reusable/PickerButtonField
 *
 * The shared button trigger used as both pickers' `field` slot
 * (§46.6) — the official v9 dashboard custom-field pattern. The
 * date and time pickers (`MuiDatePicker`, `MuiTimePicker`) each
 * mount this component through `slots.field` with a `valueType`
 * wrapper.
 *
 * Receives the picker's field props (root `data-*`/`aria-*` props
 * plus the merged `slots`/`slotProps`; `ownerState` is stripped by
 * the picker internals and `useField` never mounts) plus
 * `valueType`, and reads `value`, `fieldFormat`, `disabled`,
 * `readOnly`, `triggerStatus`, `triggerRef`/`rootRef` and the
 * actions (`setOpen`, `clearValue`) from `usePickerContext`.
 *
 * Renders as a MUI `Button` with `component="div"` + `role="button"`
 * so the clear `IconButton` stays valid DOM. The open-picker icon
 * sits at the start (`CalendarTodayRounded` for date,
 * `AccessTimeRounded` for time); the clear icon at the end,
 * rendered only while a value exists (`clearValue` emits
 * `onChange(null)` — the `Controller` contract). Empty state shows
 * `placeholder` when the owning form provided one, else the parsed
 * format from `useParsedFormat()` (e.g. `DD-MM-YY`). `error` tints
 * the border red; `disabled`/`readOnly` come from the picker
 * context and disable the button. The end-icon wrapper is pushed
 * flush to the button's right edge (`marginLeft: auto`,
 * `marginRight: 0`) instead of hugging the label.
 *
 * `helperText` is intentionally dropped — there is no room on a
 * button (§46.6).
 */
import {
  useSplitFieldProps,
  usePickerContext,
  useParsedFormat,
} from "@mui/x-date-pickers";
import { useForkRef } from "@mui/material/utils";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

/**
 * The button trigger used as the pickers' `field` slot (§46.6) — the
 * official v9 dashboard custom-field pattern. Receives the picker's
 * field props (root `data-*`/`aria-*` props plus the merged
 * `slots`/`slotProps`; `ownerState` is stripped by the picker
 * internals and `useField` never mounts) plus `valueType`, and reads
 * `value`, `fieldFormat`, `disabled`, `readOnly`, `triggerStatus`,
 * `triggerRef`/`rootRef` and the actions (`setOpen`, `clearValue`)
 * from `usePickerContext`.
 *
 * Renders as a MUI `Button` with `component="div"` + `role="button"`
 * so the clear `IconButton` stays valid DOM. The open-picker icon
 * sits at the start; the clear icon at the end, rendered only while
 * a value exists (`clearValue` emits `onChange(null)` — the
 * `Controller` contract). Empty state shows `placeholder` when the
 * owning form provided one, else the parsed format from
 * `useParsedFormat()` (e.g. `DD-MM-YY`). `error` tints the border
 * red; `disabled`/`readOnly` come from the picker context and
 * disable the button.
 * @param {Object} props - Field slot props from the picker.
 * @param {('date'|'time')} props.valueType - Field value type (split key).
 * @param {string} [props.placeholder] - Empty-state text override.
 * @param {boolean} [props.error] - Validation error state (border tint).
 */
export default function ButtonField({ valueType, ...props }) {
  const { forwardedProps } = useSplitFieldProps(props, valueType);
  const pickerContext = usePickerContext();
  const handleRef = useForkRef(pickerContext.triggerRef, pickerContext.rootRef);
  const parsedFormat = useParsedFormat();
  const isEmpty = pickerContext.value == null;
  /* eslint-disable no-unused-vars -- dropped so they never leak to the Button */
  const {
    placeholder,
    error = false,
    inputRef,
    slots,
    slotProps,
    ...forwardedRest
  } = forwardedProps;
  /* eslint-enable no-unused-vars */
  const emptyText = placeholder ?? parsedFormat;
  const valueStr = isEmpty
    ? emptyText
    : pickerContext.value.format(pickerContext.fieldFormat);
  const canOpen = pickerContext.triggerStatus === "enabled";

  return (
    <Button
      {...forwardedRest}
      component="div"
      role="button"
      ref={handleRef}
      variant="outlined"
      size="small"
      disabled={pickerContext.disabled || pickerContext.readOnly || !canOpen}
      startIcon={
        valueType === "time" ? (
          <AccessTimeRoundedIcon fontSize="small" />
        ) : (
          <CalendarTodayRoundedIcon fontSize="small" />
        )
      }
      endIcon={
        isEmpty ? undefined : (
          <IconButton
            size="small"
            tabIndex={-1}
            aria-label="Clear"
            onClick={(event) => {
              event.stopPropagation();
              pickerContext.clearValue();
            }}
            sx={{ p: "4px" }}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        )
      }
      onClick={() => {
        if (canOpen) {
          pickerContext.setOpen((prev) => !prev);
        }
      }}
      sx={{
        justifyContent: "flex-start",
        textTransform: "none",
        fontWeight: 400,
        minHeight: 40,
        color: isEmpty ? "text.secondary" : "text.primary",
        borderColor: error ? "error.main" : "divider",
        "&:hover": error ? { borderColor: "error.main" } : undefined,
        "& .MuiButton-endIcon": {
          marginLeft: "auto",
          marginRight: 0,
        },
      }}
    >
      {pickerContext.label ?? valueStr}
    </Button>
  );
}

ButtonField.displayName = "ButtonField";
