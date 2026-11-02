import { useState } from "react";
import { forgotPassword } from "../../api/auth";
import { Link } from "react-router-dom";
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

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [err, setError] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit() {
    setError("");
    setMessage("");
    setSending(true);
    try {
      const result = await forgotPassword(email);
      setMessage(result.message);
      setEmail("");
    } catch (error) {
      setError(error.message);
    } finally {
      setSending(false);
    }
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
        <Stack
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          sx={{ gap: 2 }}
        >
          <Mascot
            mood={message ? "happy" : "worried"}
            size={56}
            message={message ? "Check your inbox!" : "Locked out? It happens."}
          />

          <Box>
            <Typography variant="h3">Forgot password</Typography>
            <Typography color="text.secondary">
              Enter your email and we will send you a reset link.
            </Typography>
          </Box>

          <TextField
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {message && <Alert severity="success">{message}</Alert>}
          {err && <Alert severity="error">{err}</Alert>}

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={sending || !email.trim()}
          >
            {sending ? "Sending..." : "Send reset link"}
          </Button>
          <Button component={Link} to="/login">
            Back to login
          </Button>
        </Stack>
      </Card>
    </Box>
  );
}

export default ForgotPassword;
