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
  IconButton,
  Pagination,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import PauseCircleOutlinedIcon from "@mui/icons-material/PauseCircleOutlined";
import PlayCircleOutlinedIcon from "@mui/icons-material/PlayCircleOutlined";
import RecurringForm from "./RecurringForm";
import Mascot from "../../components/Mascot/Mascot";

const PAGE_SIZE = 10; // rows per page

// same small label look as the Expenses page
const chipSx = { height: 22, fontSize: 12, borderRadius: 1.5 };

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
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.25 }}>
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
      <DialogTitle sx={{ pb: 0.5 }}>{item.title}</DialogTitle>
      <DialogContent>
        <Typography variant="h3" sx={{ mt: 1, mb: 1.5 }}>
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
      <DialogActions sx={{ px: 3, pb: 2 }}>
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

function DeleteConfirmDialog({ item, onClose, onConfirm }) {
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{"Delete " + item.title + "?"}</DialogTitle>
      <DialogContent>
        <Typography>
          This will delete the recurring schedule. Do you also want to delete
          all the expenses it created so far, including past months?
        </Typography>
      </DialogContent>
      <DialogActions sx={{ flexWrap: "wrap", gap: 1, px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={() => onConfirm(false)}>Delete schedule only</Button>
        <Button
          color="error"
          variant="contained"
          onClick={() => onConfirm(true)}
        >
          Delete schedule and its expenses
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
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Live item for the dialog (not a snapshot), so status updates while it's open
  const selected = recurring.find((r) => r.id === selectedId) || null;

  // Pagination, worked out from the full list on every render.
  // safePage keeps the page valid, so deleting the last row of the last page
  // steps back automatically and never leaves an empty page.
  const totalPages = Math.max(1, Math.ceil(recurring.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleItems = recurring.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

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

  async function handleDelete(r, deleteExpenses) {
    if (pending[r.id]) return;
    setBusy(r.id, "delete");
    try {
      await deleteRecurring(r.id, deleteExpenses);
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

  const hasMessages = err || toggleErr || delErr;

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", mt: 4, px: { xs: 2, sm: 3 }, pb: 8 }}>
      <Typography variant="h3" sx={{ mb: 1.5 }}>
        Recurring expenses
      </Typography>
      <Box sx={{ mb: 4 }}>
        <Mascot
          mood="sleepy"
          size={56}
          message="I'll remind you. Go take a nap."
        />
      </Box>

      {/* Add button on the right */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          mb: 3,
        }}
      >
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

      {hasMessages && (
        <Stack sx={{ gap: 1.5, mb: 3 }}>
          {err && <Alert severity="error">{err}</Alert>}
          {toggleErr && <Alert severity="error">{toggleErr}</Alert>}
          {delErr && <Alert severity="error">{delErr}</Alert>}
        </Stack>
      )}

      {!err && recurring.length === 0 && (
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent sx={{ textAlign: "center", py: 6 }}>
            <Typography sx={{ mb: 0.5 }}>No recurring expenses yet.</Typography>
            <Typography variant="body2" color="text.secondary">
              Add rent or a subscription and it runs on its own.
            </Typography>
          </CardContent>
        </Card>
      )}

      {recurring.length > 0 && (
        <Card variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
          {visibleItems.map((r, i) => {
            const action = pending[r.id]; // undefined | "toggle" | "delete"
            const isDeleting = action === "delete";
            const isToggling = action === "toggle";
            const isBusy = Boolean(action);

            // while toggling, r.active is already the new value
            const toggleTitle = isToggling
              ? r.active
                ? "Resuming..."
                : "Pausing..."
              : r.active
                ? "Pause"
                : "Resume";

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
                      {r.title}
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
                        {capitalize(r.frequency)} · next: {r.next_date}
                      </Typography>
                      <Chip
                        size="small"
                        label={r.active ? "Active" : "Paused"}
                        color={r.active ? "primary" : "default"}
                        variant={r.active ? "filled" : "outlined"}
                        sx={chipSx}
                      />
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
                      {formatMoney(r.amount)}
                    </Typography>
                    <Stack direction="row" sx={{ gap: 0.5 }}>
                      <Tooltip title={toggleTitle}>
                        <span>
                          <IconButton
                            size="small"
                            aria-label={r.active ? "Pause" : "Resume"}
                            disabled={isBusy}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggle(r);
                            }}
                          >
                            {isToggling ? (
                              <CircularProgress size={18} color="inherit" />
                            ) : r.active ? (
                              <PauseCircleOutlinedIcon fontSize="small" />
                            ) : (
                              <PlayCircleOutlinedIcon fontSize="small" />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title={isDeleting ? "Deleting..." : "Delete"}>
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            aria-label="Delete recurring expense"
                            disabled={isBusy}
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(r);
                              //handleDelete(r);
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

      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination
            count={totalPages}
            page={safePage}
            onChange={(_, p) => setPage(p)}
          />
        </Box>
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
            setDeleteTarget(selected);
            setSelectedId(null);
          }}
        />
      )}
      {/* Delete confirm dialog, only rendered while a delete is waiting for confirmation */}
      {deleteTarget && (
        <DeleteConfirmDialog
          item={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={(deleteExpenses) => {
            handleDelete(deleteTarget, deleteExpenses);
            setDeleteTarget(null);
          }}
        />
      )}
    </Box>
  );
}

export default Recurring;
