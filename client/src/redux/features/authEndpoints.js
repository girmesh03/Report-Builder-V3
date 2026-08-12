/**
 * @module redux/features/authEndpoints
 *
 * The auth endpoint set of §42.6, injected exactly once into the
 * single descriptor (ADR-026, `overrideExisting: false`). It
 * references the §28 session contract — endpoint shapes are never
 * re-implemented here. Consumed by the guards/`authSlice` session
 * restore (store.js listeners) and the §48 auth pages.
 *
 * `login` carries the `skipReauth` retry marker: a 401 on login is a
 * **rejection**, not a session expiry (§48.3) — it must not enter
 * the §42.3 chain and must reach the page toast. `googleAuth` is the
 * §28.6 OQ-004 stub (`GET /auth/google` → 404 "Google sign-in is not
 * available in this version"), required by the §48.5 shared OAuth
 * entry.
 */
import { apiSlice } from "./apiSlice";

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGoogleAuthMutation,
  useGetCurrentUserQuery,
} = apiSlice.injectEndpoints({
  overrideExisting: false,
  endpoints: (build) => ({
    login: build.mutation({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      extraOptions: { skipReauth: true },
      invalidatesTags: ["Me"],
    }),
    register: build.mutation({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
    }),
    logout: build.mutation({
      query: () => ({ url: "/auth/logout", method: "POST" }),
      invalidatesTags: ["Me"],
    }),
    googleAuth: build.mutation({
      query: () => ({ url: "/auth/google", method: "GET" }),
    }),
    getCurrentUser: build.query({
      query: () => ({ url: "/auth/me" }),
      providesTags: ["Me"],
    }),
  }),
});
