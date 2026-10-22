import { useState } from "react";
import { login } from "../../api/auth";
import { data, useNavigate, Link } from "react-router-dom";
import { Box, Button, TextField, Typography } from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const { setUser } = useAuth();

  async function handleSubmit() {
    try {
      const data = await login(email, password);
      setUser(data);
      navigate("/");
    } catch (err) {
      console.log(err);
      setError("Email or Password is incorrect");
    }
  }

  function handleGoogleLogin() {
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
      <Typography variant="h4">Login</Typography>

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

      {error && <Typography color="error">{error}</Typography>}

      <Button variant="contained" onClick={handleSubmit}>
        Login
      </Button>
      <Button variant="outlined" onClick={handleGoogleLogin}>
        Login with Google
      </Button>
      <Button component={Link} to="/forgot-password">
        Forgot password?
      </Button>
    </Box>
  );
}

export default Login;
