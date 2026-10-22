import { createRecurring } from "../../api/recurring";
import { useEffect, useState } from "react";
import { Typography, Box, TextField, MenuItem, Button } from "@mui/material";
import { getCategories } from "../../api/categories";

function RecurringForm({ onCreated }) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [notes, setNotes] = useState("");
  const [startDate, setStartDate] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [categories, setCategories] = useState([]);
  const [err, setErr] = useState("");
  const [catErr, setCatErr] = useState("");
  useEffect(() => {
    getCategories()
      .then((data) => setCategories(data))
      .catch(() => {
        setCatErr("Could not import category list, please try again later");
      });
  }, []);
  async function handleSubmit() {
    try {
      await createRecurring(
        title,
        amount,
        categoryId,
        notes,
        frequency,
        startDate,
      );
      setErr("");
      await onCreated();
    } catch (error) {
      setErr(
        "An error occurred while creating or refreshing recurring expenses",
      );
      console.error(error);
    }
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 4 }}>
      <Typography variant="h6">Add recurring expense</Typography>

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
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        sx={{ mb: 2, minWidth: 200 }}
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

      <TextField
        label="Start date"
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        slotProps={{ inputLabel: { shrink: true } }}
      />

      <TextField
        label="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      {err && <Typography color="error">{err}</Typography>}
      {catErr && <Typography color="error">{catErr}</Typography>}
      <Button variant="contained" onClick={handleSubmit}>
        Add
      </Button>
    </Box>
  );
}

export default RecurringForm;
