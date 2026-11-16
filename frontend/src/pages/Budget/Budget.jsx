import { getBudgets, upsertBudget, deleteBudget } from "../../api/budget";
import { getCategories } from "../../api/categories";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import { useState, useEffect } from "react";
import Mascot from "../../components/Mascot/Mascot";

// These helpers don't use any state, so they live outside the component
function formatMoney(value) {
  return "₹" + Number(value || 0).toLocaleString("en-IN");
}

// how much of the limit is used, as a whole number (can go above 100)
function usedPercent(bgt) {
  const limit = Number(bgt.monthly_limit);
  return limit > 0 ? Math.round((Number(bgt.spent) / limit) * 100) : 0;
}

// green while safe, orange when close, red when over
function budgetColor(pct) {
  if (pct >= 100) return "error";
  if (pct >= 80) return "warning";
  return "primary";
}

// Picks the cat's mood and line from the budgets
function getBudgetCat(budgets) {
  if (budgets.length === 0) {
    return {
      mood: "focused",
      message: "Set a limit and I'll watch it for you.",
    };
  }

  const over = budgets.filter((b) => Number(b.spent) > Number(b.monthly_limit));
  if (over.length > 0) {
    return {
      mood: "surprised",
      message:
        over.length === 1
          ? over[0].category + " is over budget!"
          : over.length + " budgets are over their limit!",
    };
  }

  const close = budgets.filter((b) => usedPercent(b) >= 80);
  if (close.length > 0) {
    const top = [...close].sort((a, b) => usedPercent(b) - usedPercent(a))[0];
    return {
      mood: "worried",
      message: top.category + " is at " + usedPercent(top) + "% of its limit.",
    };
  }

  return { mood: "happy", message: "All budgets are on track. Nice!" };
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

function BudgetDetailsDialog({ budget, onClose, onEdit, onDelete }) {
  const pct = usedPercent(budget);
  const spent = Number(budget.spent);
  const limit = Number(budget.monthly_limit);
  const over = spent > limit;

  let status = "On track";
  if (over) status = "Over budget";
  else if (pct >= 80) status = "Close to the limit";

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ pb: 0.5 }}>{budget.category}</DialogTitle>
      <DialogContent>
        <Typography variant="h3" sx={{ mt: 1, mb: 0.5 }}>
          {formatMoney(spent)}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2.5 }}>
          {"spent of " + formatMoney(limit) + " this month"}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={Math.min(pct, 100)}
          color={budgetColor(pct)}
          sx={{ height: 12, borderRadius: 999, mb: 1 }}
        />
        <Divider sx={{ mt: 2 }} />
        <DetailRow label="Status" value={status + " (" + pct + "% used)"} />
        <Divider />
        <DetailRow label="Monthly limit" value={formatMoney(limit)} />
        <Divider />
        <DetailRow
          label={over ? "Over by" : "Left this month"}
          value={formatMoney(Math.abs(limit - spent))}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="error" onClick={onDelete}>
          Delete
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" onClick={onEdit}>
          Edit limit
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function Budget() {
  const [loading, setLoading] = useState(true);
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [err, setErr] = useState("");
  const [catErr, setCatErr] = useState("");
  const [delErr, setDelErr] = useState("");
  const [selected, setSelected] = useState(null); // budget shown in the details dialog
  const [pending, setPending] = useState({}); // { [id]: "delete" }

  // form (dialog) state
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formCategoryId, setFormCategoryId] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [formErr, setFormErr] = useState("");
  const [formSubmit, setFormSubmit] = useState(false);

  useEffect(() => {
    getBudgets()
      .then((data) => setBudgets(data))
      .catch(() =>
        setErr("Couldn't load your Budgets list, please try again later"),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    getCategories()
      .then((data) => {
        setCategories(data);
        setCatErr("");
      })
      .catch(() =>
        setCatErr("Couldn't load categories, please try again later"),
      );
  }, []);

  function setBusy(id, action) {
    setPending((p) => ({ ...p, [id]: action }));
  }

  function clearBusy(id) {
    setPending((p) => {
      const { [id]: _removed, ...rest } = p;
      return rest;
    });
  }

  function resetForm() {
    setFormOpen(false);
    setEditingId(null);
    setFormErr("");
    setMonthlyLimit("");
    setFormCategoryId("");
    setFormSubmit(false);
  }

  function handleEdit(bgt) {
    setFormOpen(true);
    setEditingId(bgt.id);
    setFormCategoryId(bgt.category_id);
    setMonthlyLimit(bgt.monthly_limit);
    setFormErr("");
  }

  async function handleSubmit() {
    // validate first, so the form never gets stuck on "Adding..."
    if (!formCategoryId || !monthlyLimit) {
      setFormErr("Choose a category and enter a limit");
      return;
    }
    setFormSubmit(true);
    try {
      await upsertBudget(formCategoryId, Number(monthlyLimit));
      const result = await getBudgets();
      setBudgets(result);
      resetForm();
    } catch (error) {
      setFormErr("Couldn't save your budget, please try again later");
      console.error(error);
    } finally {
      setFormSubmit(false);
    }
  }

  async function handleDelete(bgtId) {
    if (pending[bgtId]) return; // same row double click guard
    setBusy(bgtId, "delete");
    try {
      await deleteBudget(bgtId);
      setDelErr("");
      // refetch kakunda local ga remove
      setBudgets((list) => list.filter((x) => x.id !== bgtId));
    } catch (error) {
      setDelErr("Couldn't delete the budget, please try again later");
      console.error(error);
    } finally {
      clearBusy(bgtId);
    }
  }

  // Categories that don't have a budget yet. Picking one that already has a
  // budget would silently overwrite its limit, because the API upserts.
  const freeCategories = categories.filter(
    (c) => !budgets.some((b) => b.category_id === c.id),
  );

  // Name shown in the Edit dialog title
  const editingName = budgets.find((b) => b.id === editingId)?.category || "";

  const cat = getBudgetCat(budgets);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const hasMessages = err || catErr || delErr;

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", mt: 4, px: { xs: 2, sm: 3 }, pb: 8 }}>
      <Typography variant="h3" sx={{ mb: 1.5 }}>
        Budgets
      </Typography>
      <Box sx={{ mb: 4 }}>
        <Mascot mood={cat.mood} size={56} message={cat.message} />
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
          Add budget
        </Button>
      </Box>

      {hasMessages && (
        <Stack sx={{ gap: 1.5, mb: 3 }}>
          {err && <Alert severity="error">{err}</Alert>}
          {catErr && <Alert severity="error">{catErr}</Alert>}
          {delErr && <Alert severity="error">{delErr}</Alert>}
        </Stack>
      )}

      {!err && budgets.length === 0 && (
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent sx={{ textAlign: "center", py: 6 }}>
            <Typography sx={{ mb: 0.5 }}>No budgets yet.</Typography>
            <Typography variant="body2" color="text.secondary">
              Tap "Add budget" to set your first limit.
            </Typography>
          </CardContent>
        </Card>
      )}

      {budgets.length > 0 && (
        <Card variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
          {budgets.map((bgt, i) => {
            const isDeleting = pending[bgt.id] === "delete";
            const isOver = Number(bgt.spent) > Number(bgt.monthly_limit);
            return (
              <Box key={bgt.id}>
                {i > 0 && <Divider />}
                <Box
                  onClick={() => {
                    if (isDeleting) return;
                    setSelected(bgt);
                  }}
                  sx={{
                    display: "flex",
                    alignItems: "center",
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
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        gap: 2,
                        mb: 1.25,
                      }}
                    >
                      <Typography sx={{ fontWeight: 600 }} noWrap>
                        {bgt.category}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        {formatMoney(bgt.spent) +
                          " of " +
                          formatMoney(bgt.monthly_limit)}
                      </Typography>
                    </Box>

                    <LinearProgress
                      variant="determinate"
                      value={Math.min(usedPercent(bgt), 100)}
                      color={budgetColor(usedPercent(bgt))}
                      sx={{ height: 8, borderRadius: 999 }}
                    />

                    <Typography
                      variant="caption"
                      color={isOver ? "error" : "text.secondary"}
                      sx={{ display: "block", mt: 0.75 }}
                    >
                      {isOver
                        ? "Over budget by " +
                          formatMoney(
                            Number(bgt.spent) - Number(bgt.monthly_limit),
                          )
                        : usedPercent(bgt) + "% used"}
                    </Typography>
                  </Box>

                  <Stack direction="row" sx={{ gap: 0.5, flexShrink: 0 }}>
                    <Tooltip title="Edit">
                      <span>
                        <IconButton
                          size="small"
                          aria-label="Edit budget"
                          disabled={isDeleting}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(bgt);
                          }}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title={isDeleting ? "Deleting..." : "Delete"}>
                      <span>
                        <IconButton
                          size="small"
                          color="error"
                          aria-label="Delete budget"
                          disabled={isDeleting}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(bgt.id);
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
            );
          })}
        </Card>
      )}

      {/* Add / edit dialog. A dialog takes no space on the page, so it can sit here. */}
      <Dialog open={formOpen} onClose={resetForm} fullWidth maxWidth="sm">
        <DialogTitle>
          {editingId ? "Edit budget: " + editingName : "Add budget"}
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{ display: "flex", flexDirection: "column", gap: 2.5, mt: 1 }}
          >
            {/* The category can't change while editing, so the field is hidden */}
            {!editingId && (
              <TextField
                select
                label="Category"
                value={formCategoryId}
                onChange={(e) => setFormCategoryId(e.target.value)}
                helperText={
                  freeCategories.length === 0
                    ? "You already have a budget for every category"
                    : ""
                }
              >
                {freeCategories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
            <TextField
              label="Monthly limit"
              type="number"
              value={monthlyLimit}
              onChange={(e) => setMonthlyLimit(e.target.value)}
            />

            {formErr && <Alert severity="error">{formErr}</Alert>}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
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
                ? "Edit"
                : "Add budget"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Details dialog, only rendered while a budget is selected */}
      {selected && (
        <BudgetDetailsDialog
          budget={selected}
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

export default Budget;
