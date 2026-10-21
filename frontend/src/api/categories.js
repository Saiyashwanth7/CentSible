import { apiFetch } from "./index";

export function getCategories() {
  return apiFetch("/category");
}
