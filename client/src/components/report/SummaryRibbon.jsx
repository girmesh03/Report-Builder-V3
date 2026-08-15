/**
 * @module components/report/SummaryRibbon
 *
 * The day-skeleton strip of the report-creation flow (§52): the
 * compact summary ribbon directly under the stepper that anchors
 * every step to the day — four evenly spaced two-line blocks (icon +
 * label row / value row) for the report date, the main branch, the
 * day's times and the supervisor name. Values come live from the
 * step-1 form and the auth profile; empty values render an em dash
 * so the strip never misleads.
 *
 * The ribbon is an informational surface: a subtle tinted, bordered
 * container (never a card) that visually separates context from the
 * editable form below. Items lay out on a responsive grid — two
 * columns on phones, four columns from sm up — and the strip hugs
 * the content column (layoutConfig.contentMaxWidth) from md up.
 * Chrome typography only (the Amharic content stack is for report
 * text, never interface text).
 */
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import { layoutConfig } from "../../theme/themePrimitives";
import { PICKER_TIME_FORMAT, WIZARD } from "../../utils/constants";
import { ethiopianToGregorian, formatEthiopianDate } from "../../utils/ethiopianDate";

const DASH = "—";

/**
 * One two-line ribbon block: icon + label on the first row, the
 * value on the second.
 * @param {Object} props
 * @param {ReactNode} props.icon - Leading icon (primary role).
 * @param {string} props.label - Field label (chrome caption).
 * @param {string} props.value - Display value.
 */
function RibbonBlock({ icon, label, value }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25, minWidth: 0 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "primary.main" }}>
        {icon}
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
      </Box>
      <Typography variant="subtitle2" noWrap>
        {value}
      </Typography>
    </Box>
  );
}

/**
 * @param {Object} props
 * @param {({day: number, month: number, year: number}|null)} [props.date] - Ethiopian date from the step-1 form.
 * @param {Object|null} [props.clockIn] - Day start (dayjs).
 * @param {Object|null} [props.clockOut] - Day end (dayjs).
 * @param {string|null} [props.branchName] - Main branch name.
 * @param {string|null} [props.userName] - Supervisor full name (profile).
 */
export default function SummaryRibbon({ date, clockIn, clockOut, branchName, userName }) {
  const dateLabel = date ? formatEthiopianDate(ethiopianToGregorian(date)) : DASH;
  const timesLabel =
    clockIn && clockOut
      ? `${clockIn.format(PICKER_TIME_FORMAT)} – ${clockOut.format(PICKER_TIME_FORMAT)}`
      : DASH;

  return (
    <Box
      sx={{
        bgcolor: "action.selected",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        p: 1.5,
        display: "grid",
        gap: 2,
        gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" },
        maxWidth: layoutConfig.contentMaxWidth,
        width: "100%",
        mx: "auto",
      }}
    >
      <RibbonBlock
        icon={<EventOutlinedIcon fontSize="small" />}
        label={WIZARD.ribbon.date}
        value={dateLabel}
      />
      <RibbonBlock
        icon={<StorefrontOutlinedIcon fontSize="small" />}
        label={WIZARD.ribbon.branch}
        value={branchName ?? DASH}
      />
      <RibbonBlock
        icon={<ScheduleOutlinedIcon fontSize="small" />}
        label={WIZARD.ribbon.times}
        value={timesLabel}
      />
      <RibbonBlock
        icon={<PersonOutlineOutlinedIcon fontSize="small" />}
        label={WIZARD.ribbon.supervisor}
        value={userName ?? DASH}
      />
    </Box>
  );
}