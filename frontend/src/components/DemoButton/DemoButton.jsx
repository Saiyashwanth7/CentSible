import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Button } from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";
import { guestLogin } from "../../api/auth";

function DemoButton({
  size = "large",
  variant = "outlined",
  fullWidth = false,
}) {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleClick() {
    setError("");
    setSubmitting(true);
    try {
      const data = await guestLogin();
      setUser(data);
      navigate("/dashboard");
    } catch (err) {
      if (err.status === 429) {
        setError("Too many demo accounts right now, please try again later");
      } else {
        setError("Could not start the demo, please try again later");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box>
      <Button
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        disabled={submitting}
        onClick={handleClick}
      >
        {submitting ? "Starting your demo..." : "Try the demo"}
      </Button>
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}

export default DemoButton;
