import { apiFetch } from "./index";

export function getRecurringList() {
  return apiFetch("/recurring");
}

// {
//   "title": "string",
//   "amount": 1,
//   "category_id": 0,
//   "notes": "",
//   "frequency": "daily",
//   "start_date": "2026-10-22"
// }
export function createRecurring(
  title,
  amount,
  categoryId,
  notes,
  frequency,
  startDate,
) {
  return apiFetch("/recurring", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: title,
      amount: amount,
      category_id: categoryId,
      notes: notes,
      frequency: frequency,
      start_date: startDate,
    }),
  });
}
// PATCH doesn't need a full request body like a PUT.
export function updateRecurring(recurringId, changes) {
  return apiFetch("/recurring/" + recurringId, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(changes),
  });
}

export function deleteRecurring(recurringId) {
  return apiFetch("/recurring/" + recurringId, { method: "DELETE" });
}
