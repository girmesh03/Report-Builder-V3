/**
 * @module hooks/useLogout
 *
 * The single logout flow (§47.5/§47.6): runs the §42/§28 logout,
 * then clears the `authSlice` state **after** the call succeeds; a
 * failing logout still clears local state and navigates. Exactly one
 * success toast per user-initiated mutation (§60.5): "You have been
 * logged out" (§60.6). Used by the AppSidebar bottom entry and the
 * AppShell avatar menu.
 */
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import { useLogoutMutation } from "../redux/features/authEndpoints";
import { logoutCleared } from "../redux/features/authSlice";
import { showToast } from "../utils/toast.jsx";
import { TOAST_CATALOGUE } from "../utils/constants";

export const useLogout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [logout] = useLogoutMutation();

  return useCallback(async () => {
    try {
      await logout().unwrap();
      dispatch(logoutCleared());
      showToast("success", TOAST_CATALOGUE.auth.loggedOut);
    } catch (error) {
      dispatch(logoutCleared());
      showToast("error", error.message);
    }
    navigate("/login");
  }, [dispatch, logout, navigate]);
};
