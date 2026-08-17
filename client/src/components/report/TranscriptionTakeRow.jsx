/**
 * @module components/report/TranscriptionTakeRow
 *
 * One ledger row of the transcription step (round-4 amendment;
 * Listening-Desk pass): the day-book line — a 28px
 * solid-orange number disc (the RecordOrb armed-disc treatment,
 * tabular figure), a live waveform glyph that breathes while the
 * take plays, the take's compact audio player, and the status slot.
 * While transcribing, the disc's listening pulse walks (the
 * tightened `pulseRing`) and the status reads "Listening…";
 * a failed take swaps the disc to the error tone with a `!` and
 * offers Retry; a transcribed take offers Re-transcribe.
 *
 * The Listening-Desk pass adds the spotlight: the row reports its
 * playback to the step (`onPlayingChange`); while this row plays it
 * warms with a paper orange tint and the step dims the other rows
 * (`dimmed`) — the desk attends to one take at a time. The row is
 * presentational — the step wires the mutations.
 *
 * The reveal is announced: "Take {n}: transcribed" (aria-live).
 */
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import ReplayIcon from "@mui/icons-material/Replay";
import { keyframes } from "@emotion/react";
import { alpha } from "@mui/material/styles";
import MuiAudioPlayer from "../reusable/MuiAudioPlayer";
import { API_BASE_URL } from "../../redux/features/apiSlice";
import { usePlayAudioQuery } from "../../redux/features/audioEndpoints";
import { orange } from "../../theme/themePrimitives";
import { WIZARD } from "../../utils/constants";

const pulseRing = keyframes`
  0% { box-shadow: 0 0 0 0 ${orange[200]}; }
  70% { box-shadow: 0 0 0 12px transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }
`;

const equalizer = keyframes`
  0%, 100% { transform: scaleY(0.35); }
  50% { transform: scaleY(1); }
`;

const BAR_HEIGHTS = [5, 9, 13, 9, 5];

const formatTime = (secs) => {
  const s = Math.max(0, Math.floor(secs));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(m).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
};

const STATUS_COPY = {
  pending: "Not transcribed yet",
  transcribing: "Listening…",
  transcribed: "Transcribed",
  failed: "Couldn't transcribe this take",
};

/**
 * @param {Object} props
 * @param {number} props.number - 1-based take number.
 * @param {Object} props.clip - The metadata-only DTO (§22.7).
 * @param {('pending'|'transcribing'|'transcribed'|'failed')} props.status
 * @param {boolean} [props.playing] - This row's audio is playing (spotlight).
 * @param {boolean} [props.dimmed] - Another row plays — this one rests dimmed.
 * @param {Function} props.onPlayingChange - Reports playback to the step.
 * @param {Function} props.onRetry - Re-transcribes a failed take.
 * @param {Function} props.onReTranscribe - Re-transcribes a transcribed take.
 */
export default function TranscriptionTakeRow({
  number,
  clip,
  status,
  playing = false,
  dimmed = false,
  onPlayingChange,
  onRetry,
  onReTranscribe,
}) {
  const { data: playData } = usePlayAudioQuery(clip?._id ?? null, {
    skip: !clip,
  });
  const audioUrl = clip
    ? import.meta.env.DEV
      ? (playData?.url ?? undefined)
      : `${API_BASE_URL}/audios/${clip._id}/play`
    : undefined;

  const transcribing = status === "transcribing";
  const failed = status === "failed";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        py: 1,
        borderRadius: 1,
        borderBottom: "1px solid",
        borderColor: "divider",
        "&:last-of-type": { borderBottom: "none" },
        backgroundColor: playing ? alpha(orange[400], 0.08) : "transparent",
        transition: "background-color 200ms ease, opacity 200ms ease",
        opacity: dimmed ? 0.55 : 1,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      }}
      aria-live={status === "transcribed" ? "polite" : "off"}
    >
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontVariantNumeric: "tabular-nums",
          fontWeight: 700,
          fontSize: 13,
          color: "#fff",
          backgroundColor: failed
            ? "error.main"
            : transcribing
              ? orange[200]
              : orange[400],
          animation: transcribing
            ? `${pulseRing} 1.4s ease-out infinite`
            : "none",
          "@media (prefers-reduced-motion: reduce)": { animation: "none" },
        }}
      >
        {failed ? "!" : transcribing ? "…" : number}
      </Box>
      <Box
        aria-hidden="true"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          height: 14,
          flexShrink: 0,
        }}
      >
        {BAR_HEIGHTS.map((height, index) => (
          <Box
            key={index}
            sx={{
              width: 3,
              height,
              borderRadius: 1,
              backgroundColor: playing ? orange[600] : orange[300],
              transformOrigin: "center",
              animation: playing
                ? `${equalizer} 700ms ease-in-out ${index * 90}ms infinite`
                : "none",
              "@media (prefers-reduced-motion: reduce)": { animation: "none" },
            }}
          />
        ))}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <MuiAudioPlayer
          audio={{ _id: clip?._id, duration: clip?.durationSec }}
          audioUrl={audioUrl}
          duration={formatTime(clip?.durationSec ?? 0)}
          compact
          onPlay={() => onPlayingChange(number)}
          onPause={() => onPlayingChange(null)}
          onEnded={() => onPlayingChange(null)}
        />
      </Box>
      <Typography
        variant="caption"
        color={
          failed
            ? "error.main"
            : transcribing
              ? "text.secondary"
              : "text.secondary"
        }
        sx={{ whiteSpace: "nowrap" }}
      >
        {STATUS_COPY[status]}
      </Typography>
      {failed ? (
        <Tooltip title={WIZARD.transcription.retry}>
          <IconButton
            aria-label={WIZARD.transcription.retry}
            onClick={onRetry}
            size="small"
          >
            <ReplayIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : null}
      {status === "transcribed" ? (
        <Tooltip title={WIZARD.transcription.reTranscribe}>
          <IconButton
            aria-label={WIZARD.transcription.reTranscribe}
            onClick={onReTranscribe}
            size="small"
          >
            <ReplayIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : null}
    </Box>
  );
}

TranscriptionTakeRow.propTypes = {
  number: PropTypes.number.isRequired,
  clip: PropTypes.shape({
    _id: PropTypes.string,
    durationSec: PropTypes.number,
  }),
  status: PropTypes.oneOf(["pending", "transcribing", "transcribed", "failed"])
    .isRequired,
  playing: PropTypes.bool,
  dimmed: PropTypes.bool,
  onPlayingChange: PropTypes.func.isRequired,
  onRetry: PropTypes.func.isRequired,
  onReTranscribe: PropTypes.func.isRequired,
};
