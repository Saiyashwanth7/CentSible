import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing/Landing";
import Login from "./pages/Auth/Login";
import NotFound from "./pages/NotFound/NotFound";
import AuthCallback from "./pages/Auth/AuthCallback";
import Register from "./pages/Auth/Register";
import AuthorizedRoute from "./components/ProtectedRoutes/AuthorizedRoute";
import UnauthorizedRoute from "./components/ProtectedRoutes/UnauthorizedRoute";
import Account from "./pages/Account/Account";
import Navbar from "./components/Navbar/Navbar";
import Expenses from "./pages/Expenses/Expenses";
import Dashboard from "./pages/Dashboard/Dashboard";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import ResetPassword from "./pages/ResetPassword/ResetPassword";
import Recurring from "./pages/Recurring/Recurring";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/password-reset" element={<ResetPassword />} />
        <Route element={<UnauthorizedRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        <Route element={<AuthorizedRoute />}>
          <Route path="/account" element={<Account />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/recurring" element={<Recurring />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
