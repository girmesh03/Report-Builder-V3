/**
 * @module components/report/useEditorHost
 *
 * The §53.6 surface handler made concrete — the editor-host state
 * machine every writing surface (the transcription step's story card
 * and the report step's body card) shares: the draft seed override,
 * the dirty flag, the field-error slot, the save/revert busy states,
 * the brief "Saved just now" window, and the four boundary
 * operations — dirty reporting, the boundary-read save, the
 * single-undo revert, and the candidate fill (§54.3).
 *
 * The host keeps its own seed derivation (`editSeed = draft ||
 * persisted`) so joined-fallback logic stays host-owned; this hook
 * owns only the shared mechanics. The round-8.5 save semantics are
 * hard rules here: the boundary read is `?? ""` — an undefined read
 * (editor not mounted) and an empty document both read as `""`, so
 * the draft (set on every successful save) can never resurrect
 * deleted text — the draft remains the edit seed only, never a save
 * source (§53.3/§53.5).
 *
 * `onDirtyChange` is STABLE (round-8.5, §53.3 seed-sync stability):
 * a churning identity re-creates MuiEditor's `applyExternal` on every
 * host render, which re-runs the seed-sync effect and re-seeds the
 * stale value — wiping formatting marks and refilling deleted text.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import {
  useUpdateContentMutation,
  useRevertContentMutation,
} from "../../redux/features/reportsEndpoints";
import { TOAST_CATALOGUE } from "../../utils/constants";
import { showToast } from "../../utils/toast";

/**
 * @param {Object} options
 * @param {string|null} options.reportId - The report the content belongs to.
 * @param {import("react").RefObject} options.surfaceRef - The §53.3 boundary
 *   handle into the live MuiEditor (getContent / applyCandidate).
 * @param {string|null} options.latest - The persisted story (`report.latest`);
 *   its presence decides the server revert and the saved-time line.
 * @param {string|null} options.updatedAt - The report's `updatedAt`, the
 *   source of the approximate saved-time line (§66.10).
 * @param {Object} options.copy - Chrome strings: `emptyBlock` (the local
 *   empty-read block message), `savedToast`, `revertedToast` (the §11.5
 *   toast catalogue rows).
 */
export default function useEditorHost({
  reportId,
  surfaceRef,
  latest,
  updatedAt,
  copy,
}) {
  const [updateContent] = useUpdateContentMutation();
  const [revertContent] = useRevertContentMutation();

  const [draft, setDraft] = useState("");
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const justSavedTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      window.clearTimeout(justSavedTimerRef.current);
    };
  }, []);

  const handleDirtyChange = useCallback((nextDirty) => {
    if (nextDirty) {
      setError(null);
    }
    setDirty(nextDirty);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const content = surfaceRef.current?.getContent() ?? "";
      if (!content.trim()) {
        setError(copy.emptyBlock);
        return false;
      }
      setError(null);
      setDraft(content);
      await updateContent({ reportId, content }).unwrap();
      setDirty(false);
      setJustSaved(true);
      window.clearTimeout(justSavedTimerRef.current);
      justSavedTimerRef.current = window.setTimeout(
        () => setJustSaved(false),
        4000,
      );
      showToast("success", copy.savedToast);
      return true;
    } catch (saveError) {
      setError(saveError?.fieldErrors?.content ?? null);
      showToast(
        "error",
        saveError?.message ?? TOAST_CATALOGUE.error.generic,
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  const resetDraft = useCallback(() => {
    setDraft("");
    setDirty(false);
    setError(null);
  }, []);

  const handleRevertToOriginal = async () => {
    setReverting(true);
    try {
      if (latest) {
        await revertContent(reportId).unwrap();
        showToast("success", copy.revertedToast);
      }
      resetDraft();
    } catch (revertError) {
      showToast(
        "error",
        revertError?.message ?? TOAST_CATALOGUE.error.generic,
      );
    } finally {
      setReverting(false);
    }
  };

  const applyCandidate = useCallback((content) => {
    if (!content) {
      return;
    }
    setError(null);
    setDraft(content);
    surfaceRef.current?.applyCandidate?.(content);
  }, [surfaceRef]);

  const lastSavedAt =
    latest && updatedAt ? dayjs(updatedAt).format("HH:mm") : null;

  return {
    draft,
    dirty,
    error,
    saving,
    reverting,
    justSaved,
    lastSavedAt,
    canRevert: Boolean(latest) || dirty,
    handleDirtyChange,
    handleSave,
    handleRevertToOriginal,
    applyCandidate,
    resetDraft,
  };
}