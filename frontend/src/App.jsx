import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing/Landing";
import Login from "./pages/Auth/Login";
import NotFound from "./pages/NotFound/NotFound";
import AuthCallback from "./pages/Auth/AuthCallback";
import Register from "./pages/Auth/Register";
import AuthorizedRoute from "./components/ProtectedRoutes/AuthorizedRoute";
import UnauthorizedRoute from "./components/ProtectedRoutes/UnauthorizedRoute";
import Account from "./pages/Account/Account";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      <Route element={<UnauthorizedRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<AuthorizedRoute />}>
        <Route path="/account" element={<Account />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
