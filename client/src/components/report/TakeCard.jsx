/**
 * @module components/report/TakeCard
 *
 * One take of the audio step (CR-056/057, §52.6): the earliest
 * takes first, each with the shared audio player (loading / playing
 * / paused / ended / error states, §46.17), a three-bar equalizer
 * that animates while playing, the take's number, and its actions —
 * re-record (the orb readies to replace it, CR-058) and delete
 * (CR-059). While the take is uploading the card shows a busy
 * progress row instead — nothing is clickable until the clip
 * exists. Playback resolution follows the §46.17 contract: the
 * production caller builds the authenticated stream URL from the
 * DTO's `_id`; in development the §66.10 adapter serves the same
 * URL through the play query.
 */
import { useState } from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import ReplayIcon from "@mui/icons-material/Replay";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import { keyframes } from "@emotion/react";
import MuiAudioPlayer from "../reusable/MuiAudioPlayer";
import { API_BASE_URL } from "../../redux/features/apiSlice";
import { usePlayAudioQuery } from "../../redux/features/audioEndpoints";
import { orange } from "../../theme/themePrimitives";
import { WIZARD } from "../../utils/constants";

const barBounce = keyframes`
  0%, 100% { height: 6px; }
  50% { height: 18px; }
`;

const Equalizer = () => (
  <Box sx={{ display: "flex", alignItems: "flex-end", gap: 3, height: 20 }}>
    {[0, 1, 2].map((index) => (
      <Box
        key={index}
        sx={{
          width: 4,
          height: 10,
          borderRadius: 2,
          backgroundColor: orange[500],
          animation: `${barBounce} 0.7s ease-in-out infinite`,
          animationDelay: `${index * 0.12}s`,
          "@media (prefers-reduced-motion: reduce)": { animation: "none" },
        }}
      />
    ))}
  </Box>
);

/**
 * @param {Object} props
 * @param {Object} props.take - The take row: `{ clip, name, size, busy }`; `clip`
 *   is the metadata-only DTO (§22.7) and is null while the upload is in flight.
 * @param {number} props.index - Zero-based position in the takes list (displayed + 1).
 * @param {Function} props.onReRecord - Readies the orb to replace this take.
 * @param {Function} props.onDelete - Opens the delete confirmation.
 */
export default function TakeCard({ take, index, onReRecord, onDelete }) {
  const [playing, setPlaying] = useState(false);
  const { data: playData } = usePlayAudioQuery(take.clip?._id ?? null, {
    skip: !take.clip,
  });

  const audioUrl = take.clip
    ? import.meta.env.DEV
      ? (playData?.url ?? undefined)
      : `${API_BASE_URL}/audios/${take.clip._id}/play`
    : undefined;

  if (take.busy) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          p: 1.5,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <LinearProgress sx={{ borderRadius: 2 }} />
        <Typography variant="caption" color="text.secondary">
          {WIZARD.audio.uploading}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
        p: 1.5,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      {playing ? <Equalizer /> : null}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <MuiAudioPlayer
            audio={{ _id: take.clip._id, duration: take.clip.durationSec }}
            audioUrl={audioUrl}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
          />
        </Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}
        >
          {WIZARD.audio.takeNumber.replace("{number}", index + 1)}
        </Typography>
        <Tooltip title={WIZARD.audio.reRecord}>
          <IconButton
            aria-label={WIZARD.audio.reRecord}
            onClick={onReRecord}
            size="small"
          >
            <ReplayIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={WIZARD.audio.deleteTake}>
          <IconButton
            aria-label={WIZARD.audio.deleteTake}
            onClick={onDelete}
            size="small"
          >
            <DeleteOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

TakeCard.propTypes = {
  take: PropTypes.shape({
    clip: PropTypes.shape({
      _id: PropTypes.string,
      durationSec: PropTypes.number,
    }),
    name: PropTypes.string,
    size: PropTypes.number,
    busy: PropTypes.bool,
  }).isRequired,
  index: PropTypes.number.isRequired,
  onReRecord: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
