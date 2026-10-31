import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  Divider,
} from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";
import { exportCSV } from "../../api/expenses";
import { updateProfile, changePassword, deleteAccount } from "../../api/user";
import Mascot from "../../components/Mascot/Mascot";

// Small wrapper so every tab has the same title + card look
function Section({ title, text, children }) {
  return (
    <Card>
      <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box>
          <Typography variant="h5">{title}</Typography>
          {text && (
            <Typography variant="body2" color="text.secondary">
              {text}
            </Typography>
          )}
        </Box>
        {children}
      </CardContent>
    </Card>
  );
}

// status = { type: "success" | "error", text: "..." } or null
function Status({ status }) {
  if (!status) return null;
  return <Alert severity={status.type}>{status.text}</Alert>;
}

function ProfileTab({ user, setUser }) {
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  async function handleSave() {
    if (!name.trim()) {
      setStatus({ type: "error", text: "Name can't be empty" });
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      const updated = await updateProfile(name.trim());
      setUser(updated);
      setStatus({ type: "success", text: "Profile updated" });
    } catch {
      setStatus({ type: "error", text: "Could not update profile" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section title="Profile" text="This is how you appear in CentSible.">
      <TextField
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <TextField
        label="Email"
        value={user?.email || ""}
        disabled
        helperText="Email can't be changed"
      />
      <Status status={status} />
      <Box>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </Box>
    </Section>
  );
}

function SecurityTab() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  async function handleSubmit() {
    if (next.length < 8) {
      setStatus({
        type: "error",
        text: "New password must be at least 8 characters",
      });
      return;
    }
    if (next !== confirm) {
      setStatus({ type: "error", text: "Passwords do not match" });
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      await changePassword(current, next);
      setCurrent("");
      setNext("");
      setConfirm("");
      setStatus({ type: "success", text: "Password changed" });
    } catch (err) {
      setStatus({
        type: "error",
        text:
          err.status === 401
            ? "Current password is incorrect"
            : "Could not change password",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section title="Password" text="Use at least 8 characters.">
      <TextField
        label="Current password"
        type="password"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
      />
      <TextField
        label="New password"
        type="password"
        value={next}
        onChange={(e) => setNext(e.target.value)}
      />
      <TextField
        label="Confirm new password"
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />
      <Status status={status} />
      <Box>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          {saving ? "Updating..." : "Update password"}
        </Button>
      </Box>
    </Section>
  );
}

function DataTab() {
  const [status, setStatus] = useState(null);

  async function handleExport() {
    try {
      await exportCSV(""); // empty string = all categories
      setStatus({ type: "success", text: "Export started" });
    } catch {
      setStatus({
        type: "error",
        text: "Could not export, please try again later",
      });
    }
  }

  return (
    <Section title="Your data" text="Download all your expenses as a CSV file.">
      <Status status={status} />
      <Box>
        <Button variant="outlined" onClick={handleExport}>
          Export all expenses
        </Button>
      </Box>
    </Section>
  );
}

function DangerTab({ onDeleted }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [status, setStatus] = useState(null);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteAccount();
      onDeleted();
    } catch {
      setStatus({ type: "error", text: "Could not delete account" });
      setOpen(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Section
      title="Delete account"
      text="This permanently removes your account and all your expenses. It can't be undone."
    >
      <Status status={status} />
      <Box>
        <Button variant="outlined" color="error" onClick={() => setOpen(true)}>
          Delete my account
        </Button>
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Delete your account?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Type DELETE to confirm.
          </DialogContentText>
          <TextField
            fullWidth
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
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
    </Section>
  );
}

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

function Account() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("profile");

  const name = user?.name || "friend";

  async function handleLogout() {
    await logout();
    navigate("/");
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
            <SettingRow label="Name" value={name} action="Edit" />
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
            />
          </Card>
        </Stack>
      </Box>
    </Box>
  );
}

export default Account;
