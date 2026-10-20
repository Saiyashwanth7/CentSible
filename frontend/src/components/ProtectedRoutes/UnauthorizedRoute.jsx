// Pages for users who haven't logged in

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

function UnauthorizedRoute() {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading...</p>;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}

export default UnauthorizedRoute;
