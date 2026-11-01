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
  const [delErr, setDelErr] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [exportErr, setExportErr] = useState("");
  const [formOpen, setFormOpen] = useState(false);
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
  }

  // for creating and updating an expense
  async function handleSubmit() {
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
        <Mascot
          mood="focused"
          size={48}
          message={
            editingId ? "Editing, careful now." : "Log it before you forget!"
          }
        />
      </Box>

      <Button variant="outlined" onClick={handleExport}>
        Export CSV
      </Button>
      <Button variant="contained" onClick={() => setFormOpen(true)}>
        Add expense
      </Button>

      {/* List header: title on the left, filter + export on the right */}
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
        <Stack direction="row" sx={{ gap: 1, alignItems: "center" }}>
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
        </Stack>
        <Dialog open={formOpen} onClose={resetForm} fullWidth maxWidth="sm">
          <DialogTitle>
            {editingId ? "Edit expense" : "Add expense"}
          </DialogTitle>
          <DialogContent>
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
            >
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
            <Button onClick={resetForm}>Cancel</Button>
            <Button variant="contained" onClick={handleSubmit}>
              {editingId ? "Update" : "Add expense"}
            </Button>
          </DialogActions>
        </Dialog>
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
            <Typography sx={{ fontSize: 48, lineHeight: 1 }}>😴</Typography>
            <Typography sx={{ mt: 1 }}>No expenses yet.</Typography>
            <Typography variant="body2" color="text.secondary">
              Add your first one above.
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
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  px: 3,
                  py: 2,
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
                <Button size="small" onClick={() => handleEdit(exp)}>
                  Edit
                </Button>
                <Button
                  size="small"
                  color="error"
                  onClick={() => handleDelete(exp.id)}
                >
                  Delete
                </Button>
              </Box>
            </Box>
          ))}
        </Card>
      )}
    </Box>
  );
}

export default Expenses;
