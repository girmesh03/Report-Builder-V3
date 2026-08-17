/**
 * @module redux/features/transcriptionEndpoints
 *
 * The transcription endpoint set of §42.6 (owning contract §33,
 * §23). The per-clip `raw`/`latest` single-undo layout is
 * server-side; the client reads TranscriptionDtos and drives
 * re-transcription (§33.6, ADR-030 — at `reviewed` it invalidates
 * the review lock and rewinds to `transcribed`) and the per-clip
 * accept gesture (§31.6, review gesture only — never a status
 * change, so no `Reports` invalidation there).
 */
import { apiSlice } from "./apiSlice";

const TRANSCRIPTION_LIST_TAG = { type: "Transcription", id: "LIST" };

export const {
  useListTranscriptionsQuery,
  useTranscribeReportMutation,
  useReTranscribeMutation,
  useAcceptTranscriptionMutation,
} = apiSlice.injectEndpoints({
  overrideExisting: false,
  endpoints: (build) => ({
    listTranscriptions: build.query({
      query: (reportId) => ({ url: `/reports/${reportId}/transcriptions` }),
      providesTags: [TRANSCRIPTION_LIST_TAG],
    }),
    transcribeReport: build.mutation({
      query: (reportId) => ({ url: `/reports/${reportId}/transcribe`, method: "POST" }),
      invalidatesTags: ["Reports", TRANSCRIPTION_LIST_TAG],
    }),
    reTranscribe: build.mutation({
      query: ({ reportId, transcriptionId }) => ({
        url: `/reports/${reportId}/transcriptions/${transcriptionId}/re-transcribe`,
        method: "POST",
      }),
      invalidatesTags: ["Reports", TRANSCRIPTION_LIST_TAG],
    }),
    acceptTranscription: build.mutation({
      query: ({ reportId, transcriptionId }) => ({
        url: `/reports/${reportId}/transcriptions/${transcriptionId}/accept`,
        method: "POST",
      }),
    }),
  }),
});