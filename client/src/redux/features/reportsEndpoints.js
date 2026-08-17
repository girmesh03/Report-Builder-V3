/**
 * @module redux/features/reportsEndpoints
 *
 * The report endpoint set of §42.6 (owning contract §31, §21),
 * injected exactly once into the single descriptor (ADR-026). It
 * covers the §31 lifecycle: header PATCH
 * (§31.5), content
 * Mode-1 save / Mode-2/3 correction / revert (§31.6, §35), accept
 * (§31.6, BR-08), digest re-derivation, generation (§34.2) and the
 * two-path archive lifecycle (§31.7, BR-15/BR-16). Tag families:
 * mutations that change report rows invalidate `Reports` (no manual
 * refetch, ADR-033); content writes also clear the server-side
 * digest, which the dashboard family re-reads via its own
 * subscription.
 *
 * `skipReauth` is intentionally absent here: a 401 means an expired
 * session and must enter the §42.3 chain.
 */
import { apiSlice } from "./apiSlice";

const REPORTS_LIST_TAG = { type: "Reports", id: "LIST" };
const reportTag = (reportId) => ({ type: "Reports", id: reportId });

export const {
  useListReportsQuery,
  useGetReportQuery,
  useCreateReportMutation,
  useUpdateReportMutation,
  useUpdateVisitsMutation,
  useAcceptReportMutation,
  useRederiveDigestMutation,
  useGenerateReportMutation,
  useUpdateContentMutation,
  useCorrectContentMutation,
  useTranscribeInstructionMutation,
  useAcceptCorrectionMutation,
  useRevertCorrectionMutation,
  useRevertContentMutation,
  useArchiveReportMutation,
  useRestoreReportMutation,
  useDeleteReportMutation,
  useExportContentQuery,
} = apiSlice.injectEndpoints({
  overrideExisting: false,
  endpoints: (build) => ({
    listReports: build.query({
      query: (params) => ({ url: "/reports", params }),
      providesTags: [REPORTS_LIST_TAG],
    }),
    createReport: build.mutation({
      query: (body) => ({ url: "/reports", method: "POST", body }),
      invalidatesTags: [REPORTS_LIST_TAG],
    }),
    updateVisits: build.mutation({
      query: ({ reportId, ...body }) => ({
        url: `/reports/${reportId}/visits`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { reportId }) => [reportTag(reportId)],
    }),
    getReport: build.query({
      query: ({ reportId, withContent }) => ({
        url: `/reports/${reportId}`,
        params: withContent ? { withContent: "true" } : undefined,
      }),
      providesTags: (_result, _error, { reportId }) => [reportTag(reportId)],
    }),
    updateReport: build.mutation({
      query: ({ reportId, ...body }) => ({
        url: `/reports/${reportId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { reportId }) => [reportTag(reportId)],
    }),
    acceptReport: build.mutation({
      query: (reportId) => ({ url: `/reports/${reportId}/accept`, method: "POST" }),
      invalidatesTags: (_result, _error, reportId) => [reportTag(reportId)],
    }),
    rederiveDigest: build.mutation({
      query: (reportId) => ({ url: `/reports/${reportId}/digest`, method: "POST" }),
      invalidatesTags: (_result, _error, reportId) => [reportTag(reportId)],
    }),
    generateReport: build.mutation({
      query: (reportId) => ({ url: `/reports/${reportId}/generate`, method: "POST" }),
      invalidatesTags: (_result, _error, reportId) => [reportTag(reportId)],
    }),
    updateContent: build.mutation({
      query: ({ reportId, ...body }) => ({
        url: `/reports/${reportId}/content`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { reportId }) => [reportTag(reportId)],
    }),
    correctContent: build.mutation({
      query: ({ reportId, formData, ...jsonBody }) => ({
        url: `/reports/${reportId}/correct`,
        method: "POST",
        body: formData instanceof FormData ? formData : jsonBody,
      }),
    }),
    transcribeInstruction: build.mutation({
      query: ({ reportId, formData }) => ({
        url: `/reports/${reportId}/correct/transcribe`,
        method: "POST",
        body: formData,
      }),
    }),
    revertContent: build.mutation({
      query: (reportId) => ({
        url: `/reports/${reportId}/content/revert`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, reportId) => [reportTag(reportId)],
    }),
    archiveReport: build.mutation({
      query: (reportId) => ({ url: `/reports/${reportId}/archive`, method: "POST" }),
      invalidatesTags: (result) => [
        REPORTS_LIST_TAG,
        ...(result?.reportId ? [reportTag(result.reportId)] : []),
      ],
    }),
    restoreReport: build.mutation({
      query: (reportId) => ({ url: `/reports/${reportId}/restore`, method: "POST" }),
      invalidatesTags: (result) => [
        REPORTS_LIST_TAG,
        ...(result?.reportId ? [reportTag(result.reportId)] : []),
      ],
    }),
    deleteReport: build.mutation({
      query: (reportId) => ({ url: `/reports/${reportId}`, method: "DELETE" }),
      invalidatesTags: [REPORTS_LIST_TAG],
    }),
    exportContent: build.query({
      query: (reportId) => ({ url: `/reports/${reportId}/export/content` }),
    }),
  }),
});