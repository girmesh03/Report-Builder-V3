/**
 * @module redux/app/store
 *
 * Store creation (§41.6): `configureStore` with the apiSlice
 * middleware and the auth slice. Slices do not own API state — every
 * server call is RTK Query; the auth slice holds only the session
 * lifecycle mirror.
 *
 * Session restore (§41.5): the §28 session contract populates the
 * auth slice through the §42 network layer — listener middleware
 * drives the boot `GET /auth/me` result into `authenticated`/
 * `setGuest`. The boot probe is dispatched from main.jsx with
 * `subscribe: false` so tag invalidation (e.g. after logout) never
 * re-triggers the restore probe. The login mutation (same §28
 * `{ user }` shape, §48.3) drives the same transition directly —
 * the probe itself never re-runs, so the login page's success path
 * must land the session in the slice itself.
 */
import { configureStore, createListenerMiddleware } from "@reduxjs/toolkit";
import authSlice, { authenticated, setGuest } from "../features/authSlice";
import { apiSlice } from "../features/apiSlice";
import "../features/authEndpoints";

const listenerMiddleware = createListenerMiddleware();

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(listenerMiddleware.middleware, apiSlice.middleware),
});

listenerMiddleware.startListening({
  matcher: apiSlice.endpoints.getCurrentUser.matchFulfilled,
  effect: (action, listenerApi) => {
    listenerApi.dispatch(authenticated(action.payload.user));
  },
});

listenerMiddleware.startListening({
  matcher: apiSlice.endpoints.getCurrentUser.matchRejected,
  effect: (_action, listenerApi) => {
    listenerApi.dispatch(setGuest());
  },
});

listenerMiddleware.startListening({
  matcher: apiSlice.endpoints.login.matchFulfilled,
  effect: (action, listenerApi) => {
    listenerApi.dispatch(authenticated(action.payload.user));
  },
});

export default store;
