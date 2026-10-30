import {
  getRecurringList,
  updateRecurring,
  deleteRecurring,
} from "../../api/recurring";
import { useState, useEffect } from "react";
import { Typography, Box, Button } from "@mui/material";
import RecurringForm from "./RecurringForm";

function Recurring() {
  const [loading, setLoading] = useState(true);
  const [recurring, setRecurring] = useState([]);
  const [err, setErr] = useState("");
  const [toggleErr, setToggleErr] = useState("");
  const [delErr, setDelErr] = useState("");

  async function loadRecurring() {
    try {
      const data = await getRecurringList();
      setRecurring(data);
    } catch (error) {
      setErr("Something went wrong while loading recurring expenses");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecurring();
  }, []);

  async function handleToggle(r) {
    try {
      await updateRecurring(r.id, { active: !r.active });
      await loadRecurring();
      setToggleErr("");
      setErr("");
    } catch (error) {
      setToggleErr("Something went worng, please try again later");
    }
  }

  async function handleDelete(r) {
    try {
      await deleteRecurring(r.id);
      await loadRecurring();
      setErr("");
      setDelErr("");
    } catch (error) {
      setDelErr("Couldn't delete this now, please try again later");
    }
  }

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", mt: 4 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Recurring expenses
      </Typography>
      {err && <Typography color="error">{err}</Typography>}
      {!err && recurring.length === 0 && (
        <Typography>No recurring expenses yet</Typography>
      )}
      <RecurringForm onCreated={loadRecurring} />
      {toggleErr && <Typography color="error">{toggleErr}</Typography>}
      {delErr && <Typography color="error">{delErr}</Typography>}
      {recurring.map((r) => (
        <Box key={r.id} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography>
            {r.title} - {r.amount} - {r.frequency} - next: {r.next_date} -{" "}
            {r.active ? "Active" : "Paused"}
          </Typography>
          <Button onClick={() => handleToggle(r)}>
            {r.active ? "Pause" : "Resume"}
          </Button>
          <Button color="error" onClick={() => handleDelete(r)}>
            Delete
          </Button>
        </Box>
      ))}
    </Box>
  );
}

export default Recurring;
