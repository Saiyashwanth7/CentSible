import { useState, useEffect, useRef } from "react";
import {
  getExpenses,
  createExpense,
  deleteExpense,
  updateExpense,
  exportCSV,
} from "../../api/expenses";
import {
  getReceipt,
  uploadReceipt,
  confirmReceipt,
  getReceiptURLByExpenseId,
} from "../../api/receipts";
import { getCategories } from "../../api/categories";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  MenuItem,
  Pagination,
  Stack,
  TextField,
  Tooltip,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import Mascot from "../../components/Mascot/Mascot";

const RECEIPT_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_RECEIPT_SIZE = 5 * 1024 * 1024; // 5 MB, same as the backend
const POLL_INTERVAL_MS = 2000;
const POLL_MAX_TRIES = 60; // 60 x 2 sec = 2 minutes

// one look for the small labels, so they match everywhere
const chipSx = { height: 22, fontSize: 12, borderRadius: 1.5 };

function DetailRow({ label, value }) {
  return (
    <Box sx={{ py: 1.5 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.25 }}>
        {label}
      </Typography>
      <Typography sx={{ overflowWrap: "anywhere" }}>{value}</Typography>
    </Box>
  );
}

// Shows the receipt photo of one expense. It loads the link as soon as it opens,
// and the link is short lived, so it is never stored anywhere.
function ReceiptDialog({ expenseId, onClose }) {
  const [url, setUrl] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr("");
    getReceiptURLByExpenseId(expenseId)
      .then((data) => {
        if (!cancelled) setUrl(data.url);
      })
      .catch((error) => {
        if (!cancelled) setErr(error.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [expenseId]);

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Receipt</DialogTitle>
      <DialogContent>
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        )}
        {err && <Alert severity="error">{err}</Alert>}
        {url && (
          <Box
            component="img"
            src={url}
            alt="Receipt"
            sx={{
              width: "100%",
              maxHeight: "70vh",
              objectFit: "contain",
              borderRadius: 1,
              display: "block",
              bgcolor: "action.hover",
            }}
          />
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

function ExpenseDetailsDialog({
  expense,
  onClose,
  onEdit,
  onDelete,
  onViewReceipt,
}) {
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ pb: 0.5 }}>{expense.title}</DialogTitle>
      <DialogContent>
        <Typography variant="h3" sx={{ mt: 1, mb: 1.5 }}>
          {"₹" + Number(expense.amount).toLocaleString("en-IN")}
        </Typography>

        {(expense.recurring_id || expense.receipt_key) && (
          <Stack
            direction="row"
            sx={{ gap: 1, mb: 1.5, flexWrap: "wrap", alignItems: "center" }}
          >
            {expense.recurring_id && (
              <Chip
                size="small"
                variant="outlined"
                label="Recurring"
                sx={chipSx}
              />
            )}
            {expense.receipt_key && (
              <Button size="small" onClick={onViewReceipt}>
                View receipt
              </Button>
            )}
          </Stack>
        )}

        <Divider />
        <DetailRow label="Category" value={expense.category?.name || "None"} />
        <Divider />
        <DetailRow label="Date" value={expense.date} />
        <Divider />
        <DetailRow label="Notes" value={expense.notes || "No notes"} />
        {/* Only shown if your API sends created_at */}
        {expense.created_at && (
          <>
            <Divider />
            <DetailRow
              label="Added on"
              value={new Date(expense.created_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            />
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="error" onClick={onDelete}>
          Delete
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" onClick={onEdit}>
          Edit
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function Expenses() {
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [err, setErr] = useState("");
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState(""); // for filtering the list
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [formCategoryId, setFormCategoryId] = useState(""); // for the form
  const [formErr, setFormErr] = useState("");
  const [formSubmit, setFormSubmit] = useState(false);
  const [delErr, setDelErr] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [exportErr, setExportErr] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [pending, setPending] = useState({}); // { [id]: "delete" } -> drives the UI
  const pendingRef = useRef({}); // same data, always up to date inside async functions
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0); // bump this to reload the current page
  const [pageLoading, setPageLoading] = useState(false);

  // receipt scanning
  const [scanning, setScanning] = useState(false); // uploading and reading the receipt
  const [scanErr, setScanErr] = useState("");
  const [receiptId, setReceiptId] = useState(null); // set while the form is in "review receipt" mode
  const [confirm, setConfirm] = useState(false); // saving the reviewed receipt
  const [confirmErr, setConfirmErr] = useState("");
  const fileInputRef = useRef(null);

  // the expense whose receipt photo is open
  const [receiptExpenseId, setReceiptExpenseId] = useState(null);

  // Loads the list again whenever the filter, the page or refreshKey changes.
  // The cancelled flag stops an older, slower response from overwriting a newer one.
  useEffect(() => {
    let cancelled = false;
    setPageLoading(true);
    getExpenses(page, 20, categoryId)
      .then((data) => {
        if (cancelled) return;
        setExpenses(data.items.filter((x) => !pendingRef.current[x.id]));
        setTotalPages(Math.max(1, Math.ceil(data.total / 20)));
        setErr("");
      })
      .catch(() => {
        if (!cancelled) setErr("Could not load Expenses");
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setPageLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [categoryId, page, refreshKey]);

  useEffect(() => {
    getCategories()
      .then((data) => setCategories(data))
      .catch((error) => console.log("categories error:", error));
  }, []);

  function setBusy(id, action) {
    pendingRef.current = { ...pendingRef.current, [id]: action };
    setPending((p) => ({ ...p, [id]: action }));
  }

  function clearBusy(id) {
    const { [id]: _removedRef, ...restRef } = pendingRef.current;
    pendingRef.current = restRef;
    setPending((p) => {
      const { [id]: _removed, ...rest } = p;
      return rest;
    });
  }

  // to reset the expense form after creating the expense or cancelling the update
  function resetForm() {
    setFormOpen(false);
    setEditingId(null);
    setReceiptId(null);
    setTitle("");
    setAmount("");
    setFormCategoryId("");
    setDate("");
    setNotes("");
    setFormErr("");
    setConfirmErr("");
    setFormSubmit(false);
  }

  // for creating and updating an expense
  async function handleSubmit() {
    setFormSubmit(true);
    try {
      if (editingId) {
        await updateExpense(
          editingId,
          title,
          Number(amount),
          formCategoryId,
          date,
          notes,
        );
      } else {
        await createExpense(title, Number(amount), formCategoryId, date, notes);
      }
      // reload the current page and the page count through the effect
      setRefreshKey((k) => k + 1);
      resetForm();
    } catch (error) {
      console.log(error);
      setFormErr("Something went wrong while saving the expense");
    } finally {
      setFormSubmit(false);
    }
  }

  // This just sets the form with the expense details of exp.id, doesn't let users submit or do anything
  function handleEdit(exp) {
    setFormOpen(true);
    setEditingId(exp.id);
    setTitle(exp.title);
    setAmount(exp.amount);
    setFormCategoryId(exp.category?.id ?? ""); // category can be missing
    setDate(exp.date);
    setNotes(exp.notes ?? "");
    setFormErr("");
  }

  // for deleting an expense
  async function handleDelete(expenseId) {
    if (pendingRef.current[expenseId]) return; // same row double click guard
    setBusy(expenseId, "delete");
    try {
      await deleteExpense(expenseId);
      setDelErr("");
      // remove locally for instant feedback
      setExpenses((list) => list.filter((x) => x.id !== expenseId));
      if (expenses.length === 1 && page > 1) {
        setPage(page - 1); // that was the last row on this page, step back
      } else {
        setRefreshKey((k) => k + 1); // pull in the next row and fix the page count
      }
    } catch (error) {
      setDelErr("Error occurred while deleting, please try again later");
      console.log(error);
    } finally {
      clearBusy(expenseId);
    }
  }

  async function handleExport() {
    try {
      await exportCSV(categoryId);
      setExportErr("");
    } catch (error) {
      console.log(error);
      setExportErr("Could not export expenses, please try again later");
    }
  }

  // Asks the backend every 2 seconds if the receipt is ready.
  // Returns the receipt when it is ready, throws when it failed or took too long.
  async function pollingReceipts(id) {
    for (let i = 0; i < POLL_MAX_TRIES; i++) {
      const r = await getReceipt(id);
      if (r.status === "ready") return r;
      if (r.status === "failed") {
        throw new Error(r.error_message || "Could not read this receipt");
      }
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
    throw new Error("This is taking too long, please try again later");
  }

  // Fills the form with what the model read, and opens it in "review receipt" mode.
  function openReview(ready) {
    const data = ready.extracted_data ?? {};
    setEditingId(null);
    setTitle(data.title ?? "");
    setAmount(data.amount ?? "");
    setFormCategoryId(data.category_id ?? "");
    setDate(data.date ?? dayjs().format("YYYY-MM-DD")); // the model leaves it empty when unsure
    setNotes("");
    setFormErr("");
    setConfirmErr("");
    setReceiptId(ready.id);
    setFormOpen(true);
  }

  // user picked a receipt photo: check it, upload it, wait for the draft, open the review form
  async function handleReceiptSelected(e) {
    const file = e.target.files[0];
    e.target.value = ""; // so the same file can be picked again
    if (!file) return;

    if (!RECEIPT_TYPES.includes(file.type)) {
      setScanErr("Please choose a JPEG, PNG or WebP image");
      return;
    }
    if (file.size > MAX_RECEIPT_SIZE) {
      setScanErr("Image must be under 5 MB");
      return;
    }

    setScanning(true);
    setScanErr("");
    try {
      const receipt = await uploadReceipt(file);
      const ready = await pollingReceipts(receipt.id);
      openReview(ready);
    } catch (error) {
      setScanErr(error.message);
    } finally {
      setScanning(false);
    }
  }

  // user checked the draft and pressed "Confirm expense"
  async function handleConfirmReceipt(id, title, amount, catId, date, notes) {
    setConfirmErr("");
    setConfirm(true);
    try {
      await confirmReceipt(id, title, Number(amount), catId, date, notes);
      setRefreshKey((k) => k + 1); // show the new expense in the list
      resetForm();
    } catch (error) {
      setConfirmErr(error.message);
    } finally {
      setConfirm(false);
    }
  }

  // to deal with the request and response time
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const hasMessages = err || exportErr || delErr || scanErr || scanning;

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", mt: 4, px: { xs: 2, sm: 3 }, pb: 8 }}>
      <Typography variant="h3" sx={{ mb: 1.5 }}>
        Expenses
      </Typography>
      <Box sx={{ mb: 4 }}>
        <Mascot mood="focused" size={48} message="Ready when you are." />
      </Box>

      {/* Filter on the left, actions on the right. Wraps to two rows on small screens */}
      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "stretch", md: "center" },
          justifyContent: "space-between",
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
          mb: 3,
        }}
      >
        <TextField
          select
          size="small"
          label="Category"
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setPage(1); // a new filter always starts from page 1
          }}
          sx={{ minWidth: { xs: "100%", md: 200 } }}
        >
          <MenuItem value="">All categories</MenuItem>
          {categories.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.name}
            </MenuItem>
          ))}
        </TextField>

        <Stack
          direction="row"
          sx={{ gap: 1.5, alignItems: "center", flexWrap: "wrap" }}
        >
          <Button color="inherit" onClick={handleExport}>
            Export CSV
          </Button>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            ref={fileInputRef}
            onChange={handleReceiptSelected}
          />
          <Button
            variant="outlined"
            disabled={scanning}
            onClick={() => fileInputRef.current.click()}
          >
            {scanning ? "Reading receipt..." : "Scan receipt"}
          </Button>
          <Button
            variant="contained"
            onClick={(e) => {
              e.currentTarget.blur();
              setFormOpen(true);
            }}
          >
            Add expense
          </Button>
        </Stack>
      </Box>

      {hasMessages && (
        <Stack sx={{ gap: 1.5, mb: 3 }}>
          {err && <Alert severity="error">{err}</Alert>}
          {exportErr && <Alert severity="error">{exportErr}</Alert>}
          {delErr && <Alert severity="error">{delErr}</Alert>}
          {scanErr && <Alert severity="error">{scanErr}</Alert>}
          {scanning && (
            <Alert severity="info" icon={<CircularProgress size={18} />}>
              Reading your receipt, this can take up to a minute.
            </Alert>
          )}
        </Stack>
      )}

      {!err && expenses.length === 0 && (
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent sx={{ textAlign: "center", py: 6 }}>
            <Typography sx={{ mb: 0.5 }}>No expenses yet.</Typography>
            <Typography variant="body2" color="text.secondary">
              Tap "Add expense" to log your first one.
            </Typography>
          </CardContent>
        </Card>
      )}

      {expenses.length > 0 && (
        <Card
          variant="outlined"
          sx={{
            borderRadius: 2,
            overflow: "hidden",
            opacity: pageLoading ? 0.6 : 1,
            pointerEvents: pageLoading ? "none" : "auto",
            transition: "opacity 0.2s",
          }}
        >
          {pageLoading && <LinearProgress />}
          {expenses.map((exp, i) => {
            const isDeleting = pending[exp.id] === "delete";

            return (
              <Box key={exp.id}>
                {i > 0 && <Divider />}
                <Box
                  onClick={() => {
                    if (isDeleting) return;
                    setSelected(exp);
                  }}
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    alignItems: { xs: "stretch", sm: "center" },
                    gap: { xs: 1.5, sm: 3 },
                    px: { xs: 2, sm: 3 },
                    py: 2.5,
                    opacity: isDeleting ? 0.5 : 1,
                    cursor: isDeleting ? "default" : "pointer",
                    "&:hover": {
                      bgcolor: isDeleting ? "transparent" : "action.hover",
                    },
                  }}
                >
                  {/* left: what it is */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600 }} noWrap>
                      {exp.title}
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                        columnGap: 1.5,
                        rowGap: 0.75,
                        mt: 0.75,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {exp.date}
                        {exp.category?.name ? " · " + exp.category.name : ""}
                      </Typography>
                      {/* small labels: made by a recurring expense, has a receipt photo */}
                      {exp.recurring_id && (
                        <Chip
                          size="small"
                          variant="outlined"
                          label="Recurring"
                          sx={chipSx}
                        />
                      )}
                      {exp.receipt_key && (
                        <Chip
                          size="small"
                          variant="outlined"
                          color="primary"
                          label="Receipt"
                          sx={chipSx}
                          onClick={(e) => {
                            e.stopPropagation(); // don't open the details dialog too
                            setReceiptExpenseId(exp.id);
                          }}
                        />
                      )}
                    </Box>
                  </Box>

                  {/* right: amount and actions */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: { xs: "space-between", sm: "flex-end" },
                      gap: 2,
                      flexShrink: 0,
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontVariantNumeric: "tabular-nums",
                        minWidth: { sm: 88 },
                        textAlign: { sm: "right" },
                      }}
                    >
                      {"₹" + Number(exp.amount).toLocaleString("en-IN")}
                    </Typography>
                    <Stack direction="row" sx={{ gap: 0.5 }}>
                      <Tooltip title="Edit">
                        <span>
                          <IconButton
                            size="small"
                            aria-label="Edit expense"
                            disabled={isDeleting}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(exp);
                            }}
                          >
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title={isDeleting ? "Deleting..." : "Delete"}>
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            aria-label="Delete expense"
                            disabled={isDeleting}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(exp.id);
                            }}
                          >
                            {isDeleting ? (
                              <CircularProgress size={18} color="inherit" />
                            ) : (
                              <DeleteOutlineIcon fontSize="small" />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Card>
      )}

      {/* Add / edit / review receipt dialog */}
      <Dialog open={formOpen} onClose={resetForm} fullWidth maxWidth="sm">
        <DialogTitle>
          {receiptId
            ? "Review receipt"
            : editingId
              ? "Edit expense"
              : "Add expense"}
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{ display: "flex", flexDirection: "column", gap: 2.5, mt: 1 }}
          >
            {receiptId && (
              <Alert severity="info">
                We filled this in from your receipt. Please check it before
                saving.
              </Alert>
            )}
            <TextField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Box
              sx={{
                display: "grid",
                gap: 2.5,
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              }}
            >
              <TextField
                label="Amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <TextField
                select
                label="Category"
                value={formCategoryId}
                onChange={(e) => setFormCategoryId(e.target.value)}
              >
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
              <DatePicker
                label="Date"
                value={date ? dayjs(date) : null}
                onChange={(v) =>
                  setDate(v && v.isValid() ? v.format("YYYY-MM-DD") : "")
                }
                format="DD/MM/YYYY"
                slotProps={{ textField: { fullWidth: true } }}
              />
              <TextField
                label="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Box>
            {(formErr || confirmErr) && (
              <Alert severity="error">{formErr || confirmErr}</Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={resetForm} disabled={formSubmit || confirm}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={
              receiptId
                ? () =>
                    handleConfirmReceipt(
                      receiptId,
                      title,
                      amount,
                      formCategoryId,
                      date,
                      notes,
                    )
                : handleSubmit
            }
            disabled={formSubmit || confirm}
          >
            {receiptId
              ? confirm
                ? "Saving..."
                : "Confirm expense"
              : formSubmit
                ? editingId
                  ? "Saving..."
                  : "Adding..."
                : editingId
                  ? "Update"
                  : "Add expense"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Details dialog, only rendered while an expense is selected */}
      {selected && (
        <ExpenseDetailsDialog
          expense={selected}
          onClose={() => setSelected(null)}
          onEdit={() => {
            handleEdit(selected);
            setSelected(null);
          }}
          onDelete={() => {
            handleDelete(selected.id);
            setSelected(null);
          }}
          onViewReceipt={() => {
            setReceiptExpenseId(selected.id);
            setSelected(null);
          }}
        />
      )}

      {/* Receipt photo dialog, only rendered while a Receipt chip was clicked */}
      {receiptExpenseId && (
        <ReceiptDialog
          expenseId={receiptExpenseId}
          onClose={() => setReceiptExpenseId(null)}
        />
      )}

      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            disabled={pageLoading}
            onChange={(_, p) => setPage(p)}
          />
        </Box>
      )}
    </Box>
  );
}

export default Expenses;
