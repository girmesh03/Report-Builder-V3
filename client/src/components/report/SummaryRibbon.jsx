/**
 * @module components/report/SummaryRibbon
 *
 * The report-creation header panel (§52): the page title and close
 * action on the first row, the day-skeleton summary on the second —
 * four two-line blocks (icon + label row / value row) for the report
 * date, the main branch, the day's times and the supervisor name.
 * Values come live from the step-1 form and the auth profile; empty
 * values render an em dash so the strip never misleads.
 *
 * On xs the panel is a full-bleed band — no border radius, no
 * scrollbar — and the four blocks wrap into a two-column grid. From
 * sm it becomes a subtle tinted, rounded panel centered at the
 * content column width with the blocks in one evenly spread row
 * (horizontal scroll only as an overflow fallback). Row 1 never
 * scrolls or wraps. A divider follows the panel and the stepper sits
 * after it (the owning page owns that spacing). Chrome typography
 * only (the Amharic content stack is for report text, never
 * interface text).
 */
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import CloseIcon from "@mui/icons-material/Close";
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
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 0.25,
        flex: { xs: "1 1 calc(50% - 8px)", sm: "0 0 auto" },
        minWidth: 0,
      }}
    >
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
 * @param {Function} props.onClose - Opens the leave-flow confirmation.
 */
export default function SummaryRibbon({
  date,
  clockIn,
  clockOut,
  branchName,
  userName,
  onClose,
}) {
  const dateLabel = date
    ? formatEthiopianDate(ethiopianToGregorian(date))
    : DASH;
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
        borderRadius: { sm: 2 },
        p: 1.5,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        width: { xs: "auto", sm: "100%" },
        maxWidth: layoutConfig.contentMaxWidth,
        mx: { xs: -1, sm: "auto" },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {WIZARD.pageTitle}
        </Typography>
        <Tooltip title={WIZARD.closeLabel}>
          <IconButton aria-label={WIZARD.closeLabel} onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </Box>
      <Box
        sx={{
          display: "flex",
          flexWrap: { xs: "wrap", sm: "nowrap" },
          gap: { xs: 2, sm: 3 },
          overflowX: { sm: "auto" },
          justifyContent: { sm: "space-between" },
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
    </Box>
  );
}