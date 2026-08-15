/**
 * @module components/reusable/MuiAudioPlayer
 *
 * Clip playback (§46.17 — §53 recording review, §54 clip playback).
 * Consumes the metadata-only DTO of §22.7 — no `filePath` ever
 * reaches the client; the URL comes from the §32 audio endpoint.
 * The play control is a filled audio-orange disc (§43.2 — the
 * deeper tone marks the active playing state).
 */
import { useRef, useState, useCallback } from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import RefreshIcon from "@mui/icons-material/Refresh";
import Tooltip from "@mui/material/Tooltip";
import { orange } from "../../theme/themePrimitives";

/**
 * @param {Object} props
 * @param {Object} props.audio - The metadata-only DTO of §22.7.
 * @param {string} [props.audioUrl] - Playback URL from the §32 audio endpoint.
 * @param {string} [props.duration] - Display duration (e.g. "MM:SS").
 * @param {Function} [props.onPlay] - Fires when playback starts (e.g. the take card's equalizer).
 * @param {Function} [props.onPause] - Fires when playback pauses.
 * @param {Function} [props.onEnded] - Fires when playback completes.
 * @param {string} [props.errorMessage] - Playback error text.
 */
export default function MuiAudioPlayer({
  audio,
  audioUrl,
  duration,
  onPlay,
  onPause,
  onEnded,
  errorMessage,
}) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const togglePlay = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
    } else {
      el.play();
    }
  }, [isPlaying]);

  const onTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    if (onPlay) onPlay();
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (onPause) onPause();
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setHasEnded(true);
    setCurrentTime(0);
    if (onEnded) onEnded();
  };

  const formatTime = (secs) => {
    const s = Math.max(0, Math.floor(secs));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${String(m).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
  };

  // Clamped: a recorder's encoded stream can outlast its reported
  // duration by a hair (encoder padding), so currentTime may reach
  // slightly past 100% — MUI's LinearProgress must never see that.
  const progressValue = audio?.duration
    ? Math.min(100, Math.max(0, (currentTime / audio.duration) * 100))
    : 0;

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {audioUrl ? (
        <audio
          key={audioUrl}
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={onTimeUpdate}
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleEnded}
          preload="metadata"
        />
      ) : null}
      <Tooltip title={isPlaying ? "Pause" : "Play"}>
        <span>
          <IconButton
            aria-label={isPlaying ? "Pause" : "Play"}
            onClick={togglePlay}
            disabled={!audioUrl}
            sx={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              color: "#fff",
              backgroundColor: isPlaying ? orange[700] : orange[400],
              "&:hover": { backgroundColor: isPlaying ? orange[800] : orange[500] },
              "&:focus-visible": {
                outline: `2px solid ${orange[800]}`,
                outlineOffset: 2,
              },
              "&.Mui-disabled": {
                backgroundColor: "action.disabledBackground",
                color: "action.disabled",
              },
            }}
          >
            {hasEnded && !isPlaying ? (
              <RefreshIcon fontSize="small" />
            ) : isPlaying ? (
              <PauseIcon fontSize="small" />
            ) : (
              <PlayArrowIcon fontSize="small" />
            )}
          </IconButton>
        </span>
      </Tooltip>
      {audioUrl ? (
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <LinearProgress
            variant="determinate"
            value={progressValue}
            sx={{ height: 4, borderRadius: 2 }}
          />
          <Typography variant="caption" color="text.secondary">
            {formatTime(currentTime)} / {duration || formatTime(audio?.duration ?? 0)}
          </Typography>
        </Box>
      ) : null}
      {errorMessage ? (
        <Typography variant="caption" color="error.main">
          {errorMessage}
        </Typography>
      ) : null}
    </Box>
  );
}

MuiAudioPlayer.propTypes = {
  audio: PropTypes.shape({
    _id: PropTypes.string,
    duration: PropTypes.number,
  }),
  audioUrl: PropTypes.string,
  duration: PropTypes.string,
  onPlay: PropTypes.func,
  onPause: PropTypes.func,
  onEnded: PropTypes.func,
  errorMessage: PropTypes.string,
};