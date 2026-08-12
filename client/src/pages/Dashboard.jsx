/**
 * @module pages/Dashboard
 *
 * The §49 Dashboard — the supervisor's status board, extended from
 * the P3 "regulatory paper + dictation desk" identity: the four KPI
 * stubs and the chart panels sit on the plain paper-card surface
 * (§44.6) with small-caps eyebrows, the charts carry the themed
 * dashed grid (§44.9), and the status donut is the signature — a
 * paper ledger ring whose center hole prints the total report count
 * (§38.6 zero-shape: five slices, zero counts kept — a slice is
 * never dropped).
 *
 * All numbers are §38 server aggregates via §42 (ADR-034 — the page
 * never aggregates report lists); the five recent reports come from
 * `GET /reports?limit=5&isArchived=false` (server-sorted, §49.2 —
 * the latest band is always active-only). Four §60 states: loading
 * (KPI + chart + list skeletons), error (§60 toast on the §38 fetch
 * + a compact inline retry on the chart band, §49.6), empty
 * (per-chart degradation when a series is empty, §38.6 — no
 * account-level empty band; the latest-list band renders its own
 * §60 empty), success (full render). KPI trend captions render
 * only when the §38 payload provides them — never invented numbers
 * (§49.3). Chart labels are English chrome (§7.6).
 */
import { useEffect } from "react";
import { useNavigate } from "react-router";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import HourglassTopOutlinedIcon from "@mui/icons-material/HourglassTopOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import AddIcon from "@mui/icons-material/Add";
import { useTheme } from "@mui/material/styles";
import { PieChart } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts/BarChart";
import { LineChart } from "@mui/x-charts/LineChart";
import dayjs from "dayjs";
import MuiPageHeader from "../components/reusable/MuiPageHeader";
import MuiStatCard from "../components/reusable/MuiStatCard";
import MuiStatusBadge from "../components/reusable/MuiStatusBadge";
import MuiButton from "../components/reusable/MuiButton";
import MuiEmptyState from "../components/reusable/MuiEmptyState";
import ListSkeleton from "../components/reusable/ListSkeleton";
import { useGetAnalyticsDashboardQuery } from "../redux/features/analyticsEndpoints";
import { useListReportsQuery } from "../redux/features/reportsEndpoints";
import { showToast } from "../utils/toast.jsx";
import { formatEthiopianDate } from "../utils/ethiopianDate";
import { REPORT_STATUS_LABELS } from "../utils/constants";

const CHART_MIN_HEIGHT = 280;

/**
 * The status → role-color binding of §43.2 (audio = orange, primary
 * = brand blue, success = green; draft = neutral gray), mode-aware
 * through the theme roles — never raw palette literals (§43.8).
 * @param {Object} theme - The active MUI theme.
 * @returns {Object<string, string>}
 */
const statusColors = (theme) => ({
  draft: theme.palette.mode === "dark" ? theme.palette.grey[600] : theme.palette.grey[400],
  audio_attached: theme.palette.warning.main,
  transcribed: theme.palette.info.main,
  reviewed: theme.palette.primary.main,
  completed: theme.palette.success.main,
});

const trendCaption = (delta) => {
  if (delta === undefined || delta === null) {
    return null;
  }
  if (delta > 0) {
    return `+${delta} vs last month`;
  }
  if (delta < 0) {
    return `${delta} vs last month`;
  }
  return "Same as last month";
};

/**
 * The chart-panel shell: the paper card + small-caps eyebrow.
 * @param {Object} props
 * @param {string} props.title - Panel caption (English chrome).
 * @param {ReactNode} props.children - The panel body.
 */
const ChartPanel = ({ title, children }) => (
  <Card sx={{ p: 2.5, height: "100%" }}>
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{
        textTransform: "uppercase",
        letterSpacing: 1,
        display: "block",
        mb: 1,
      }}
    >
      {title}
    </Typography>
    {children}
  </Card>
);

/**
 * The §60 loading placeholder for the KPI band (card-shaped bars).
 * @param {Object} props
 * @param {Object} props.size - Grid size props (§49.6 matrix).
 */
const KpiSkeleton = ({ size }) => (
  <Grid size={size}>
    <Card sx={{ p: 2.5, height: "100%" }}>
      <Skeleton variant="text" width="45%" height={14} />
      <Skeleton variant="text" width="30%" height={40} sx={{ mt: 1 }} />
      <Skeleton variant="text" width="60%" height={12} sx={{ mt: 1.5 }} />
    </Card>
  </Grid>
);

export function Component() {
  const theme = useTheme();
  const navigate = useNavigate();
  const {
    data: dashboard,
    error,
    isError,
    isLoading: dashboardLoading,
    refetch,
  } = useGetAnalyticsDashboardQuery();
  const {
    data: latest,
    isLoading: latestLoading,
  } = useListReportsQuery({ page: 1, limit: 5, isArchived: "false" });

  useEffect(() => {
    if (isError) {
      showToast("error", error.message);
    }
  }, [isError, error]);

  const kpis = dashboard?.kpis;
  const charts = dashboard?.charts;
  const totalReports =
    charts?.statusDistribution?.reduce(
      (sum, row) => sum + (Number.isFinite(row.count) ? row.count : 0),
      0,
    ) ?? 0;

  const renderKpis = () => (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MuiStatCard
          label="Reports this month"
          value={kpis?.reportsThisMonth ?? 0}
          icon={<CalendarMonthOutlinedIcon fontSize="small" />}
          iconColor="primary.main"
          trend={trendCaption(kpis?.trends?.reportsThisMonthDelta)}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MuiStatCard
          label="In progress"
          value={kpis?.inProgress ?? 0}
          icon={<HourglassTopOutlinedIcon fontSize="small" />}
          iconColor="text.secondary"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MuiStatCard
          label="Completed"
          value={kpis?.completed ?? 0}
          icon={<CheckCircleOutlinedIcon fontSize="small" />}
          iconColor="success.main"
          trend={trendCaption(kpis?.trends?.completedDelta)}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MuiStatCard
          label="Active branches"
          value={kpis?.activeBranches ?? 0}
          icon={<StorefrontOutlinedIcon fontSize="small" />}
          iconColor="text.secondary"
        />
      </Grid>
    </Grid>
  );

  const renderCharts = () => {
    const colors = statusColors(theme);
    const distribution = (charts?.statusDistribution ?? []).map((row) => ({
      id: row.status,
      value: Number.isFinite(row.count) ? row.count : 0,
      label: REPORT_STATUS_LABELS[row.status] ?? row.status,
      color: colors[row.status] ?? theme.palette.grey[500],
    }));
    const branches = charts?.activityByBranch ?? [];
    const trend = charts?.issuesTrend ?? [];
    const trendMax = trend.reduce(
      (max, row) => (Number.isFinite(row.count) && row.count > max ? row.count : max),
      0,
    );

    return (
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <ChartPanel title="Status distribution">
            {distribution.length ? (
              <Box sx={{ position: "relative", height: CHART_MIN_HEIGHT }}>
                <PieChart
                  series={[
                    {
                      data: distribution,
                      innerRadius: 62,
                      outerRadius: 92,
                      paddingAngle: 2,
                      cornerRadius: 0,
                    },
                  ]}
                  slotProps={{ legend: { direction: "row", position: { vertical: "bottom", horizontal: "middle" }, padding: 8 } }}
                  sx={{ height: CHART_MIN_HEIGHT }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    top: "42%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    textAlign: "center",
                    pointerEvents: "none",
                  }}
                >
                  <Typography variant="h4" component="p" sx={{ lineHeight: 1 }}>
                    {totalReports}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Reports
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: "flex", height: CHART_MIN_HEIGHT, alignItems: "center" }}>
                <MuiEmptyState
                  title="No data yet"
                  description="Status counts appear once reports exist"
                  minHeight="auto"
                />
              </Box>
            )}
          </ChartPanel>
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <ChartPanel title="Activity by branch">
            {branches.length ? (
              <BarChart
                layout="horizontal"
                height={CHART_MIN_HEIGHT}
                margin={{ left: 24, right: 24 }}
                xAxis={[{ label: "Reports" }]}
                yAxis={[
                  {
                    scaleType: "band",
                    data: branches.map((row) => row.name),
                    categoryGapRatio: 0.4,
                  },
                ]}
                series={[{ data: branches.map((row) => (Number.isFinite(row.count) ? row.count : 0)), color: theme.palette.primary.main }]}
              />
            ) : (
              <Box sx={{ display: "flex", height: CHART_MIN_HEIGHT, alignItems: "center" }}>
                <MuiEmptyState
                  title="No branch activity yet"
                  description="Report counts per branch appear once branches are visited"
                  minHeight="auto"
                />
              </Box>
            )}
          </ChartPanel>
        </Grid>
        <Grid size={{ xs: 12, md: 12, lg: 4 }}>
          <ChartPanel title="Issues — last 30 days">
            {trend.length ? (
              <LineChart
                height={CHART_MIN_HEIGHT}
                margin={{ left: 24, right: 24 }}
                xAxis={[
                  {
                    scaleType: "point",
                    data: trend.map((row) => row.date),
                    tickLabelInterval: (_value, index) => index % 5 === 0,
                  },
                ]}
                yAxis={[{ min: 0, max: trendMax }]}
                series={[{ data: trend.map((row) => (Number.isFinite(row.count) ? row.count : null)), color: theme.palette.warning.main, valueFormatter: (value) => (value === null ? null : value) }]}
              />
            ) : (
              <Box sx={{ display: "flex", height: CHART_MIN_HEIGHT, alignItems: "center" }}>
                <MuiEmptyState
                  title="No issue data yet"
                  description="The issue trend appears once digests carry issue items"
                  minHeight="auto"
                />
              </Box>
            )}
          </ChartPanel>
        </Grid>
      </Grid>
    );
  };

  const renderLatest = () => {
    const rows = latest?.docs ?? [];
    if (latestLoading) {
      return (
        <Card sx={{ mt: 2, overflow: "hidden" }}>
          <Box sx={{ px: 2.5, pt: 2.5, pb: 1 }}>
            <Skeleton variant="text" width="25%" height={14} />
          </Box>
          <ListSkeleton rows={4} />
        </Card>
      );
    }
    return (
      <Card sx={{ mt: 2, overflow: "hidden" }}>
        <Box sx={{ px: 2.5, pt: 2.5, pb: 1 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ textTransform: "uppercase", letterSpacing: 1, display: "block" }}
          >
            Latest reports
          </Typography>
        </Box>
        {rows.length ? (
          <List disablePadding>
            {rows.map((report, index) => (
              <ListItemButton
                key={report._id}
                divider={index < rows.length - 1}
                onClick={() => navigate(`/reports/${report._id}`)}
                sx={{ px: 2.5, py: 1.25 }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                        {formatEthiopianDate(report.reportDate) ?? "No date"}
                      </Typography>
                      <MuiStatusBadge status={report.status} />
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="caption" color="text.secondary" component="span">
                        {(report.branches ?? []).map((entry) => entry.name).join(" · ") || "No branches yet"}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        component="span"
                        sx={{ float: "right", fontVariantNumeric: "tabular-nums" }}
                      >
                        {dayjs(report.updatedAt).format("DD-MM-YY HH:mm")}
                      </Typography>
                    </>
                  }
                />
              </ListItemButton>
            ))}
          </List>
        ) : (
          <MuiEmptyState
            title="No reports yet — record your first day"
            description="Start a report, attach your clips, and review the transcription"
            minHeight={160}
          />
        )}
      </Card>
    );
  };

  return (
    <Box>
      <MuiPageHeader
        title="Dashboard"
        subtitle="Your supervision reports at a glance"
        actions={
          <MuiButton
            color="success"
            startIcon={<AddIcon />}
            onClick={() => navigate("/reports/new")}
          >
            New report
          </MuiButton>
        }
      />

      {dashboardLoading ? (
        <Grid container spacing={2}>
          <KpiSkeleton size={{ xs: 12, sm: 6, md: 3 }} />
          <KpiSkeleton size={{ xs: 12, sm: 6, md: 3 }} />
          <KpiSkeleton size={{ xs: 12, sm: 6, md: 3 }} />
          <KpiSkeleton size={{ xs: 12, sm: 6, md: 3 }} />
        </Grid>
      ) : isError ? (
        <Box sx={{ mt: 2 }}>
          <MuiEmptyState
            title="Couldn't load the dashboard"
            description="Check your connection and try again"
            action={
              <MuiButton variant="outlined" onClick={() => refetch()}>
                Retry
              </MuiButton>
            }
          />
        </Box>
      ) : (
        <>
          {renderKpis()}
          {renderCharts()}
        </>
      )}

      {renderLatest()}
    </Box>
  );
}

export default Component;
