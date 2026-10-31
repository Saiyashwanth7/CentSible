import { Navigate } from "react-router-dom";

function AuthCallback() {
  return <Navigate to="/dashboard" replace />; // redirects to the dashboard after the google sign-in/login
}

export default AuthCallback;
