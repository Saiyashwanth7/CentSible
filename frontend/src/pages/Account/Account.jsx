import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";
import { updateProfile, deleteAccount } from "../../api/user";
import Mascot from "../../components/Mascot/Mascot";

function SettingRow({ label, value, action, danger, onClick }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        px: 3,
        py: 2,
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography sx={{ overflowWrap: "anywhere" }}>{value}</Typography>
      </Box>
      {action && (
        <Button
          variant="outlined"
          color={danger ? "error" : "primary"}
          onClick={onClick}
        >
          {action}
        </Button>
      )}
    </Box>
  );
}

function EditNameDialog({ onClose, user, setUser }) {
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!name.trim()) {
      setError("Name can't be empty");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const updated = await updateProfile(name.trim());
      setUser(updated);
      onClose();
    } catch (err) {
      console.error("update failed:", err);
      setError("Could not update your name, please try again");
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Edit name</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            autoFocus
            fullWidth
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DeleteAccountDialog({ onClose, onDeleted }) {
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setDeleting(true);
    setError("");
    try {
      await deleteAccount();
      onDeleted();
    } catch (err) {
      console.error("delete failed:", err);
      setError("Could not delete your account, please try again");
      setDeleting(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Delete your account?</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          This permanently deletes your account, expenses, budgets and recurring
          expenses. It can't be undone. Type DELETE to confirm.
        </DialogContentText>
        <TextField
          autoFocus
          fullWidth
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
        />
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          color="error"
          variant="contained"
          disabled={typed !== "DELETE" || deleting}
          onClick={handleDelete}
        >
          {deleting ? "Deleting..." : "Delete forever"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function Account() {
  const { user, setUser } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const name = user?.name || "friend";

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", mt: 5, px: 2 }}>
      <Typography variant="h3" sx={{ mb: 3 }}>
        Account
      </Typography>

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", md: "280px 1fr" },
          alignItems: "start",
        }}
      >
        {/* Left: who you are */}
        <Card sx={{ p: 3, textAlign: "center" }}>
          <Avatar
            sx={{
              width: 112,
              height: 112,
              mx: "auto",
              mb: 2,
              fontSize: 48,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              boxShadow: "0 0 0 8px rgba(30,215,96,0.15)",
            }}
          >
            {name.charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="h4">{name}</Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ overflowWrap: "anywhere" }}
          >
            {user?.email}
          </Typography>

          <Divider sx={{ my: 3 }} />

          <Mascot
            mood="happy"
            size={72}
            message="Your money is in safe paws."
          />
        </Card>

        {/* Right: settings as rows */}
        <Stack sx={{ gap: 3 }}>
          <Card>
            <SettingRow
              label="Name"
              value={name}
              action="Edit"
              onClick={() => setEditOpen(true)}
            />
            <Divider />
            <SettingRow label="Email" value={user?.email} />
            <Divider />
            <SettingRow label="Password" value="••••••••" action="Change" />
            <Divider />
            <SettingRow
              label="Your data"
              value="Download all expenses as CSV"
              action="Export"
            />
          </Card>

          <Card>
            <SettingRow
              label="Delete account"
              value="Permanently removes your account and expenses"
              action="Delete"
              danger
              onClick={() => setDeleteOpen(true)}
            />
          </Card>
        </Stack>
      </Box>

      {/* Only rendered while open, so it starts with fresh state every time */}
      {editOpen && (
        <EditNameDialog
          onClose={() => setEditOpen(false)}
          user={user}
          setUser={setUser}
        />
      )}
      {deleteOpen && (
        <DeleteAccountDialog
          onClose={() => setDeleteOpen(false)}
          onDeleted={() => {
            setUser(null);
            navigate("/");
          }}
        />
      )}
    </Box>
  );
}

export default Account;
