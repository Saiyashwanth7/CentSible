// expenses list, create calls
import { apiFetch } from "./index";

export function getExpenses(page = 1, pageSize = 20, categoryId = "") {
  let url = "/expense?page=" + page + "&page_size=" + pageSize;
  if (categoryId) {
    url = url + "&category_id=" + categoryId;
  }
  return apiFetch(url);
}

export function createExpense(title, amount, categoryId, date, notes) {
  return apiFetch("/expense", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: title,
      amount: amount,
      category_id: categoryId,
      date: date,
      notes: notes,
    }),
  });
}

export function deleteExpense(expenseId) {
  return apiFetch("/expense/" + expenseId, { method: "DELETE" });
}

export function updateExpense(
  expenseId,
  title,
  amount,
  categoryId,
  date,
  notes,
) {
  return apiFetch("/expense/" + expenseId, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: title,
      amount: amount,
      category_id: categoryId,
      date: date,
      notes: notes,
    }),
  });
}

export async function exportCSV(categoryId) {
  const params = new URLSearchParams();

  if (categoryId) {
    params.set("category_id", categoryId);
  }

  const query = params.toString();
  const url =
    import.meta.env.VITE_API_URL +
    "/expense/export/csv" +
    (query ? `?${query}` : "");

  const response = await fetch(url, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("CSV export failed: " + response.status);
  }

  const blob = await response.blob();

  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = downloadUrl;
  link.download = `expenses-${new Date().toISOString().slice(0, 10)}.csv`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(downloadUrl);
}

export function getDashboard() {
  return apiFetch("/expense/dashboard");
}
