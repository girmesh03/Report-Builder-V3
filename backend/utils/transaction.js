/**
 * @module utils/transaction
 *
 * The §27.7 transaction template (ADR-018): every write handler
 * (create, update, archive/restore/delete, cascade, upload metadata,
 * transcription write, content save, re-transcription, message
 * append) runs through `withTransaction`. Reads never open
 * transactions (§27.7). Model hooks/statics that write accept
 * `{ session }` and join the caller's transaction (§18.5); no
 * implicit or embedded sessions exist. TTL-index deletions are the
 * single documented exception (server-side, cannot use a session —
 * §27.7, §18.3).
 */
import mongoose from 'mongoose';

/**
 * Runs `work` inside one session transaction with the canonical
 * lifecycle: startSession → startTransaction → work(session) →
 * commitTransaction; on error abortTransaction; always endSession.
 * @template T
 * @param {(session: import('mongoose').ClientSession) => Promise<T>} work - The write work; every model write inside must carry `{ session }`.
 * @returns {Promise<T>} The work result (surfaces only after commit).
 * @throws {Error} Any error raised by `work` (abort + rethrow).
 */
export async function withTransaction(work) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const result = await work(session);
    await session.commitTransaction();
    return result;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    await session.endSession();
  }
}