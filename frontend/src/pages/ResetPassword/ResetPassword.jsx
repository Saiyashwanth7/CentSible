import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { confirmPasswordReset, validateResetToken } from "../../api/auth";
import { Box, Typography, TextField, MenuItem, Button } from "@mui/material";

function ResetPassword() {
  const location = useLocation();
  const token = new URLSearchParams(location.hash.slice(1)).get("token");
  //console.log("token:", token);
  const [status, setStatus] = useState("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

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
    try {
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      const data = await confirmPasswordReset(token, password, confirmPassword);
      setDone(true);
    } catch (error) {
      setError("Password reset failed, please try again later");
    }
  }

  if (status === "checking") {
    return (
      <Typography sx={{ mt: 8, textAlign: "center" }}>
        Checking link...
      </Typography>
    );
  }

  if (status === "invalid") {
    return (
      <Box
        sx={{
          maxWidth: 400,
          mx: "auto",
          mt: 8,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Typography variant="h5">Link expired</Typography>
        <Typography>
          This password reset link is invalid or has expired.
        </Typography>
        <Button variant="contained" component={Link} to="/forgot-password">
          Request a new link
        </Button>
      </Box>
    );
  }

  if (done) {
    return (
      <Box
        sx={{
          maxWidth: 400,
          mx: "auto",
          mt: 8,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Typography variant="h5">Password reset</Typography>
        <Typography>
          Your password has been reset. You can log in now.
        </Typography>
        <Button variant="contained" component={Link} to="/login">
          Go to login
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        maxWidth: 400,
        mx: "auto",
        mt: 8,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <Typography variant="h4">Reset password</Typography>

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

      {error && <Typography color="error">{error}</Typography>}

      <Button variant="contained" onClick={handleSubmit}>
        Reset password
      </Button>
    </Box>
  );
}

export default ResetPassword;
