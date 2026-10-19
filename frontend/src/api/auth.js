// register, login, logout, forgot/reset password calls
import { apiFetch } from "./index";

// logout
export function logout() {
  return apiFetch("/auth/logout", { method: "POST" });
}

// password reset request

export function requestPasswordReset(email) {
  return apiFetch("/auth/password-reset/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email }),
  });
}

// login
export function login(email, password) {
  const body = new URLSearchParams();
  body.append("username", email);
  body.append("password", password);
  return apiFetch("/auth/login", {
    method: "POST",
    body: body,
  });
}
