import {
  getRecurringList,
  updateRecurring,
  deleteRecurring,
} from "../../api/recurring";
import { useState, useEffect } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Typography,
} from "@mui/material";
import RecurringForm from "./RecurringForm";
import Mascot from "../../components/Mascot/Mascot";

function Recurring() {
  const [loading, setLoading] = useState(true);
  const [recurring, setRecurring] = useState([]);
  const [err, setErr] = useState("");
  const [toggleErr, setToggleErr] = useState("");
  const [delErr, setDelErr] = useState("");
  const [formOpen, setFormOpen] = useState(false);
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
        Recurring expenses
      </Typography>
      <Box sx={{ mb: 3 }}>
        <Mascot
          mood="sleepy"
          size={56}
          message="I'll remind you. Go take a nap."
        />
      </Box>

      {/* Title on the left, Add button on the right */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Typography variant="h5">Your schedule</Typography>
        <Button variant="contained" onClick={() => setFormOpen(true)}>
          Add recurring
        </Button>
      </Box>

      {err && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {err}
        </Alert>
      )}
      {toggleErr && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {toggleErr}
        </Alert>
      )}
      {delErr && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {delErr}
        </Alert>
      )}

      {!err && recurring.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: "center", py: 5 }}>
            <Typography>No recurring expenses yet.</Typography>
            <Typography variant="body2" color="text.secondary">
              Add rent or a subscription and it runs on its own.
            </Typography>
          </CardContent>
        </Card>
      )}

      {recurring.length > 0 && (
        <Card>
          {recurring.map((r, i) => (
            <Box key={r.id}>
              {i > 0 && <Divider />}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  px: 3,
                  py: 2,
                  flexWrap: "wrap",
                }}
              >
                <Box sx={{ flex: 1, minWidth: 160 }}>
                  <Typography sx={{ fontWeight: 600 }}>{r.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {r.frequency} · next: {r.next_date}
                  </Typography>
                </Box>
                <Typography sx={{ fontWeight: 700 }}>
                  {"₹" + Number(r.amount).toLocaleString("en-IN")}
                </Typography>
                <Chip
                  size="small"
                  label={r.active ? "Active" : "Paused"}
                  color={r.active ? "primary" : "default"}
                  variant={r.active ? "filled" : "outlined"}
                />
                <Button size="small" onClick={() => handleToggle(r)}>
                  {r.active ? "Pause" : "Resume"}
                </Button>
                <Button
                  size="small"
                  color="error"
                  onClick={() => handleDelete(r)}
                >
                  Delete
                </Button>
              </Box>
            </Box>
          ))}
        </Card>
      )}

      <RecurringForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onCreated={loadRecurring}
      />
    </Box>
  );
}

export default Recurring;
