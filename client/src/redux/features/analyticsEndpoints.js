/**
 * @module redux/features/analyticsEndpoints
 *
 * The analytics endpoint set of §42.6 (§38 contract — server-side
 * computation only, ADR-034: the client never aggregates). The
 * dashboard payload of §38.2 feeds the §49 KPI cards and chart
 * trio; `analytics/items` exposes digest items (§6.11) for the
 * filterable item surface. The dashboard family is declared as a
 * consumer of the `Reports` tag family: any report mutation (create,
 * status move, archive) makes the KPIs/charts stale — never a
 * manual refetch (ADR-033).
 */
import { apiSlice } from "./apiSlice";

export const {
  useGetAnalyticsDashboardQuery,
  useGetAnalyticsItemsQuery,
} = apiSlice.injectEndpoints({
  overrideExisting: false,
  endpoints: (build) => ({
    getAnalyticsDashboard: build.query({
      query: () => ({ url: "/analytics/dashboard" }),
      providesTags: ["Reports"],
    }),
    getAnalyticsItems: build.query({
      query: (params) => ({ url: "/analytics/items", params }),
      providesTags: ["Reports"],
    }),
  }),
});