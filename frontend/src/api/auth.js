// register, login, logout, forgot/reset password calls
import { apiFetch } from "./index";

// logout
export function logout() {
  return apiFetch("/auth/logout", { method: "POST" });
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

//forgot password
export function forgotPassword(email) {
  return apiFetch("/auth/password-reset/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email }),
  });
}

// reset password - validate password api
export function validateResetToken(token) {
  return apiFetch("/auth/password-reset/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: token }),
  });
}

// confirm password
export function confirmPasswordReset(token, password, confirmPassword) {
  return apiFetch("/auth/password-reset/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: token,
      password: password,
      confirm_password: confirmPassword,
    }),
  });
}
