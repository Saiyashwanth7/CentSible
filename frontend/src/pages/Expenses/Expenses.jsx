import { useState, useEffect } from "react";
import {
  getExpenses,
  createExpense,
  deleteExpense,
  updateExpense,
  exportCSV,
} from "../../api/expenses";
import { getCategories } from "../../api/categories";
import { Box, Typography, TextField, MenuItem, Button } from "@mui/material";

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
  if (loading) return <Typography>Loading...</Typography>;

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", mt: 4 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Expenses
      </Typography>

      <TextField
        select
        label="Category"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        sx={{ mb: 2, minWidth: 200 }}
      >
        {categories.map((c) => (
          <MenuItem key={c.id} value={c.id}>
            {c.name}
          </MenuItem>
        ))}
        <MenuItem value="">All categories</MenuItem>
      </TextField>

      {err && <Typography color="error">{err}</Typography>}

      <Button variant="outlined" onClick={handleExport} sx={{ ml: 2, mt: 1 }}>
        Export CSV
      </Button>
      {exportErr && <Typography color="error">{exportErr}</Typography>}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 4 }}>
        <Typography variant="h6">
          {editingId ? "Edit expense" : "Add expense"}
        </Typography>

        <TextField
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
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
        <TextField
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {formErr && <Typography color="error">{formErr}</Typography>}

        <Button variant="contained" onClick={handleSubmit}>
          {editingId ? "Update" : "Add"}
        </Button>
        {editingId && <Button onClick={resetForm}>Cancel</Button>}
      </Box>

      {delErr && <Typography color="error">{delErr}</Typography>}

      {!err && expenses.length === 0 && (
        <Typography>No expenses yet</Typography>
      )}

      {expenses.map((exp) => (
        <Box
          key={exp.id}
          sx={{ display: "flex", alignItems: "center", gap: 2 }}
        >
          <Typography>
            {exp.date} - {exp.title} - {exp.amount}
          </Typography>
          <Button color="error" onClick={() => handleDelete(exp.id)}>
            Delete
          </Button>
          <Button onClick={() => handleEdit(exp)}>Edit</Button>
        </Box>
      ))}
    </Box>
  );
}

export default Expenses;
