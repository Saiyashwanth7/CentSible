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
import { updateProfile, deleteAccount, changePassword } from "../../api/user";
import { forgotPassword } from "../../api/auth";
import { exportCSV } from "../../api/expenses";
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

function ChangePasswordDialog({ onClose, onChanged }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all three fields");
      return;
    }
    if (newPassword.length < 8) {
      // use the same rule as your register schema
      setError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    if (newPassword === currentPassword) {
      setError("New password must be different from the current one");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await changePassword(currentPassword, newPassword, confirmPassword);
      onChanged();
    } catch (err) {
      console.error("password change failed:", err);
      setError(
        err.status === 400
          ? err.message
          : "Could not change your password, please try again",
      );
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Change password</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            autoFocus
            fullWidth
            type="password"
            label="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <TextField
            fullWidth
            type="password"
            label="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <TextField
            fullWidth
            type="password"
            label="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Change password"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function SetPasswordDialog({ email, onClose }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSend() {
    setSending(true);
    setError("");
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      console.error("set password email failed:", err);
      setError("Could not send the email, please try again");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Set a password</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {sent
            ? "Check your inbox. We sent a link to " +
              email +
              ". Open it to choose your password."
            : "You sign in with Google, so this account has no password yet. We will email a link to " +
              email +
              " where you can set one. After that you can log in with either method."}
        </DialogContentText>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{sent ? "Done" : "Cancel"}</Button>
        {!sent && (
          <Button variant="contained" onClick={handleSend} disabled={sending}>
            {sending ? "Sending..." : "Email me the link"}
          </Button>
        )}
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
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [setPwOpen, setSetPwOpen] = useState(false);
  const [exportErr, setExportErr] = useState("");

  async function handleExport() {
    setExportErr("");
    try {
      await exportCSV();
    } catch (error) {
      setExportErr("Could not export the expenses, please try again later");
    }
  }

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
            {exportErr && <Alert severity="error">{exportErr}</Alert>}
            <SettingRow
              label="Name"
              value={name}
              action="Edit"
              onClick={() => setEditOpen(true)}
            />
            <Divider />
            <SettingRow label="Email" value={user?.email} />
            <Divider />
            <SettingRow
              label="Password"
              value={
                user?.has_password
                  ? "••••••••"
                  : "Not set. You sign in with Google."
              }
              action={user?.has_password ? "Change" : "Set password"}
              onClick={() =>
                user?.has_password ? setPasswordOpen(true) : setSetPwOpen(true)
              }
            />
            <Divider />
            <SettingRow
              label="Your data"
              value="Download all expenses as CSV"
              action="Export"
              onClick={handleExport}
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
      {passwordOpen && (
        <ChangePasswordDialog
          onClose={() => setPasswordOpen(false)}
          onChanged={() => {
            setUser(null);
            navigate("/login");
          }}
        />
      )}
      {setPwOpen && (
        <SetPasswordDialog
          email={user?.email}
          onClose={() => setSetPwOpen(false)}
        />
      )}
    </Box>
  );
}

export default Account;
