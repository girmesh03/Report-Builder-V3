/**
 * @module server
 *
 * Process entry (§26.6, §15.4). Connects to MongoDB (log via the DB
 * logger; bounded exponential retry — D53 — then fail-fast exit 1,
 * after the §26.2 env check), then `app.listen(PORT)` (4000 in
 * development), logging `Server` listening. Graceful shutdown
 * (ADR-013): on SIGINT/SIGTERM — stop accepting connections
 * (`server.close()`), clear the sweeper timer (§12.5/§62 — started
 * at sub-phase 6), close the MongoDB client, flush the logger,
 * exit 0; forced exit after a timeout (10 s default, §26.6 —
 * dev-only log).
 */
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { logger, dbLogger } from './utils/logger.js';
import {
  MONGO_CONNECT_TIMEOUT_MS,
  DB_RETRY_INITIAL_MS,
  DB_RETRY_MAX_MS,
  DB_RETRY_MAX_ATTEMPTS,
} from './utils/constants.js';
import { app } from './app.js';
import { startSweeper, stopSweeper } from './jobs/sweeper.js';

const SHUTDOWN_FORCE_TIMEOUT_MS = 10000; // §26.6 "default 10 s"

/**
 * The §26.6 boot connection — bounded exponential retry (D53):
 * attempt 1 immediately, then `min(INITIAL × 2^(n−1), MAX)` waits
 * between attempts; after MAX_ATTEMPTS consecutive failures the
 * fail-fast exit fires (exit 1). Initial-connect scope only.
 * @returns {Promise<void>} Resolves once connected; never rejects.
 */
async function connectWithRetry() {
  for (let attempt = 1; attempt <= DB_RETRY_MAX_ATTEMPTS; attempt += 1) {
    try {
      await mongoose.connect(env.MONGO_URI, {
        serverSelectionTimeoutMS: MONGO_CONNECT_TIMEOUT_MS,
      });
      return;
    } catch (error) {
      if (attempt === DB_RETRY_MAX_ATTEMPTS) {
        dbLogger.error(
          `MongoDB connection failed after ${DB_RETRY_MAX_ATTEMPTS} attempts: ${error.message}`,
        );
        process.exit(1);
      }
      const delay = Math.min(DB_RETRY_INITIAL_MS * 2 ** (attempt - 1), DB_RETRY_MAX_MS);
      dbLogger.warn(
        `MongoDB connection attempt ${attempt}/${DB_RETRY_MAX_ATTEMPTS} failed (${error.message}) — retrying in ${delay} ms`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

async function main() {
  try {
    await connectWithRetry();
    dbLogger.info('MongoDB connected');
  } catch (error) {
    dbLogger.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }

  const server = app.listen(env.PORT, () => {
    logger.info(`Server listening on port ${env.PORT}`);
    // The sweeper timer starts after listening (§26.6/§62).
    startSweeper();
  });

  server.on('error', (error) => {
    logger.error(`Server error: ${error.code || error.name}`);
    process.exit(1);
  });

  let shuttingDown = false;

  function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`Received ${signal} — shutting down`);

    server.close(() => {
      stopSweeper();
      mongoose.connection.close(() => {
        logger.close();
        process.exit(0);
      });
    });

    setTimeout(() => {
      if (env.NODE_ENV !== 'production') {
        logger.warn('Forced shutdown after timeout');
      }
      process.exit(1);
    }, SHUTDOWN_FORCE_TIMEOUT_MS).unref();
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((error) => {
  logger.error(`Fatal boot error: ${error.name || 'Error'}`);
  process.exit(1);
});