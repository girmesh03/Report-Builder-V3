/**
 * @module components/report/ReportBodyCard
 *
 * The report body card of the report step (§52.8) — the `reviewed`
 * posture (Add flow) and the `completed` posture (Edit-mode
 * re-entry): the day's report wrapped in a card — a header (an
 * article icon in a tinted square, "The report" at subtitle2, the
 * circular correction opener at the top right, plus the Export menu
 * once the report is `completed`), the stale-`latest` notice
 * (storyChangeNotice, §54.8) and the ± official-token guidance strip
 * (toggleable, presence computed at the seed/candidate/save
 * boundaries by the host), the borderless §53 editor with its
 * toolbar, and the shared §53.5 icon footer (EditorFooter). The
 * report body is the report's `latest` slot; a save persists it via
 * the same report-level content PATCH as the transcription step.
 *
 * Re-purposing is host-side only (ADR-033): MuiEditor keeps its
 * zero-lag contract (id `report-editor`, the host's draft seed, the
 * boundary handle, `?? ""` save semantics) — the card adds no
 * second editor implementation.
 */
import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import MuiEditor from "../reusable/MuiEditor";
import CorrectionOpener from "./CorrectionOpener";
import EditorFooter from "./EditorFooter";
import ExportMenu from "./ExportMenu";
import { WIZARD } from "../../utils/constants";

const EDITOR_MIN_HEIGHT = { xs: 200, sm: 220, md: 260, lg: 320 };

/**
 * @param {Object} props
 * @param {string} props.seed - The editor seed (host draft || latest).
 * @param {string|null} props.lastSavedAt - "HH:mm" of the last write.
 * @param {boolean} props.saving - A save is in flight.
 * @param {boolean} props.reverting - A revert is in flight.
 * @param {boolean} props.justSaved - The brief ✓ Saved just now window.
 * @param {boolean} props.dirty - The document diverged from the seed.
 * @param {string|null} props.fieldError - Report-body field validation
 *   message (round-8.2, §53.5) — highlighted on the editor.
 * @param {boolean} props.canRevert - latest exists or the document is dirty.
 * @param {boolean} props.hasTokens - The seed/candidate/save boundary
 *   contains ± official-text tokens (drives the guidance strip).
 * @param {boolean} props.showNotice - The stale-`latest` notice
 *   (storyChangeNotice) is showing.
 * @param {boolean} props.canExport - The report is `completed`
 *   (Edit-mode re-entry) — the Export menu shows.
 * @param {Function} props.onDirtyChange - Editor dirty reporting.
 * @param {Function} props.onSave - The boundary-read save.
 * @param {Function} props.onRevert - The single-undo revert.
 * @param {Function} props.onApplyCorrection - CorrectionDialog's apply
 *   contract: (instruction, provider) → Promise<boolean>.
 * @param {string|null} props.reportId - Report the correction targets.
 * @param {import("react").Ref} ref - Forwarded to the report editor — the
 *   §53.3 boundary-read handle the step owns.
 */
export default function ReportBodyCard({
  seed,
  lastSavedAt,
  saving,
  reverting,
  justSaved,
  dirty,
  fieldError,
  canRevert,
  hasTokens,
  showNotice,
  canExport,
  onDirtyChange,
  onSave,
  onRevert,
  onApplyCorrection,
  reportId,
  ref,
}) {
  const headerAction = (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {canExport ? <ExportMenu reportId={reportId} /> : null}
      <CorrectionOpener
        disabled={false}
        reportId={reportId}
        onApply={onApplyCorrection}
      />
    </Box>
  );

  return (
    <Card variant="outlined" sx={{ width: "100%" }}>
      <CardHeader
        avatar={
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              borderRadius: 1.5,
              flexShrink: 0,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
            }}
          >
            <ArticleOutlinedIcon sx={{ color: "primary.main" }} />
          </Box>
        }
        title={WIZARD.report.title}
        action={headerAction}
        slotProps={{
          action: { sx: { alignSelf: "center" } },
          title: {
            variant: "subtitle2",
            fontWeight: 600,
            component: "h3",
            color: "text.primary",
          },
        }}
        sx={{ pb: 0 }}
      />
      {showNotice ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mx: 2,
            mt: 1,
            px: 1.5,
            py: 1,
            borderRadius: 1,
            bgcolor: (theme) => alpha(theme.palette.warning.main, 0.12),
          }}
        >
          <InfoOutlinedIcon sx={{ fontSize: 16, color: "warning.main" }} />
          <Typography variant="caption" color="warning.dark">
            {WIZARD.transcription.storyChangeNotice}
          </Typography>
        </Box>
      ) : null}
      <CardContent sx={{ pt: 1.5 }}>
        <MuiEditor
          ref={ref}
          id="report-editor"
          value={seed}
          onDirtyChange={onDirtyChange}
          minHeight={EDITOR_MIN_HEIGHT}
          borderless
          fieldError={fieldError}
        />
      </CardContent>
      {hasTokens ? <TokenGuidanceStrip /> : null}
      <EditorFooter
        lastSavedAt={lastSavedAt}
        saving={saving}
        reverting={reverting}
        justSaved={justSaved}
        dirty={dirty}
        canRevert={canRevert}
        onSave={onSave}
        onRevert={onRevert}
      />
    </Card>
  );
}

/**
 * The ± official-token guidance strip (§54.8): a toggleable caption
 * line under the editor — the ± token maps to official text, so the
 * editor must keep it intact. The toggle collapses the strip to a
 * minimal re-open chip so the guidance never dead-ends.
 */
function TokenGuidanceStrip() {
  const [open, setOpen] = useState(true);

  if (!open) {
    return (
      <Box sx={{ display: "flex", justifyContent: "flex-end", px: 1 }}>
        <Button
          size="small"
          variant="text"
          onClick={() => setOpen(true)}
          sx={{ minWidth: 0, p: 0.5 }}
          aria-label={WIZARD.report.tokenGuideToggle}
        >
          ±
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 2,
        py: 0.75,
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {WIZARD.report.tokenGuide}
      </Typography>
      <Button
        size="small"
        variant="text"
        onClick={() => setOpen(false)}
        sx={{ ml: "auto", minWidth: 0, p: 0.5 }}
        aria-label={WIZARD.report.tokenGuideToggle}
      >
        Hide
      </Button>
    </Box>
  );
}