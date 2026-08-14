/**
 * @module components/reusable/MuiTimePicker
 *
 * The 24h `HH:mm` time picker surface (§46.6) — the same button
 * trigger pattern as `MuiDatePicker`: the field renders as a button
 * through the v9 custom-field seam `slots.field` with the shared
 * `PickerButtonField` (`useSplitFieldProps`/`usePickerContext`/
 * `useParsedFormat`). The stored dayjs value stays absolute 24h —
 * domain rendering keeps the 24h `HH:mm` convention (§43.6).
 *
 * The clock runs the **24h hour view** (`ampm={false}` — the v9
 * default is the 12h `h:mm A` clock, where tapping "12" with the
 * AM meridiem yields 00:00): tapping "12" yields `12:00`, never
 * `00:00` (§46.6, amended 2026-08-14).
 *
 * The app runs a single `LocalizationProvider` at the entry
 * (`main.jsx`, §41.4) with `EthiopianDateAdapter` — this component
 * renders no provider of its own (§46.6).
 *
 * `helperText` is intentionally dropped — there is no room on a
 * button (§46.6). The error state tints the button border red:
 * `error` reaches the field via `slotProps.field`.
 *
 * NOTE: this picker is used with react-hook-form `Controller` — its
 * value arrives through a custom `onChange` (the required
 * justification for `Controller`, §46.2).
 */
import { forwardRef } from "react";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs from "dayjs";
import PickerButtonField from "./PickerButtonField";
import { PICKER_TIME_FORMAT } from "../../utils/constants";

/** Time variant of the shared button field (§46.6). */
function TimeButtonField(props) {
  return <PickerButtonField {...props} valueType="time" />;
}

/**
 * @param {Object} props
 * @param {Object|null} [props.value] - dayjs time value.
 * @param {Function} props.onChange - Emits the time (custom onChange; Controller §46.2).
 * @param {string} [props.placeholder] - Trigger text when empty (default: the parsed format).
 * @param {('small'|'medium')} [props.size] - Accepted for consumer parity; the button is always small (§46.6).
 * @param {boolean} [props.disabled] - Disables the trigger.
 * @param {boolean} [props.error] - Validation error state (red tint).
 * @param {Object} [props.slotProps] - User slot props merged under the picker's own (picker wins).
 * @param {Object} [props.slots] - User slots merged under the picker's own (picker wins).
 */
const MuiTimePicker = forwardRef(function MuiTimePicker(props, ref) {
  const {
    value,
    onChange,
    disabled = false,
    error = false,
    placeholder,
    slotProps,
    slots,
    ...rest
  } = props;

  return (
    <TimePicker
      ref={ref}
      value={value ? dayjs(value) : null}
      onChange={onChange}
      disabled={disabled}
      ampm={false}
      format={PICKER_TIME_FORMAT}
      slotProps={{
        ...slotProps,
        field: {
          placeholder,
          error,
          ...(slotProps?.field ?? {}),
        },
        desktopTrapFocus: {
          ...(slotProps?.desktopTrapFocus ?? {}),
          disableEnforceFocus: true,
        },
        dialog: {
          ...(slotProps?.dialog ?? {}),
          disableEnforceFocus: true,
        },
      }}
      slots={{
        field: TimeButtonField,
        ...slots,
      }}
      {...rest}
    />
  );
});

export default MuiTimePicker;

MuiTimePicker.displayName = "MuiTimePicker";