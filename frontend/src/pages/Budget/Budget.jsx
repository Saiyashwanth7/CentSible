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
  LinearProgress,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
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
      <Typography variant="body2" color="text.secondary">
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
      <DialogTitle>{budget.category}</DialogTitle>
      <DialogContent>
        <Typography variant="h3" sx={{ mb: 0.5 }}>
          {formatMoney(spent)}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
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
      <DialogActions>
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
  const [delErr, setDelErr] = useState("");
  const [selected, setSelected] = useState(null); // budget shown in the details dialog

  // form (dialog) state
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formCategoryId, setFormCategoryId] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [formErr, setFormErr] = useState("");

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
      .then((data) => setCategories(data))
      .catch(() => setErr("Couldn't load categories, please try again later"));
  }, []);

  function resetForm() {
    setFormOpen(false);
    setEditingId(null);
    setFormErr("");
    setMonthlyLimit("");
    setFormCategoryId("");
  }

  function handleEdit(bgt) {
    setFormOpen(true);
    setEditingId(bgt.id);
    setFormCategoryId(bgt.category_id);
    setMonthlyLimit(bgt.monthly_limit);
  }

  async function handleSubmit() {
    if (!formCategoryId || !monthlyLimit) {
      setFormErr("Choose a category and enter a limit");
      return;
    }
    try {
      await upsertBudget(formCategoryId, Number(monthlyLimit));
      const result = await getBudgets();
      setBudgets(result);
      resetForm();
    } catch (error) {
      setFormErr("Couldn't save your budget, please try again later");
    }
  }

  async function handleDelete(bgtId) {
    try {
      await deleteBudget(bgtId);
      const result = await getBudgets();
      setBudgets(result);
      setDelErr("");
    } catch (error) {
      setDelErr("Couldn't delete the budget, please try again later");
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

  return (
    <Box sx={{ maxWidth: 760, mx: "auto", mt: 4, px: 2, pb: 6 }}>
      <Typography variant="h3" sx={{ mb: 1 }}>
        Budgets
      </Typography>
      <Box sx={{ mb: 3 }}>
        <Mascot mood={cat.mood} size={56} message={cat.message} />
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Typography variant="h5">Your Budgets</Typography>
        <Button variant="contained" onClick={() => setFormOpen(true)}>
          Add budget
        </Button>
      </Box>

      {err && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {err}
        </Alert>
      )}
      {delErr && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {delErr}
        </Alert>
      )}

      {!err && budgets.length === 0 && (
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Tap "Add budget" to set your first limit.
            </Typography>
          </CardContent>
        </Card>
      )}

      {budgets.length > 0 && (
        <Card>
          {budgets.map((bgt, i) => (
            <Box key={bgt.id}>
              {i > 0 && <Divider />}
              <Box
                onClick={() => setSelected(bgt)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  px: 3,
                  py: 2,
                  cursor: "pointer",
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 2,
                      mb: 1,
                    }}
                  >
                    <Typography sx={{ fontWeight: 600 }} noWrap>
                      {bgt.category}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatMoney(bgt.spent) +
                        " of " +
                        formatMoney(bgt.monthly_limit)}
                    </Typography>
                  </Box>

                  <LinearProgress
                    variant="determinate"
                    value={Math.min(usedPercent(bgt), 100)}
                    color={budgetColor(usedPercent(bgt))}
                    sx={{ height: 10, borderRadius: 999 }}
                  />

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 0.5 }}
                  >
                    {Number(bgt.spent) > Number(bgt.monthly_limit)
                      ? "Over budget by " +
                        formatMoney(
                          Number(bgt.spent) - Number(bgt.monthly_limit),
                        )
                      : usedPercent(bgt) + "% used"}
                  </Typography>
                </Box>

                <Button
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(bgt);
                  }}
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(bgt.id);
                  }}
                >
                  Delete
                </Button>
              </Box>
            </Box>
          ))}
        </Card>
      )}

      {/* Add / edit dialog. A dialog takes no space on the page, so it can sit here. */}
      <Dialog open={formOpen} onClose={resetForm} fullWidth maxWidth="sm">
        <DialogTitle>
          {editingId ? "Edit budget: " + editingName : "Add budget"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
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
        <DialogActions>
          <Button onClick={resetForm}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editingId ? "Update" : "Add budget"}
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
