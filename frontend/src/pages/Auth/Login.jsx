import { useState } from "react";
import { login } from "../../api/auth";
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
import { useAuth } from "../../contexts/AuthContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const { setUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [googleStarted, setGoogleStarted] = useState(false);

  async function handleSubmit() {
    setError("");
    setSubmitting(true);
    try {
      const data = await login(email, password);
      setUser(data);
      navigate("/dashboard");
    } catch (err) {
      if (err.status === 429) {
        setError("Too many login attempts, please try again later");
      } else if (err.status === 401) {
        setError("Incorrect username or password.");
      } else {
        setError("Something went wrong, please try again later");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleGoogleLogin() {
    if (googleStarted) return;
    setGoogleStarted(true);
    window.location.href = import.meta.env.VITE_API_URL + "/auth/google/";
  }

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
        {/* form + type="submit" lets the Enter key log you in */}
        <Stack
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          sx={{ gap: 2 }}
        >
          <Box sx={{ mb: 1 }}>
            <Typography variant="h3">Welcome back</Typography>
            <Typography color="text.secondary">
              Log in to see where your money went.
            </Typography>
          </Box>

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

          {error && <Alert severity="error">{error}</Alert>}

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={submitting}
          >
            {submitting ? "Logging in..." : "Log in"}
          </Button>

          <Divider>or</Divider>

          <Button
            variant="outlined"
            size="large"
            onClick={handleGoogleLogin}
            disabled={googleStarted}
          >
            Continue with Google
          </Button>

          <Stack direction="row" sx={{ justifyContent: "space-between" }}>
            <Button size="small" component={Link} to="/forgot-password">
              Forgot password?
            </Button>
            <Button size="small" component={Link} to="/register">
              Create account
            </Button>
          </Stack>
        </Stack>
      </Card>
    </Box>
  );
}

export default Login;
