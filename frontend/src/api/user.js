import { apiFetch } from "./index";

export function getCurrentUser() {
  return apiFetch("/user/current");
}

export function updateProfile(name) {
  return apiFetch("/user/update", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}
export async function changePassword(
  currentPassword,
  newPassword,
  confirmPassword,
) {
  return apiFetch("/user/password", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      current_password: currentPassword,
      password: newPassword,
      confirm_password: confirmPassword,
    }),
  });
}
export async function deleteAccount() {
  return apiFetch("/user/delete", { method: "DELETE" });
}

// register
export function register(name, email, password, confirmPassword) {
  return apiFetch("/user/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: name,
      email: email,
      password: password,
      confirm_password: confirmPassword,
    }),
  });
}
