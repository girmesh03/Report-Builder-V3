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
 * NOTE: this picker is used with react-hook-form `Controller` — its
 * value arrives through a custom `onChange` (the required justification
 * for `Controller`, §46.2).
 */
import { forwardRef } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DesktopDatePicker } from "@mui/x-date-pickers/DesktopDatePicker";
import { MobileDatePicker } from "@mui/x-date-pickers/MobileDatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs from "dayjs";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import {
  ethiopianToGregorian,
  gregorianToEthiopian,
} from "../../utils/ethiopianDate";
import { EthiopianDateAdapter } from "../../utils/ethiopianDateAdapter";

/**
 * English chrome label of an Ethiopian month (§43.6, ADR-011): the
 * Ethiopian 13 months map to English month names; Pagume renders as
 * "Pagume" and never as a Gregorian equivalent.
 * @type {readonly string[]}
 */
const MONTH_LABELS = Object.freeze([
  "September",
  "October",
  "November",
  "December",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "Pagume",
]);

/**
 * Interactive Ethiopic chrome header (§43.6, ADR-011/032): the label
 * shows the Ethiopian month name and year and toggles views exactly
 * like v9's `PickersCalendarHeader.handleToggleView` (2 views →
 * the other; 3+ views → alternate between the first two), with the
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
function CalendarHeader({ currentMonth, view, views, onViewChange, onMonthChange, disabled }) {
  const ethiopian = gregorianToEthiopian(currentMonth.startOf("month").toDate());
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
        {MONTH_LABELS[ethiopian.month - 1]} {ethiopian.year}
        {canToggle && <ArrowDropDownIcon fontSize="small" />}
      </Typography>
      <IconButton size="small" onClick={() => handleMonthChange("next")} aria-label="Next month">
        <ChevronRightIcon />
      </IconButton>
    </Box>
  );
}

/**
 * @param {Object} props
 * @param {({ day, month, year }|null)} [props.value] - Ethiopian date value.
 * @param {Function} props.onChange - Emits the Ethiopian date (custom onChange; Controller §46.2).
 * @param {string} [props.label] - Field label.
 * @param {('small'|'medium')} [props.size] - Density (default small).
 * @param {Array<('day'|'month'|'year')>} [props.views] - Rendered views per the owning form (§52.3/§50.3).
 * @param {boolean} [props.disabled] - Disables the field.
 * @param {boolean} [props.error] - Validation error state.
 * @param {string} [props.helperText] - Manual-resolver message (§46.6).
 * @param {ReactNode} [props.startAdornment] - Leading adornment (icon).
 * @param {ReactNode} [props.endAdornment] - Trailing adornment.
 * @param {Object} [props.slotProps] - User slot props merged under the picker's own (picker wins).
 */
const MuiDatePicker = forwardRef(function MuiDatePicker(props, ref) {
  const {
    value,
    onChange,
    label,
    size = "small",
    views = ["day"],
    disabled = false,
    error = false,
    helperText,
    startAdornment,
    endAdornment,
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
    label,
    views,
    value: internalValue,
    onChange: handleChange,
    disabled,
    slotProps: {
      ...slotProps,
      textField: {
        ...(slotProps?.textField ?? {}),
        error,
        helperText,
        size,
        slotProps: {
          ...(slotProps?.textField?.slotProps ?? {}),
          input: {
            startAdornment,
            endAdornment,
            ...(slotProps?.textField?.slotProps?.input ?? {}),
          },
        },
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
      ...slots,
    },
    format: "DD-MM-YY",
    ...rest,
  };

  const Picker = isDesktop ? DesktopDatePicker : MobileDatePicker;

  return (
    <LocalizationProvider dateAdapter={EthiopianDateAdapter}>
      <Picker {...commonProps} ref={ref} />
    </LocalizationProvider>
  );
});

/**
 * The matching time picker surface (§46.6): 12h AM/PM `h:mm A` input
 * format (selecting 12:00 keeps 12:00, with a meridiem on the dial);
 * the stored dayjs value stays absolute 24h — domain rendering keeps
 * the 24h `HH:mm` convention (§43.6).
 * @param {Object} props
 * @param {Object|null} [props.value] - dayjs time value.
 * @param {Function} props.onChange - Emits the time (custom onChange; Controller §46.2).
 * @param {string} [props.label] - Field label.
 * @param {('small'|'medium')} [props.size] - Density (default small).
 * @param {boolean} [props.disabled] - Disables the field.
 * @param {boolean} [props.error] - Validation error state.
 * @param {string} [props.helperText] - Manual-resolver message.
 * @param {ReactNode} [props.startAdornment] - Leading adornment (icon).
 * @param {ReactNode} [props.endAdornment] - Trailing adornment.
 * @param {Object} [props.slotProps] - User slot props merged under the picker's own (picker wins).
 */
export const MuiTimePicker = forwardRef(function MuiTimePicker(props, ref) {
  const {
    value,
    onChange,
    label,
    size = "small",
    disabled = false,
    error = false,
    helperText,
    startAdornment,
    endAdornment,
    slotProps,
    ...rest
  } = props;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <TimePicker
        ref={ref}
        label={label}
        value={value ? dayjs(value) : null}
        onChange={onChange}
        disabled={disabled}
        format="h:mm A"
        slotProps={{
          ...slotProps,
          textField: {
            ...(slotProps?.textField ?? {}),
            error,
            helperText,
            size,
            slotProps: {
              ...(slotProps?.textField?.slotProps ?? {}),
              input: {
                startAdornment,
                endAdornment,
                ...(slotProps?.textField?.slotProps?.input ?? {}),
              },
            },
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
        {...rest}
      />
    </LocalizationProvider>
  );
});

export default MuiDatePicker;

MuiDatePicker.displayName = "MuiDatePicker";
MuiTimePicker.displayName = "MuiTimePicker";