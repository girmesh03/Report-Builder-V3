/**
 * @module redux/features/searchEndpoints
 *
 * The search endpoint set of §42.6 (§39 contract — the backend of
 * the §59.2 search dialog; text indexes over
 * `{ supervisorName, 'branches.name', 'visits.branchName' }` and
 * `{ name, location }`, §39.2). One endpoint, optional `type`
 * filter; archived rows are excluded unless `includeArchived` —
 * defaults matching §30.2/§31.3. Results are grouped client-side by
 * `type` (§59.3). The dialog drives it lazily (Enter/action only,
 * §9.6 — no debounce).
 */
import { apiSlice } from "./apiSlice";

export const {
  useLazySearchAllQuery,
} = apiSlice.injectEndpoints({
  overrideExisting: false,
  endpoints: (build) => ({
    searchAll: build.query({
      query: (params) => ({ url: "/search", params }),
    }),
  }),
});