import { useState, useEffect } from "react";
import {
  getExpenses,
  createExpense,
  deleteExpense,
  updateExpense,
  exportCSV,
} from "../../api/expenses";
import { getCategories } from "../../api/categories";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import Mascot from "../../components/Mascot/Mascot";

function DetailRow({ label, value }) {
  return (
    <Box sx={{ py: 1.5 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography sx={{ overflowWrap: "anywhere" }}>{value}</Typography>
    </Box>
  );
}

function ExpenseDetailsDialog({ expense, onClose, onEdit, onDelete }) {
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{expense.title}</DialogTitle>
      <DialogContent>
        <Typography variant="h3" sx={{ mb: 1 }}>
          {"₹" + Number(expense.amount).toLocaleString("en-IN")}
        </Typography>
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
      <DialogActions>
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
  // These below useEffect functions get triggered by the react app instead of any interactive UI tools
  useEffect(() => {
    getExpenses(1, 20, categoryId)
      .then((data) => setExpenses(data.items))
      .catch(() => setErr("Could not load Expenses"))
      .finally(() => setLoading(false));
  }, [categoryId]);

  useEffect(() => {
    getCategories()
      .then((data) => setCategories(data))
      .catch((error) => console.log("categories error:", error));
  }, []);

  // to reset the expense form after creating the expense or cancelling the update
  function resetForm() {
    setFormOpen(false); // add this line
    setEditingId(null);
    setTitle("");
    setAmount("");
    setFormCategoryId("");
    setDate("");
    setNotes("");
    setFormErr("");
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
      const result = await getExpenses(1, 20, categoryId);
      setExpenses(result.items);
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
    setFormOpen(true); // add this line
    setEditingId(exp.id);
    setTitle(exp.title);
    setAmount(exp.amount);
    setFormCategoryId(exp.category.id);
    setDate(exp.date);
    setNotes(exp.notes);
  }

  // for deleting an expense
  async function handleDelete(expenseId) {
    try {
      await deleteExpense(expenseId);
      const result = await getExpenses(1, 20, categoryId);
      setExpenses(result.items);
      setDelErr("");
    } catch (error) {
      setDelErr("Error occurred while deleting, please try again later");
      console.log(error);
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

  // to deal with the request and response time
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 760, mx: "auto", mt: 4, px: 2, pb: 6 }}>
      <Typography variant="h3" sx={{ mb: 1 }}>
        Expenses
      </Typography>
      <Box sx={{ mb: 3 }}>
        <Mascot mood="focused" size={48} message="Ready when you are." />
      </Box>

      {/* Title on the left, filter and buttons on the right */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
          mb: 2,
        }}
      >
        <Typography variant="h5">Your expenses</Typography>
        <Stack
          direction="row"
          sx={{ gap: 1, alignItems: "center", flexWrap: "wrap" }}
        >
          <TextField
            select
            size="small"
            label="Category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">All categories</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="outlined" onClick={handleExport}>
            Export CSV
          </Button>
          <Button variant="contained" onClick={() => setFormOpen(true)}>
            Add expense
          </Button>
        </Stack>
      </Box>

      {err && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {err}
        </Alert>
      )}
      {exportErr && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {exportErr}
        </Alert>
      )}
      {delErr && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {delErr}
        </Alert>
      )}

      {!err && expenses.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: "center", py: 5 }}>
            <Typography>No expenses yet.</Typography>
            <Typography variant="body2" color="text.secondary">
              Tap "Add expense" to log your first one.
            </Typography>
          </CardContent>
        </Card>
      )}

      {expenses.length > 0 && (
        <Card>
          {expenses.map((exp, i) => (
            <Box key={exp.id}>
              {i > 0 && <Divider />}
              <Box
                onClick={() => setSelected(exp)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  px: 3,
                  py: 2,
                  cursor: "pointer",
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600 }} noWrap>
                    {exp.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {exp.date}
                    {exp.category?.name ? " · " + exp.category.name : ""}
                  </Typography>
                </Box>
                <Typography sx={{ fontWeight: 700 }}>
                  {"₹" + Number(exp.amount).toLocaleString("en-IN")}
                </Typography>
                <Button
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(exp);
                  }}
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(exp.id);
                  }}
                >
                  Delete
                </Button>
              </Box>
            </Box>
          ))}
        </Card>
      )}

      {/* Add / edit dialog */}
      <Dialog open={formOpen} onClose={resetForm} fullWidth maxWidth="sm">
        <DialogTitle>{editingId ? "Edit expense" : "Add expense"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Box
              sx={{
                display: "grid",
                gap: 2,
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
            {formErr && <Alert severity="error">{formErr}</Alert>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetForm} disabled={formSubmit}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={formSubmit}
          >
            {formSubmit
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
        />
      )}
    </Box>
  );
}

export default Expenses;
