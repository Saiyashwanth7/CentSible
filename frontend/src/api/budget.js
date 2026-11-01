import { apiFetch } from "./index";

export function getBudgets() {
  return apiFetch("/budget");
}

export function upsertBudget(categoryId, monthlyLimit) {
  return apiFetch("/budget", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      category_id: categoryId,
      monthly_limit: monthlyLimit,
    }),
  });
}

export function deleteBudget(budgetId) {
  return apiFetch("/budget/" + budgetId, { method: "DELETE" });
}
