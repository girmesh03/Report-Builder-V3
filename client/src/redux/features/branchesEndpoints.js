/**
 * @module redux/features/branchesEndpoints
 *
 * The branch endpoint set of §42.6 (owning contract §30, §20),
 * injected exactly once into the single descriptor (ADR-026). The
 * two-path lifecycle (archive → restore → permanent delete, BR-14/
 * BR-15/BR-16) is driven by the page actions; mutations invalidate
 * the whole `Branches` family — no manual refetch (ADR-033).
 */
import { apiSlice } from "./apiSlice";

const BRANCH_LIST_TAG = { type: "Branches", id: "LIST" };

export const {
  useListBranchesQuery,
  useGetBranchQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useArchiveBranchMutation,
  useRestoreBranchMutation,
  useDeleteBranchMutation,
} = apiSlice.injectEndpoints({
  overrideExisting: false,
  endpoints: (build) => ({
    listBranches: build.query({
      query: (params) => ({ url: "/branches", params }),
      providesTags: [BRANCH_LIST_TAG],
    }),
    getBranch: build.query({
      query: (branchId) => ({ url: `/branches/${branchId}` }),
      providesTags: (_result, _error, branchId) => [{ type: "Branches", id: branchId }],
    }),
    createBranch: build.mutation({
      query: (body) => ({ url: "/branches", method: "POST", body }),
      invalidatesTags: [BRANCH_LIST_TAG],
    }),
    updateBranch: build.mutation({
      query: ({ branchId, ...body }) => ({
        url: `/branches/${branchId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: [BRANCH_LIST_TAG],
    }),
    archiveBranch: build.mutation({
      query: (branchId) => ({ url: `/branches/${branchId}/archive`, method: "POST" }),
      invalidatesTags: [BRANCH_LIST_TAG],
    }),
    restoreBranch: build.mutation({
      query: (branchId) => ({ url: `/branches/${branchId}/restore`, method: "POST" }),
      invalidatesTags: [BRANCH_LIST_TAG],
    }),
    deleteBranch: build.mutation({
      query: (branchId) => ({ url: `/branches/${branchId}`, method: "DELETE" }),
      invalidatesTags: [BRANCH_LIST_TAG],
    }),
  }),
});