/**
 * @module components/layout/PublicRoute
 *
 * The public-branch guard (§41.5, locked decision 4): the inverse of
 * ProtectedRoute — authenticated sessions are redirected to
 * `/dashboard` (fixed target string); anonymous visitors render the
 * branch. Landing, Login, and Register are public by lock.
 */
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router";
import { selectAuthStatus } from "../../redux/features/authSlice";

export default function PublicRoute() {
  const status = useSelector(selectAuthStatus);

  if (status === "authenticated") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
