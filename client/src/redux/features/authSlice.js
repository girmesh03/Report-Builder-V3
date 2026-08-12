/**
 * @module redux/features/authSlice
 *
 * The auth UI-state slice (§41.5/§41.6): the status machine the
 * guards consume — `initializing` (populated by the §28 session
 * contract through the §42 network layer), `authenticated`,
 * `guest`. Slices never own API state — every server call is RTK
 * Query; this slice only mirrors the session lifecycle into Redux.
 *
 * `AUTH_SESSION_EXPIRED` is single-sourced here: the §42 reauth
 * chain (redux/features/apiSlice.js) dispatches it on refresh
 * failure (the chain imports the type only, avoiding an import
 * cycle — authSlice never imports apiSlice; auth endpoints are
 * injected by redux/features/authEndpoints.js, ADR-026).
 */
import { createSlice } from "@reduxjs/toolkit";

/**
 * @type {string}
 */
export const AUTH_SESSION_EXPIRED = "auth/sessionExpired";

const initialState = Object.freeze({
  status: "initializing",
  user: null,
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    authenticated(state, action) {
      state.status = "authenticated";
      state.user = action.payload;
    },
    setGuest(state) {
      state.status = "guest";
      state.user = null;
    },
    logoutCleared(state) {
      state.status = "guest";
      state.user = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(AUTH_SESSION_EXPIRED, (state) => {
      state.status = "guest";
      state.user = null;
    });
  },
});

export const { authenticated, setGuest, logoutCleared } = authSlice.actions;

/**
 * @param {Object} state - Root state.
 * @returns {('initializing'|'authenticated'|'guest')} Auth status.
 */
export const selectAuthStatus = (state) => state.auth.status;

/**
 * @param {Object} state - Root state.
 * @returns {Object|null} The current UserDto (§28.3) or null.
 */
export const selectAuthUser = (state) => state.auth.user;

export default authSlice;
