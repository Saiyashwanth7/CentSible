import { apiFetch } from "./index";

export function uploadReceipt(file) {
  const formData = new FormData();
  formData.append("file", file);
  return apiFetch("/receipts/receipt", { method: "POST", body: formData });
}

export function getReceipt(receiptId) {
  return apiFetch("/receipts/receipt/" + receiptId);
}

export function getAllReceipts(status = null, limit = 20, offset = 0) {
  let url = "";
  if (!status) {
    url = url + "status=" + status + "&";
  }
  return apiFetch(
    "receipts/receipt?" + url + "limit=" + limit + "&offset=" + offset,
  );
}

export function confirmReceipt(
  receiptId,
  title,
  amount,
  categoryId,
  date,
  notes,
) {
  return apiFetch("/receipts/receipt/" + receiptId + "/confirm", {
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

export function getReceiptURLByExpenseId(expenseId) {
  return apiFetch("/receipts/receipt/by-expense/" + expenseId + "/url");
}
