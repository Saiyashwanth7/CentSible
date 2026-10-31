// Register
import { register } from "../../api/user";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, TextField, Typography } from "@mui/material";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError("");
    setSubmitting(true);
    try {
      await register(name, email, password, confirmPassword);
      navigate("/login");
    } catch (err) {
      if (err.status === 422 || err.status === 409) {
        setError(err.message);
      } else {
        setError("Something went wrong, please try again later");
      }
    } finally {
      setSubmitting(false);
    }
  }
  function handleGoogleRegister() {
    window.location.href = import.meta.env.VITE_API_URL + "/auth/google/";
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
      <Typography variant="h4">Register</Typography>
      <TextField
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <TextField
        label="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <TextField
        label="Password"
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

      <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
        {submitting ? "Registering..." : "Register"}
      </Button>
      <Button variant="outlined" onClick={handleGoogleRegister}>
        Register with Google
      </Button>
    </Box>
  );
}

export default Register;
