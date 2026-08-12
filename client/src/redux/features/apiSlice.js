/**
 * @module redux/features/apiSlice
 *
 * The single API layer of the client (§42, §41.6): one `createApi`
 * whose `baseQuery` adds the §42.3 reauth chain and the §42.4
 * envelope unwrap / error normalization. This module is the only
 * owner of HTTP on the client — no `fetch(`/`axios` anywhere else in
 * `src/` (grep gate §42.7); 401s are never toasted.
 *
 * Transport seam (§66.10): in development the base transport is the
 * mock adapter (mock/transport.js) — a plain module mirroring the
 * §17/§27 DTO and envelope transforms exactly over §40 fixtures; it
 * is wired dev-only via a dynamic import under `import.meta.env.DEV`
 * so the module never exists in a production build (the constant-
 * false branch is pruned; the adapter is deleted at P7).
 */
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { AUTH_SESSION_EXPIRED } from "./authSlice";
import { httpStatus } from "../../utils/httpStatus";
import { TOAST_CATALOGUE } from "../../utils/constants";

/**
 * §10.5 default; the env var is injected by Vite at build time.
 * @type {string}
 */
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api/v1";

/**
 * The base transport: the §66.10 mock adapter in development, the
 * real `fetchBaseQuery` everywhere else. `credentials: 'include'` on
 * every call — including public pages — because the session lives in
 * httpOnly cookies (§28, §12.7, locked decision 7).
 */
const baseFetch = import.meta.env.DEV
  ? (await import("../../mock/transport.js")).mockTransport
  : fetchBaseQuery({ baseUrl: API_BASE_URL, credentials: "include" });

/**
 * Single in-flight refresh token (concurrency rule, §42.3): a second
 * refresh never starts while one is pending; queued requests resume
 * on its resolution.
 * @type {Promise<Object>|null}
 */
let refreshPromise = null;

/**
 * The §42.3 reauth chain. On 401 the chain attempts exactly one
 * refresh (`POST /auth/refresh` — the §28 endpoint, referenced never
 * re-implemented), then retries the original request once; a second
 * 401 fails through as expiration. A failed refresh ends the
 * session: clear auth state and redirect to `/login` — silently, no
 * toast (401 rule, §12.11-2). Requests marked `skipReauth`
 * (the §42.3 retry marker; also the refresh call itself, and the
 * login mutation whose 401 is a rejection, §48.3) pass through.
 *
 * Redirect only fires for an authenticated session that just died:
 * an anonymous boot probe (auth state `initializing`/`guest`) fails
 * through silently so public pages never bounce to `/login`.
 *
 * @param {Object} args - fetchBaseQuery-style request args.
 * @param {Object} api - RTK Query baseQuery api.
 * @param {Object} [extraOptions] - Request extras; the reauth marker is `skipReauth`.
 * @returns {Promise<{data: *}|{error: *}>} Normalized result.
 */
const baseQueryWithReauth = async (args, api, extraOptions = {}) => {
  let result = await baseFetch(args, api, extraOptions);

  if (
    result.error &&
    result.error.status === httpStatus.UNAUTHORIZED &&
    !extraOptions.skipReauth
  ) {
    if (!refreshPromise) {
      refreshPromise = baseFetch(
        { url: "/auth/refresh", method: "POST" },
        api,
        { skipReauth: true },
      ).finally(() => {
        refreshPromise = null;
      });
    }
    const refreshResult = await refreshPromise;

    if (refreshResult.data) {
      result = await baseFetch(args, api, { skipReauth: true });
      if (
        result.error &&
        result.error.status === httpStatus.UNAUTHORIZED &&
        api.getState().auth.status === "authenticated"
      ) {
        expireSession(api);
      }
    } else if (api.getState().auth.status === "authenticated") {
      expireSession(api);
    }
  }

  return normalizeResult(result);
};

/**
 * Session-expiry landing (§42.3 step 5): clear the auth slice and
 * redirect to `/login` — silent, never a toast.
 * @param {Object} api - RTK Query baseQuery api.
 */
const expireSession = (api) => {
  api.dispatch({ type: AUTH_SESSION_EXPIRED });
  window.location.assign("/login");
};

/**
 * §42.4 normalization. Success: the envelope `{ success, message,
 * data }` is unwrapped — consumers receive `data` directly and the
 * wrapper never leaks `success`/`message` into page state. Errors:
 * every non-401 error becomes the toast-ready `{ status, message,
 * fieldErrors }` shape; `fieldErrors` (422 only) maps field names to
 * their validation messages; when the server sends no plain-language
 * message, the §60.6 offline/generic fallbacks apply.
 *
 * @param {{data?: Object, error?: Object}} result - Raw transport result.
 * @returns {{data?: *, error?: {status: number, message: string, fieldErrors?: Object}}}
 */
const normalizeResult = (result) => {
  if (result.error) {
    const { status, data } = result.error;
    let message = TOAST_CATALOGUE.error.generic;
    let fieldErrors;

    if (data && typeof data.message === "string" && data.message) {
      message = data.message;
    } else if (result.error.error) {
      message = TOAST_CATALOGUE.error.offline;
    }

    if (status === httpStatus.UNPROCESSABLE_ENTITY && Array.isArray(data?.details)) {
      fieldErrors = Object.fromEntries(
        data.details.map((detail) => [detail.field, detail.message]),
      );
    }

    return { error: { status, message, fieldErrors } };
  }

  if (result.data && typeof result.data === "object" && "success" in result.data) {
    return { data: result.data.data };
  }

  return result;
};

/**
 * The single descriptor (§42.2, ADR-026). Tag families are the six
 * domain families of §41.6; endpoint sets are injected by their
 * consuming modules (`injectEndpoints({ overrideExisting: false })`
 * — a set may be injected exactly once).
 */
export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Reports", "Branches", "Audio", "Transcription", "Conversation", "Me"],
  endpoints: () => ({}),
});
