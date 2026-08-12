/**
 * @module redux/features/audioEndpoints
 *
 * The audio endpoint set of §42.6 (owning contract §32, §22 —
 * metadata-only DTOs, no `filePath` anywhere, §22.7). Upload binds a
 * clip to the owning report + visit (`{ report, visitNo }`, §32.2);
 * the first clip advances `draft → audio_attached` and deleting the
 * last clip rewinds per §31.4 (ADR-003), so clip mutations
 * invalidate the `Reports` family too — the status surfaced on
 * report/list cells and the details header must be fresh.
 *
 * Playback URLs are derived by callers (§46.17 contract): the DTO
 * carries no URL field — the authenticated stream is
 * `GET /audios/:audioId/play` built from the DTO's `_id`.
 */
import { apiSlice } from "./apiSlice";

const CLIPS_LIST_TAG = { type: "Audio", id: "LIST" };
const audioTag = (audioId) => ({ type: "Audio", id: audioId });

export const {
  useListClipsQuery,
  useGetAudioQuery,
  useUploadClipMutation,
  useDeleteClipMutation,
} = apiSlice.injectEndpoints({
  overrideExisting: false,
  endpoints: (build) => ({
    listClips: build.query({
      query: ({ reportId, visitNo }) => ({
        url: `/reports/${reportId}/visits/${visitNo}/clips`,
      }),
      providesTags: [CLIPS_LIST_TAG],
    }),
    getAudio: build.query({
      query: (audioId) => ({ url: `/audios/${audioId}` }),
      providesTags: (_result, _error, audioId) => [audioTag(audioId)],
    }),
    uploadClip: build.mutation({
      query: ({ reportId, visitNo, formData }) => ({
        url: `/reports/${reportId}/visits/${visitNo}/clips`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: [CLIPS_LIST_TAG, "Reports"],
    }),
    deleteClip: build.mutation({
      query: (audioId) => ({ url: `/audios/${audioId}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, audioId) => [
        audioTag(audioId),
        CLIPS_LIST_TAG,
        "Reports",
      ],
    }),
  }),
});