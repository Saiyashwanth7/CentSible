// Navbar for the frontend
import { Link, useNavigate } from "react-router-dom";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";
import { logout } from "../../api/auth";
import { useState } from "react";

function Navbar() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [err, setErr] = useState("");
  async function handleLogout() {
    // Step 2: meere rayandi
    try {
      await logout();
      setUser(null);
      navigate("/login");
      console.log("logout sucecc");
    } catch (err) {
      setErr("An error occured while logging out");
      console.log(err);
    }
  }

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{ flexGrow: 1, color: "inherit", textDecoration: "none" }}
        >
          CentSible
        </Typography>

        {user ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography>Hi, {user.name}</Typography>
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
            {err && <Typography color="error">{err}</Typography>}
            <Button color="inherit" component={Link} to="/expenses">
              Expenses
            </Button>
            <Button color="inherit" component={Link} to="/dashboard">
              Dashboard
            </Button>
            <Button color="inherit" component={Link} to="/recurring">
              Recurring
            </Button>
          </Box>
        ) : (
          <Box>
            <Button color="inherit" component={Link} to="/login">
              Login
            </Button>
            <Button color="inherit" component={Link} to="/register">
              Register
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
