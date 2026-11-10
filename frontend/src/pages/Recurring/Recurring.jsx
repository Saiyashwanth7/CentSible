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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Typography,
} from "@mui/material";
import RecurringForm from "./RecurringForm";
import Mascot from "../../components/Mascot/Mascot";

function formatMoney(value) {
  return "₹" + Number(value || 0).toLocaleString("en-IN");
}

function capitalize(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
}

// The category may come as an object ({ name }) or as plain text
function categoryName(r) {
  if (!r.category) return "None";
  return typeof r.category === "string" ? r.category : r.category.name;
}

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

function RecurringDetailsDialog({ item, action, onClose, onToggle, onDelete }) {
  const busy = Boolean(action);
  const isToggling = action === "toggle";
  const isDeleting = action === "delete";

  // item.active is already the optimistic (new) value while the request is pending,
  // so active = true means we are resuming, active = false means we are pausing
  const toggleLabel = isToggling
    ? item.active
      ? "Resuming..."
      : "Pausing..."
    : item.active
      ? "Pause"
      : "Resume";

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{item.title}</DialogTitle>
      <DialogContent>
        <Typography variant="h3" sx={{ mb: 1 }}>
          {formatMoney(item.amount)}
        </Typography>
        <Divider />
        <DetailRow label="Repeats" value={capitalize(item.frequency)} />
        <Divider />
        <DetailRow label="Next charge" value={item.next_date} />
        <Divider />
        <DetailRow label="Category" value={categoryName(item)} />
        <Divider />
        <DetailRow label="Status" value={item.active ? "Active" : "Paused"} />
        <Divider />
        <DetailRow label="Notes" value={item.notes || "No notes"} />
      </DialogContent>
      <DialogActions>
        <Button color="error" disabled={busy} onClick={onDelete}>
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" disabled={busy} onClick={onToggle}>
          {toggleLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function Recurring() {
  const [loading, setLoading] = useState(true);
  const [recurring, setRecurring] = useState([]);
  const [err, setErr] = useState("");
  const [toggleErr, setToggleErr] = useState("");
  const [delErr, setDelErr] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null); // id of the item shown in the details dialog
  const [pending, setPending] = useState({}); // { [id]: "toggle" | "delete" }

  // Live item for the dialog (not a snapshot), so status updates while it's open
  const selected = recurring.find((r) => r.id === selectedId) || null;

  function setBusy(id, action) {
    setPending((p) => ({ ...p, [id]: action }));
  }

  function clearBusy(id) {
    setPending((p) => {
      const { [id]: _removed, ...rest } = p;
      return rest;
    });
  }

  async function loadRecurring() {
    try {
      const data = await getRecurringList();
      setRecurring(data);
      setErr(""); // clear the load error only when the load succeeds
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
    if (pending[r.id]) return; // guard against double clicks on the same row
    const prevActive = r.active;
    setBusy(r.id, "toggle");

    // Optimistic update: UI changes immediately
    setRecurring((list) =>
      list.map((x) => (x.id === r.id ? { ...x, active: !prevActive } : x)),
    );

    try {
      const updated = await updateRecurring(r.id, { active: !prevActive });
      // If the backend returns the updated item (e.g. recalculated next_date), merge it
      if (updated && typeof updated === "object" && updated.id === r.id) {
        setRecurring((list) =>
          list.map((x) => (x.id === r.id ? { ...x, ...updated } : x)),
        );
      }
      setToggleErr("");
    } catch (error) {
      // Roll back on failure
      setRecurring((list) =>
        list.map((x) => (x.id === r.id ? { ...x, active: prevActive } : x)),
      );
      setToggleErr("Something went wrong, please try again later");
      console.error(error);
    } finally {
      clearBusy(r.id);
    }
  }

  async function handleDelete(r) {
    if (pending[r.id]) return;
    setBusy(r.id, "delete");
    try {
      await deleteRecurring(r.id);
      setDelErr("");
      // Remove locally instead of refetching
      setRecurring((list) => list.filter((x) => x.id !== r.id));
    } catch (error) {
      setDelErr("Couldn't delete this now, please try again later");
      console.error(error);
    } finally {
      clearBusy(r.id);
    }
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
        <Button
          variant="contained"
          onClick={(e) => {
            e.currentTarget.blur();
            setFormOpen(true);
          }}
        >
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
          {recurring.map((r, i) => {
            const action = pending[r.id]; // undefined | "toggle" | "delete"
            const isDeleting = action === "delete";
            const isToggling = action === "toggle";
            const isBusy = Boolean(action);

            return (
              <Box key={r.id}>
                {i > 0 && <Divider />}
                <Box
                  onClick={() => {
                    if (isDeleting) return;
                    setSelectedId(r.id);
                  }}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    px: 3,
                    py: 2,
                    flexWrap: "wrap",
                    opacity: isDeleting ? 0.5 : 1,
                    cursor: isDeleting ? "default" : "pointer",
                    "&:hover": {
                      bgcolor: isDeleting ? "transparent" : "action.hover",
                    },
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 160 }}>
                    <Typography sx={{ fontWeight: 600 }}>{r.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {capitalize(r.frequency)} · next: {r.next_date}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 700 }}>
                    {formatMoney(r.amount)}
                  </Typography>
                  <Chip
                    size="small"
                    label={r.active ? "Active" : "Paused"}
                    color={r.active ? "primary" : "default"}
                    variant={r.active ? "filled" : "outlined"}
                  />

                  <Button
                    size="small"
                    disabled={isBusy}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(r);
                    }}
                  >
                    {isToggling
                      ? r.active
                        ? "Resuming..."
                        : "Pausing..."
                      : r.active
                        ? "Pause"
                        : "Resume"}
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    disabled={isBusy}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(r);
                    }}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>
                </Box>
              </Box>
            );
          })}
        </Card>
      )}

      <RecurringForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onCreated={loadRecurring}
      />

      {/* Details dialog, only rendered while an item is selected */}
      {selected && (
        <RecurringDetailsDialog
          item={selected}
          action={pending[selected.id]}
          onClose={() => setSelectedId(null)}
          onToggle={() => handleToggle(selected)} // dialog open ne untundhi, status live ga marutundhi
          onDelete={() => {
            handleDelete(selected);
            setSelectedId(null);
          }}
        />
      )}
    </Box>
  );
}

export default Recurring;
