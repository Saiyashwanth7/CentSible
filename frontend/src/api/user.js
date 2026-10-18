import { apiFetch } from "./index";

export function getCurrentUser() {
  return apiFetch("/user/current");
}
