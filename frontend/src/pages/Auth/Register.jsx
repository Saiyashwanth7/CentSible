import { register } from "../../api/user";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleStarted, setGoogleStarted] = useState(false);

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
    if (googleStarted) return;
    setGoogleStarted(true);
    window.location.href = import.meta.env.VITE_API_URL + "/auth/google";
  }

  return (
    <Box
      sx={{
        minHeight: "75vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 4,
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 420, p: { xs: 3, sm: 4 } }}>
        <Stack
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          sx={{ gap: 2 }}
        >
          <Box sx={{ mb: 1 }}>
            <Typography variant="h3">Create account</Typography>
            <Typography color="text.secondary">
              It takes a minute, and it's free.
            </Typography>
          </Box>

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

          {error && <Alert severity="error">{error}</Alert>}

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={submitting}
          >
            {submitting ? "Creating account..." : "Create account"}
          </Button>

          <Divider>or</Divider>

          <Button
            variant="outlined"
            size="large"
            onClick={handleGoogleRegister}
            disabled={googleStarted}
          >
            Continue with Google
          </Button>

          <Button size="small" component={Link} to="/login">
            Already have an account? Log in
          </Button>
        </Stack>
      </Card>
    </Box>
  );
}

export default Register;
