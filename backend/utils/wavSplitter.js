/**
 * @module utils/wavSplitter
 *
 * The §33.3 PCM-level WAV chunking (ADR-007, accuracy-critical) —
 * `ffmpeg`/`ffprobe` via `execFile` (the §10.4
 * `FFMPEG_PATH`/`FFPROBE_PATH` binaries; paths never user input).
 * The pipeline converts any non-PCM upload (mpeg/wav/mp4/webm) to
 * mono 16-bit 16 kHz PCM **before** chunking; output chunks are the
 * pipeline's own MIME (PCM wav), never the uploaded `audio/webm`
 * type (§33.3/§22). Chunk length uses the `ADDIS_AI_STT_MAX_DURATION_SEC`
 * constant (60 s, §11.3) — never a literal. The chunk-boundary
 * logic never reorders text: chunk break points prefer a silence
 * near the 60 s cap (a natural boundary) and fall back to hard cuts;
 * the §33 pipeline concatenates chunk results in order with
 * single-space joins (§33.3). Deterministic; zero dependencies.
 */
import { execFile } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { env } from '../config/env.js';
import { ADDIS_AI_STT_MAX_DURATION_SEC } from './constants.js';

const execFileAsync = promisify(execFile);

/** Chunk working directory — under the gitignored uploads tree. */
const CHUNK_DIR = 'uploads/tmp';

/** The silence-detection window: a break is preferred within ±5 s of a boundary. */
const SILENCE_WINDOW_SEC = 5;

/**
 * Marks a splitter failure (mapping surface for the §33 pipeline:
 * a missing/unreadable input file is a 422 "The audio file could
 * not be read" at the §33.7 map; anything else is a 502 provider-
 * class failure — the controller maps, the util never responds).
 * @type {Error}
 */
export class WavSplitError extends Error {
  constructor(message, code = 'WAV_SPLIT_FAILED') {
    super(message);
    this.name = 'WavSplitError';
    this.code = code;
  }
}

/**
 * Probes the media duration in seconds.
 * @param {string} filePath - The uploaded file.
 * @returns {Promise<number>} Duration in seconds.
 */
async function probeDuration(filePath) {
  try {
    const { stdout } = await execFileAsync(env.FFPROBE_PATH, [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      filePath,
    ]);
    const seconds = Number(stdout.trim());
    if (!Number.isFinite(seconds) || seconds < 0) {
      throw new WavSplitError('The audio duration could not be read', 'WAV_PROBE_FAILED');
    }
    return seconds;
  } catch (err) {
    if (err instanceof WavSplitError) throw err;
    throw new WavSplitError('The audio file could not be read', 'WAV_READ_FAILED');
  }
}

/**
 * Detects silence segments via ffmpeg's `silencedetect` filter and
 * returns the midpoints (seconds) of segments at least 0.4 s long.
 * @param {string} filePath - The input file.
 * @returns {Promise<number[]>} Silence midpoints in seconds, ascending.
 */
async function detectSilences(filePath) {
  try {
    const { stderr } = await execFileAsync(env.FFMPEG_PATH, [
      '-v', 'error',
      '-i', filePath,
      '-af', 'silencedetect=noise=-30dB:d=0.4',
      '-f', 'null', '-',
    ]);
    const starts = [...stderr.matchAll(/silence_start:\s*([\d.]+)/g)].map((m) => Number(m[1]));
    const ends = [...stderr.matchAll(/silence_end:\s*([\d.]+)/g)].map((m) => Number(m[1]));
    const midpoints = [];
    for (let i = 0; i < starts.length; i += 1) {
      const end = ends[i] ?? starts[i] + 0.5;
      midpoints.push((starts[i] + end) / 2);
    }
    return midpoints;
  } catch {
    return [];
  }
}

/**
 * Converts a source range into a mono 16-bit 16 kHz PCM wav chunk.
 * @param {string} input - Input file path.
 * @param {string} output - Output chunk path.
 * @param {number} [start] - Start offset in seconds.
 * @param {number} [end] - End offset in seconds.
 */
async function convertRange(input, output, start, end) {
  const args = ['-v', 'error', '-y'];
  if (start !== undefined) args.push('-ss', String(start));
  if (end !== undefined) args.push('-to', String(end));
  args.push('-i', input, '-ac', '1', '-ar', '16000', '-sample_fmt', 's16', '-c:a', 'pcm_s16le', '-f', 'wav', output);
  try {
    await execFileAsync(env.FFMPEG_PATH, args, { maxBuffer: 16 * 1024 * 1024 });
  } catch (err) {
    throw new WavSplitError('The audio could not be prepared for transcription', 'WAV_CONVERT_FAILED');
  }
}

/**
 * Picks a silence midpoint nearest `boundary` within the ±5 s
 * window, else returns the hard boundary itself.
 * @param {number} boundary - The 60 s cap boundary.
 * @param {number[]} silences - Silence midpoints.
 * @returns {number} The chosen break point.
 */
function pickBreak(boundary, silences) {
  let best = null;
  for (const s of silences) {
    if (s > boundary - SILENCE_WINDOW_SEC && s < boundary + SILENCE_WINDOW_SEC) {
      if (best === null || Math.abs(s - boundary) < Math.abs(best - boundary)) best = s;
    }
  }
  return best ?? boundary;
}

/**
 * Prepares an uploaded audio for the §33 pipeline: converts to mono
 * 16-bit 16 kHz PCM and splits into ≤ 60 s wav chunks (silence-aware
 * breaks near the cap). Chunks are written under
 * `backend/uploads/tmp/` (gitignored) and are the caller's
 * responsibility to unlink (the pipeline unlinks after each chunk
 * transcribe, and its failure path cleans up).
 * @param {string} filePath - The uploaded file path.
 * @param {number} [maxDurationSec] - The chunk cap (§33.3; default `ADDIS_AI_STT_MAX_DURATION_SEC`).
 * @returns {Promise<string[]>} Ordered chunk paths (wav, pipeline MIME).
 */
export async function prepareAndSplit(filePath, maxDurationSec = ADDIS_AI_STT_MAX_DURATION_SEC) {
  const duration = await probeDuration(filePath);
  mkdirSync(CHUNK_DIR, { recursive: true });

  if (duration <= maxDurationSec) {
    const single = join(CHUNK_DIR, `chunk-${Date.now()}-${Math.floor(Math.random() * 1e6)}.wav`);
    await convertRange(filePath, single);
    return [single];
  }

  const silences = await detectSilences(filePath);
  const breaks = [];
  for (let boundary = maxDurationSec; boundary < duration; boundary += maxDurationSec) {
    breaks.push(pickBreak(boundary, silences));
  }

  const chunks = [];
  let cursor = 0;
  for (const brk of breaks) {
    const chunk = join(CHUNK_DIR, `chunk-${Date.now()}-${Math.floor(Math.random() * 1e6)}.wav`);
    await convertRange(filePath, chunk, cursor, brk);
    chunks.push(chunk);
    cursor = brk;
  }
  if (cursor < duration) {
    const tail = join(CHUNK_DIR, `chunk-${Date.now()}-${Math.floor(Math.random() * 1e6)}.wav`);
    await convertRange(filePath, tail, cursor, duration);
    chunks.push(tail);
  }
  return chunks;
}

/**
 * Best-effort chunk cleanup (the pipeline's failure path — leftover
 * files in the gitignored tmp dir are harmless to the product).
 * @param {string[]} paths - Chunk paths to remove.
 */
export function cleanupChunks(paths) {
  for (const p of paths ?? []) {
    try {
      rmSync(p, { force: true });
    } catch {
      // Leftover chunks are gitignored and harmless.
    }
  }
}