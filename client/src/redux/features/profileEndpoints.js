/**
 * @module redux/features/profileEndpoints
 *
 * The profile/session endpoint set of §42.6 (§28.3/§28.5, §19).
 * `updateProfile` posts multipart (`position`, `firstName` when not
 * derived-locked, `avatar` file) and invalidates `Me` so the
 * session display-name and avatar refresh everywhere. Sessions are
 * listed and force-ended per row (`DELETE /auth/sessions/:sessionId`);
 * the current session row is labeled by the client (§57.4) and its
 * action is disabled.
 */
import { apiSlice } from "./apiSlice";

export const {
  useUpdateProfileMutation,
  useListSessionsQuery,
  useDeleteSessionMutation,
} = apiSlice.injectEndpoints({
  overrideExisting: false,
  endpoints: (build) => ({
    updateProfile: build.mutation({
      query: (formData) => ({ url: "/auth/profile", method: "PATCH", body: formData }),
      invalidatesTags: ["Me"],
    }),
    listSessions: build.query({
      query: () => ({ url: "/auth/sessions" }),
      providesTags: ["Me"],
    }),
    deleteSession: build.mutation({
      query: (sessionId) => ({ url: `/auth/sessions/${sessionId}`, method: "DELETE" }),
      invalidatesTags: ["Me"],
    }),
  }),
});