/**
 * @module utils/logger
 *
 * Winston logger (§26.3, §9.5). Transports: console (development,
 * simple format) + daily-rotating file under `logs/` with
 * `LOG_RETENTION_DAYS` (30) retention. Child loggers are labeled
 * Server, DB, Auth, AI-Addis, AI-Gemini, AI-Nvidia for the §16
 * provider calls. Safe-logging policy (ADR-019): passwords, JWT
 * values, cookies, API keys, audio content, and full
 * transcription/report texts are never logged; provider logs carry
 * only provider, model, status code, latency, request/response ids.
 * `console.log` is banned (§9.5) — logger methods are the only
 * logging surface.
 */
import winston from 'winston';
import 'winston-daily-rotate-file';
import { env } from '../config/env.js';
import { LOG_RETENTION_DAYS } from './constants.js';

const { combine, timestamp, colorize, printf, json } = winston.format;

const fileTransport = new winston.transports.DailyRotateFile({
  dirname: 'logs',
  filename: 'app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: String(LOG_RETENTION_DAYS),
  format: combine(timestamp(), json()),
});

const consoleTransport = new winston.transports.Console({
  format: combine(
    colorize({ level: true }),
    timestamp({ format: 'HH:mm:ss' }),
    printf(({ level, message, label, timestamp: ts }) => `${ts} [${label ?? 'Server'}] ${level}: ${message}`),
  ),
});

const transports = [fileTransport];
if (env.NODE_ENV !== 'production') {
  transports.push(consoleTransport);
}

/**
 * The root logger — labeled Server. The only logging surface (§9.5).
 * @type {winston.Logger}
 */
export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transports,
});

/**
 * Creates a child logger carrying the given section label (§26.3).
 * @param {string} label - Section label (Server, DB, Auth, AI-*).
 * @returns {winston.Logger} Child logger sharing the root transports.
 */
export function createChildLogger(label) {
  return logger.child({ label });
}

/** @type {winston.Logger} — MongoDB connection loggers (§26.6). */
export const dbLogger = createChildLogger('DB');

/** @type {winston.Logger} — auth flow logger (§28). */
export const authLogger = createChildLogger('Auth');

/** @type {winston.Logger} — addis provider calls (§16). */
export const aiAddisLogger = createChildLogger('AI-Addis');

/** @type {winston.Logger} — gemini provider calls (§16). */
export const aiGeminiLogger = createChildLogger('AI-Gemini');

/** @type {winston.Logger} — nvidia provider calls (§16). */
export const aiNvidiaLogger = createChildLogger('AI-Nvidia');