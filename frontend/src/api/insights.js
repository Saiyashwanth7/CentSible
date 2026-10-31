import { apiFetch } from "./index";

export function getTrends(months = 6) {
  return apiFetch("/insights/trends?months=" + months);
}
