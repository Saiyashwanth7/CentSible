import { createRecurring } from "../../api/recurring";
import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { getCategories } from "../../api/categories";

function RecurringForm({ open, onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [notes, setNotes] = useState("");
  const [startDate, setStartDate] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [categories, setCategories] = useState([]);
  const [err, setErr] = useState("");
  const [catErr, setCatErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getCategories()
      .then((data) => setCategories(data))
      .catch(() => {
        setCatErr("Could not import category list, please try again later");
      });
  }, []);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await createRecurring(
        title,
        Number(amount),
        categoryId,
        notes,
        frequency,
        startDate,
      );
      setErr("");
      setTitle("");
      setAmount("");
      setCategoryId("");
      setNotes("");
      setFrequency("monthly");
      setStartDate("");
      await onCreated();
      onClose(); // close the dialog after a successful save
    } catch (error) {
      setErr(
        "An error occurred while creating or refreshing recurring expenses",
      );
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Add recurring expense</DialogTitle>
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
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
            >
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
            </TextField>

            <DatePicker
              label="Start date"
              value={startDate ? dayjs(startDate) : null}
              onChange={(v) =>
                setStartDate(v && v.isValid() ? v.format("YYYY-MM-DD") : "")
              }
              format="DD/MM/YYYY"
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Box>
          <TextField
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          {err && <Alert severity="error">{err}</Alert>}
          {catErr && <Alert severity="error">{catErr}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Adding..." : "Add"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default RecurringForm;
