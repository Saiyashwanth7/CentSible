import { apiFetch } from "./index";

export function getCurrentUser() {
  return apiFetch("/user/current");
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
