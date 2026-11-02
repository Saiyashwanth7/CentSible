import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { confirmPasswordReset, validateResetToken } from "../../api/auth";
import {
  Alert,
  Box,
  Button,
  Card,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Mascot from "../../components/Mascot/Mascot";

// Same centered card for every state of this page
function Shell({ mood, message, children }) {
  return (
    <Box
      sx={{
        minHeight: "75vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 420, p: { xs: 3, sm: 4 } }}>
        <Stack sx={{ gap: 2 }}>
          <Mascot mood={mood} size={56} message={message} />
          {children}
        </Stack>
      </Card>
    </Box>
  );
}

function ResetPassword() {
  const location = useLocation();
  const token = new URLSearchParams(location.hash.slice(1)).get("token");
  const [status, setStatus] = useState("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    validateResetToken(token)
      .then((data) => setStatus(data.valid ? "valid" : "invalid"))
      .catch(() => setStatus("invalid"));
  }, [token]);

  async function handleSubmit() {
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      await confirmPasswordReset(token, password, confirmPassword);
      setDone(true);
    } catch (error) {
      setError("Password reset failed, please try again later");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "checking") {
    return (
      <Shell mood="sleepy" message="Checking your link...">
        <Typography color="text.secondary">One moment.</Typography>
      </Shell>
    );
  }

  if (status === "invalid") {
    return (
      <Shell mood="worried" message="Hmm, this link doesn't work.">
        <Box>
          <Typography variant="h3">Link expired</Typography>
          <Typography color="text.secondary">
            This password reset link is invalid or has expired.
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="large"
          component={Link}
          to="/forgot-password"
        >
          Request a new link
        </Button>
      </Shell>
    );
  }

  if (done) {
    return (
      <Shell mood="happy" message="All set!">
        <Box>
          <Typography variant="h3">Password saved</Typography>
          <Typography color="text.secondary">
            Your password has been set. You can log in now.
          </Typography>
        </Box>
        <Button variant="contained" size="large" component={Link} to="/login">
          Go to login
        </Button>
      </Shell>
    );
  }

  return (
    <Shell mood="worried" message="Pick something you will remember.">
      <Stack
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        sx={{ gap: 2 }}
      >
        <Typography variant="h3">Choose a password</Typography>

        <TextField
          label="New password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <TextField
          label="Confirm password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {error && <Alert severity="error">{error}</Alert>}

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={submitting}
        >
          {submitting ? "Saving..." : "Save password"}
        </Button>
      </Stack>
    </Shell>
  );
}

export default ResetPassword;
