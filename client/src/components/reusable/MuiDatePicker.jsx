/**
 * @module components/reusable/MuiDatePicker
 *
 * The Ethiopian-calendar date picker (§46.6) with English month names
 * and "Pagume" in the chrome header (§43.6, ADR-011/032), built on
 * @mui/x-date-pickers community. The picker's internal day model is
 * the proleptic Gregorian equivalent; the value contract is the
 * Ethiopian date object via `utils/ethiopianDate.js` — the only
 * conversion surface (§43.6).
 *
 * Button trigger (§46.6, step-1 contract): the field renders as a
 * button through the v9 custom-field seam `slots.field`, using the
 * shared `PickerButtonField` (the official v9 dashboard template
 * pattern — `useSplitFieldProps`/`usePickerContext`/
 * `useParsedFormat`, §46.6). The field hooks (`useField`) never
 * mount; the open-picker icon sits at the start, the clear icon at
 * the end and only while a value exists; the trigger ref forks
 * `triggerRef` + `rootRef` for popper anchoring and outside-click
 * detection.
 *
 * The app runs a single `LocalizationProvider` at the entry
 * (`main.jsx`, §41.4) with `EthiopianDateAdapter` — this component
 * renders no provider of its own (§46.6).
 *
 * `helperText` is intentionally dropped — there is no room on a
 * button (§46.6). The error state tints the button border red:
 * `error` reaches the field via `slotProps.field` (the picker's
 * validation extraction does not forward it).
 *
 * NOTE: this picker is used with react-hook-form `Controller` — its
 * value arrives through a custom `onChange` (the required justification
 * for `Controller`, §46.2). The owning form supplies the default
 * (Ethiopian today); the picker itself shows its placeholder when the
 * value is null.
 */
import { forwardRef } from "react";
import { DesktopDatePicker } from "@mui/x-date-pickers/DesktopDatePicker";
import { MobileDatePicker } from "@mui/x-date-pickers/MobileDatePicker";
import dayjs from "dayjs";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import PickerButtonField from "./PickerButtonField";
import {
  ethiopianToGregorian,
  gregorianToEthiopian,
} from "../../utils/ethiopianDate";
import { ETHIOPIAN_MONTH_LABELS, PICKER_DATE_FORMAT } from "../../utils/constants";

/**
 * Interactive Ethiopic chrome header (§43.6, ADR-011/032): the label
 * shows the Ethiopian month name and year (from
 * `ETHIOPIAN_MONTH_LABELS`, §11.5) and toggles views exactly like
 * v9's `PickersCalendarHeader.handleToggleView` (2 views → the
 * other; 3+ views → alternate between the first two), with the
 * slot's own dayjs ±1-month arrows wired to `onMonthChange` (the
 * default arrows live inside the header component we replace).
 * @param {Object} props - Props handed by the DateCalendar slot.
 * @param {Object} props.currentMonth - Visible month (dayjs).
 * @param {('day'|'month'|'year')} props.view - Active view.
 * @param {Array<('day'|'month'|'year')>} props.views - Allowed views.
 * @param {Function} [props.onViewChange] - View setter.
 * @param {Function} [props.onMonthChange] - Month navigation setter.
 * @param {boolean} [props.disabled] - Picker disabled state.
 */
function CalendarHeader({
  currentMonth,
  view,
  views,
  onViewChange,
  onMonthChange,
  disabled,
}) {
  const ethiopian = gregorianToEthiopian(
    currentMonth.startOf("month").toDate(),
  );
  const canToggle = views.length > 1 && !!onViewChange && !disabled;

  const handleToggleView = () => {
    if (!canToggle) {
      return;
    }
    if (views.length === 2) {
      onViewChange(views.find((el) => el !== view) || views[0]);
    } else {
      const nextIndexToOpen = views.indexOf(view) !== 0 ? 0 : 1;
      onViewChange(views[nextIndexToOpen]);
    }
  };

  const handleMonthChange = (direction) => {
    if (disabled || !onMonthChange) {
      return;
    }
    const delta = direction === "next" ? 1 : -1;
    onMonthChange(currentMonth.add(delta, "month"));
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", px: 1, py: 0.5 }}>
      <IconButton
        size="small"
        onClick={() => handleMonthChange("previous")}
        aria-label="Previous month"
      >
        <ChevronLeftIcon />
      </IconButton>
      <Typography
        variant="subtitle2"
        color="text.secondary"
        onClick={handleToggleView}
        sx={{
          flexGrow: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0.25,
          cursor: canToggle ? "pointer" : "default",
          userSelect: "none",
        }}
      >
        {ETHIOPIAN_MONTH_LABELS[ethiopian.month - 1]} {ethiopian.year}
        {canToggle && <ArrowDropDownIcon fontSize="small" />}
      </Typography>
      <IconButton
        size="small"
        onClick={() => handleMonthChange("next")}
        aria-label="Next month"
      >
        <ChevronRightIcon />
      </IconButton>
    </Box>
  );
}

/** Date variant of the shared button field (§46.6). */
function DateButtonField(props) {
  return <PickerButtonField {...props} valueType="date" />;
}

/**
 * @param {Object} props
 * @param {({ day, month, year }|null)} [props.value] - Ethiopian date value.
 * @param {Function} props.onChange - Emits the Ethiopian date (custom onChange; Controller §46.2).
 * @param {string} [props.placeholder] - Trigger text when empty (default: the parsed format).
 * @param {('small'|'medium')} [props.size] - Accepted for consumer parity; the button is always small (§46.6).
 * @param {Array<('day'|'month'|'year')>} [props.views] - Rendered views per the owning form (§52.3/§50.3).
 * @param {boolean} [props.disabled] - Disables the trigger.
 * @param {boolean} [props.error] - Validation error state (red tint).
 * @param {Object} [props.slotProps] - User slot props merged under the picker's own (picker wins).
 * @param {Object} [props.slots] - User slots merged under the picker's own (picker wins).
 */
const MuiDatePicker = forwardRef(function MuiDatePicker(props, ref) {
  const {
    value,
    onChange,
    views = ["day"],
    disabled = false,
    error = false,
    placeholder,
    slotProps,
    slots,
    ...rest
  } = props;

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  const internalValue = value ? dayjs(ethiopianToGregorian(value)) : null;

  const handleChange = (newValue) => {
    if (!newValue) {
      onChange(null);
      return;
    }
    const ethiopian = gregorianToEthiopian(newValue.toDate());
    onChange(ethiopian);
  };

  const commonProps = {
    views,
    value: internalValue,
    onChange: handleChange,
    disabled,
    format: PICKER_DATE_FORMAT,
    slotProps: {
      ...slotProps,
      field: {
        placeholder,
        error,
        ...(slotProps?.field ?? {}),
      },
      calendarHeader: {
        ...(slotProps?.calendarHeader ?? {}),
      },
      desktopTrapFocus: {
        ...(slotProps?.desktopTrapFocus ?? {}),
        disableEnforceFocus: true,
      },
      dialog: {
        ...(slotProps?.dialog ?? {}),
        disableEnforceFocus: true,
      },
    },
    slots: {
      calendarHeader: CalendarHeader,
      field: DateButtonField,
      ...slots,
    },
    ...rest,
  };

  const Picker = isDesktop ? DesktopDatePicker : MobileDatePicker;

  return <Picker {...commonProps} ref={ref} />;
});

export default MuiDatePicker;

MuiDatePicker.displayName = "MuiDatePicker";
