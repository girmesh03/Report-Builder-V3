/**
 * @module components/layout/ProtectedRoute
 *
 * The protected-branch guard (§41.5, locked decision 4): while the
 * auth state is `initializing` (populated by the §28 session
 * contract through the §42 network layer) renders a full-page
 * LoadingSpinner (§46.14); unauthenticated visitors are redirected
 * to `/login` with `state={{ from: location }}` so the login page
 * can return them; authenticated sessions render the branch.
 */
import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router";
import LoadingSpinner from "../reusable/LoadingSpinner";
import { selectAuthStatus } from "../../redux/features/authSlice";

export default function ProtectedRoute() {
  const status = useSelector(selectAuthStatus);
  const location = useLocation();

  if (status === "initializing") {
    return <LoadingSpinner />;
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
