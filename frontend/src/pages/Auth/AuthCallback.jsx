import { Navigate } from "react-router-dom";

function AuthCallback() {
  return <Navigate to="/" replace />;
}

export default AuthCallback;
