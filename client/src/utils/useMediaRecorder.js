/**
 * @module utils/useMediaRecorder
 *
 * The MediaRecorder mechanics of the §46.17 device recording, as a
 * hook (§52.6): getUserMedia → MediaRecorder → blob on stop, with a
 * live `MM:SS`-style elapsed counter, an automatic stop at the §11.3
 * cap, and full cleanup on unmount. `onClipReady` emits the take as
 * `{ blob, durationSec }`; `onCap` fires when the cap stops the
 * session (the caller's info toast), `onPermissionError` when
 * getUserMedia rejects (the caller's warning toast + the attach
 * fallback, §52.6). The orb in the wizard's audio step and
 * the chat strip's recorder share these exact semantics.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { AUDIO_MAX_DURATION_SEC } from "./constants";

/**
 * @param {Object} [options]
 * @param {number} [options.maxDurationSec] - Recording cap, defaults to the §11.3 mirror.
 * @param {Function} [options.onClipReady] - Emits the Blob take after stop.
 * @param {Function} [options.onCap] - Cap reached (the recorder stopped itself).
 * @param {Function} [options.onPermissionError] - getUserMedia rejection.
 * @returns {{state: 'idle'|'recording', elapsed: number, start: Function, stop: Function}}
 */
export default function useMediaRecorder({
  maxDurationSec = AUDIO_MAX_DURATION_SEC,
  onClipReady,
  onCap,
  onPermissionError,
} = {}) {
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const elapsedRef = useRef(0);

  const [state, setState] = useState("idle"); // idle | recording
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      elapsedRef.current = 0;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        setState("idle");
        setElapsed(0);
        if (onClipReady) onClipReady({ blob, durationSec: elapsedRef.current });
      };
      recorder.start();
      setState("recording");
      setElapsed(0);
      timerRef.current = setInterval(() => {
        elapsedRef.current += 1;
        setElapsed(elapsedRef.current);
        if (elapsedRef.current >= maxDurationSec) {
          stop();
          if (onCap) onCap();
        }
      }, 1000);
    } catch {
      setState("idle");
      if (onPermissionError) onPermissionError();
    }
  }, [maxDurationSec, onCap, onClipReady, onPermissionError, stop]);

  return { state, elapsed, start, stop };
}