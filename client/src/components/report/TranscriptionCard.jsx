/**
 * @module components/report/TranscriptionCard
 *
 * The transcription section of the transcription step (round-7
 * amendment, §52.7): the day's story wrapped in a card — a header
 * (an open-book icon in a tinted square, "The day's story" at
 * subtitle2, the real takes · duration meta as the caption
 * subtitle), the circular correction opener at the top right, the
 * borderless §53 editor with its toolbar, and the icon footer:
 * the save-state line (§53.5) on the left, Revert and Save on the
 * right — Revert disabled while the content is unmodified, Save
 * success-colored when saved and error-colored when modified but
 * not yet saved. Before every take is transcribed the card shows
 * the step's empty state — nothing is fabricated where nothing is
 * known (§52.7).
 */
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Box from "@mui/material/Box";
import { alpha } from "@mui/material/styles";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import MuiEditor from "../reusable/MuiEditor";
import MuiEmptyState from "../reusable/MuiEmptyState";
import CorrectionOpener from "./CorrectionOpener";
import EditorFooter from "./EditorFooter";
import { WIZARD } from "../../utils/constants";

const EDITOR_MIN_HEIGHT = { xs: 200, sm: 220, md: 260, lg: 320 };

/**
 * @param {Object} props
 * @param {boolean} props.ready - Every take transcribed (editor shows).
 * @param {string|null} props.meta - "n takes · MM:SS" colophon meta.
 * @param {string} props.seed - The editor seed (draft || latest/joined).
 * @param {string|null} props.lastSavedAt - "HH:mm" of the last write.
 * @param {boolean} props.saving - A save is in flight.
 * @param {boolean} props.reverting - A revert is in flight.
 * @param {boolean} props.justSaved - The brief ✓ Saved just now window.
 * @param {boolean} props.dirty - The document diverged from the seed.
 * @param {string|null} props.fieldError - Story field validation message
 *   (round-8.2, §53.5) — highlighted on the editor.
 * @param {boolean} props.canRevert - latest exists or the document is dirty.
 * @param {Function} props.onDirtyChange - Editor dirty reporting.
 * @param {Function} props.onSave - The boundary-read save.
 * @param {Function} props.onRevert - The single-undo revert.
 * @param {Function} props.onApplyCorrection - CorrectionDialog's apply
 *   contract: (instruction, provider) → Promise<boolean>.
 * @param {string|null} props.reportId - Report the correction targets.
 * @param {import("react").Ref} ref - Forwarded to the story editor — the
 *   §53.3 boundary-read handle the step owns (round-8.3: the step's ref
 *   was never passed down, so every boundary read returned `undefined`).
 */
export default function TranscriptionCard({
  ready,
  meta,
  seed,
  lastSavedAt,
  saving,
  reverting,
  justSaved,
  dirty,
  fieldError,
  canRevert,
  onDirtyChange,
  onSave,
  onRevert,
  onApplyCorrection,
  reportId,
  ref,
}) {
  const headerAction = (
    <CorrectionOpener
      disabled={!ready}
      reportId={reportId}
      onApply={onApplyCorrection}
    />
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
            <AutoStoriesIcon sx={{ color: "primary.main" }} />
          </Box>
        }
        title={WIZARD.transcription.storyDivider}
        subheader={meta ?? WIZARD.transcription.storySubtitle}
        action={headerAction}
        slotProps={{
          action: { sx: { alignSelf: "center" } },
          title: {
            variant: "subtitle2",
            fontWeight: 600,
            component: "h3",
            color: "text.primary",
          },
          subheader: {
            variant: "caption",
            color: "text.secondary",
          },
        }}
        sx={{ pb: 0 }}
      />
      {ready ? (
        <>
          <CardContent sx={{ pt: 1.5 }}>
            <MuiEditor
              ref={ref}
              id="story-editor"
              value={seed}
              onDirtyChange={onDirtyChange}
              minHeight={EDITOR_MIN_HEIGHT}
              borderless
              fieldError={fieldError}
            />
          </CardContent>
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
        </>
      ) : (
        <CardContent sx={{ minHeight: 280 }}>
          <MuiEmptyState
            title={WIZARD.transcription.emptyTitle}
            description={WIZARD.transcription.emptyDescription}
            minHeight="240px"
          />
        </CardContent>
      )}
    </Card>
  );
}
