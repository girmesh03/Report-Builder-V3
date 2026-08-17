/**
 * @module components/report/AudioCard
 *
 * The audio section of the transcription step (round-7 amendment,
 * §52.7): the day's takes wrapped in a card — a header (waveform
 * icon in a tinted square, the "The day's takes" title at subtitle2,
 * a caption subtitle, the "x of y" transcribed count at the top
 * right), a pinned transcription progress rail, the take rows in a
 * height-capped scroll region, and the Transcribe act (one action
 * covering only the unheard takes — §52.6) at the card's foot. The
 * card is pure presentation: every row state is derived by the host
 * and passed down (statuses pending/transcribing/transcribed/failed
 * feed TranscriptionTakeRow).
 */
import PropTypes from "prop-types";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import { keyframes } from "@emotion/react";
import MuiButton from "../reusable/MuiButton";
import TranscriptionTakeRow from "./TranscriptionTakeRow";
import { WIZARD } from "../../utils/constants";
import { orange } from "../../theme/themePrimitives";

const listeningPulse = keyframes`
  0% { box-shadow: 0 0 0 0 ${orange[200]}; }
  70% { box-shadow: 0 0 0 10px transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }
`;

/**
 * @param {Object} props
 * @param {Array<Object>} props.clips - The day's take rows (§31 list).
 * @param {Map<string, Object>} props.transcriptionsByAudio - take id → row.
 * @param {number} props.transcribedCount - How many takes are heard.
 * @param {boolean} props.ready - Every take transcribed (the act hides).
 * @param {boolean} props.transcribing - A transcription walk is in flight.
 * @param {string[]} props.failedIds - Take ids that failed the walk.
 * @param {number|null} props.playingNumber - Row number currently playing.
 * @param {Function} props.onPlayingChange - Playing-row setter.
 * @param {Function} props.onTranscribe - The one Transcribe act.
 * @param {Function} props.onReTranscribe - Per-take re-transcribe.
 * @param {Function} props.onRetry - The failed-take retry.
 */
export default function AudioCard({
  clips,
  transcriptionsByAudio,
  transcribedCount,
  ready,
  transcribing,
  failedIds,
  playingNumber,
  onPlayingChange,
  onTranscribe,
  onReTranscribe,
  onRetry,
}) {
  const headerAction =
    clips.length > 0 ? (
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}
      >
        {transcribedCount} of {clips.length}
      </Typography>
    ) : null;

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
              bgcolor: (theme) =>
                theme.palette.mode === "dark"
                  ? "hsla(25, 90%, 50%, 0.16)"
                  : "hsla(25, 90%, 50%, 0.12)",
            }}
          >
            <GraphicEqIcon sx={{ color: "warning.main" }} />
          </Box>
        }
        title={WIZARD.transcription.ledgerTitle}
        subheader={WIZARD.transcription.ledgerSubtitle}
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
      <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {clips.length > 0 ? (
          <LinearProgress
            variant="determinate"
            color="warning"
            value={clips.length ? (transcribedCount / clips.length) * 100 : 0}
            aria-label="Transcription progress"
            sx={{ height: 3, borderRadius: 2, flexShrink: 0 }}
          />
        ) : null}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            maxHeight: { xs: 240, sm: 280, md: 320 },
            overflowY: "auto",
          }}
        >
          {clips.map((clip, index) => {
            const number = index + 1;
            const hasTranscription = Boolean(transcriptionsByAudio.get(clip._id));
            const failed = failedIds.includes(clip._id);
            const status = failed
              ? "failed"
              : hasTranscription
                ? "transcribed"
                : transcribing
                  ? "transcribing"
                  : "pending";
            return (
              <TranscriptionTakeRow
                key={clip._id}
                number={number}
                clip={clip}
                status={status}
                playing={playingNumber === number}
                dimmed={playingNumber !== null && playingNumber !== number}
                onPlayingChange={onPlayingChange}
                onRetry={onRetry}
                onReTranscribe={() =>
                  onReTranscribe(transcriptionsByAudio.get(clip._id)?._id)
                }
              />
            );
          })}
        </Box>
      </CardContent>
      {!ready ? (
        <CardActions sx={{ justifyContent: "flex-end", minHeight: 32 }}>
          {transcribing ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: orange[400],
                  animation: `${listeningPulse} 1.4s ease-out infinite`,
                  "@media (prefers-reduced-motion: reduce)": {
                    animation: "none",
                  },
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {WIZARD.transcription.transcribing}
              </Typography>
            </Box>
          ) : (
            <MuiButton
              variant="contained"
              color="warning"
              onClick={onTranscribe}
              disabled={clips.length === 0}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              {WIZARD.transcription.transcribe}
            </MuiButton>
          )}
        </CardActions>
      ) : null}
    </Card>
  );
}

AudioCard.propTypes = {
  clips: PropTypes.arrayOf(PropTypes.object).isRequired,
  transcriptionsByAudio: PropTypes.instanceOf(Map).isRequired,
  transcribedCount: PropTypes.number.isRequired,
  ready: PropTypes.bool.isRequired,
  transcribing: PropTypes.bool.isRequired,
  failedIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  playingNumber: PropTypes.number,
  onPlayingChange: PropTypes.func.isRequired,
  onTranscribe: PropTypes.func.isRequired,
  onReTranscribe: PropTypes.func.isRequired,
  onRetry: PropTypes.func.isRequired,
};