/**
 * @module components/report/useCorrection
 *
 * The §54.3 candidate rule as a shared hook — every editor host that
 * opens the CorrectionDialog (the transcription step's story card and
 * the report step's body card) wires the same contract: the typed (or
 * STT-filled) instruction + the chosen provider generate the
 * candidate; on success the candidate fills the LIVE editor as an
 * editable draft through the host's `applyCandidate` (dirty, never
 * staged, no Accept step) and the dialog closes; on failure the error
 * is toasted and RETHROWN so the dialog can highlight the instruction
 * field from the normalized `fieldErrors.instruction`. The read is
 * `result.content` — the §42.4 normalization already unwraps the
 * envelope (a `.data.` read silently no-ops the candidate fill).
 */
import { useCallback } from "react";
import { useCorrectContentMutation } from "../../redux/features/reportsEndpoints";
import { TOAST_CATALOGUE } from "../../utils/constants";
import { showToast } from "../../utils/toast";

/**
 * @param {Object} options
 * @param {string|null} options.reportId - The report the correction targets.
 * @param {Function} options.applyCandidate - The host's stable candidate
 *   filler (draft + imperative fill of the live editor).
 * @returns {Function} The apply contract `(instruction, provider) →
 *   Promise<boolean>` for the CorrectionDialog.
 */
export default function useCorrection({ reportId, applyCandidate }) {
  const [correctContent] = useCorrectContentMutation();

  const handleApplyCorrection = useCallback(
    async (instruction, provider) => {
      try {
        const result = await correctContent({
          reportId,
          mode: "text",
          instruction,
          provider,
        }).unwrap();
        applyCandidate(result?.content);
        showToast("success", TOAST_CATALOGUE.correction.generated);
        return true;
      } catch (error) {
        showToast("error", error?.message ?? TOAST_CATALOGUE.error.generic);
        throw error;
      }
    },
    [reportId, correctContent, applyCandidate],
  );

  return handleApplyCorrection;
}