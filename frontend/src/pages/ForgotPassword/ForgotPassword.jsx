import { useState } from "react";
import { forgotPassword } from "../../api/auth";
import { Link } from "react-router-dom";
import { Box, Typography, TextField, Button } from "@mui/material";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit() {
    try {
      const result = await forgotPassword(email);
      setMessage(result.message);
      setEmail("");
    } catch (error) {
      setError("Something went wrong while generating a password reset email");
      setMessage("");
    }
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
      <Typography variant="h4">Forgot password</Typography>
      <Typography>
        Enter your email and we will send you a reset link.
      </Typography>

      <TextField
        label="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      {message && <Typography color="success.main">{message}</Typography>}
      {error && <Typography color="error">{error}</Typography>}

      <Button variant="contained" onClick={handleSubmit}>
        Send reset link
      </Button>
      <Button component={Link} to="/login">
        Back to login
      </Button>
    </Box>
  );
}

export default ForgotPassword;
