import { getRecurringList } from "../../api/recurring";
import { useState, useEffect } from "react";
import { Typography, Box } from "@mui/material";
import RecurringForm from "./RecurringForm";

function Recurring() {
  const [loading, setLoading] = useState(true);
  const [recurring, setRecurring] = useState([]);
  const [err, setErr] = useState("");

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
      {recurring.map((r) => (
        <Typography key={r.id}>
          {r.title} - {r.amount} - {r.frequency} - next: {r.next_date} -{" "}
          {r.active ? "Active" : "Paused"}
        </Typography>
      ))}
    </Box>
  );
}

export default Recurring;
