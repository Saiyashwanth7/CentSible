import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Alert,
  AppBar,
  Box,
  Button,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Snackbar,
  Toolbar,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useAuth } from "../../contexts/AuthContext";
import { logout } from "../../api/auth";

const links = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Expenses", to: "/expenses" },
  { label: "Budgets", to: "/budget" },
  { label: "Recurring", to: "/recurring" },
  { label: "Account", to: "/account" },
];

// NavLink adds the class "active" to the link of the page you are on
const linkSx = {
  color: "text.secondary",
  px: 2,
  "&:hover": { color: "text.primary", bgcolor: "action.hover" },
  "&.active": { color: "text.primary", bgcolor: "action.selected" },
};

function Navbar() {
  const { loading, user, setUser } = useAuth();
  const navigate = useNavigate();
  const [err, setErr] = useState("");
  const [menuAnchor, setMenuAnchor] = useState(null); // phone menu

  async function handleLogout() {
    setMenuAnchor(null);
    try {
      await logout();
      setUser(null);
      navigate("/login");
    } catch (error) {
      setErr("An error occurred while logging out");
    }
  }

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: (theme) => alpha(theme.palette.background.default, 0.78),
          backdropFilter: "blur(16px)",
          backgroundImage: "none",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Toolbar sx={{ maxWidth: 1200, width: "100%", mx: "auto" }}>
          <Typography
            variant="h5"
            component={Link}
            to="/"
            sx={{
              flexGrow: 1,
              color: "text.primary",
              textDecoration: "none",
            }}
          >
            Cent
            <Box component="span" sx={{ color: "primary.main" }}>
              Sible
            </Box>
          </Typography>

          {!loading &&
            (user ? (
              <>
                {/* Wide screens: all links in the bar */}
                <Box
                  sx={{
                    display: { xs: "none", md: "flex" },
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  {links.map((l) => (
                    <Button
                      key={l.to}
                      component={NavLink}
                      to={l.to}
                      sx={linkSx}
                    >
                      {l.label}
                    </Button>
                  ))}
                  <Button
                    variant="outlined"
                    onClick={handleLogout}
                    sx={{ ml: 1 }}
                  >
                    Logout
                  </Button>
                </Box>

                {/* Phones: one menu button */}
                <IconButton
                  aria-label="Open menu"
                  onClick={(e) => setMenuAnchor(e.currentTarget)}
                  sx={{ display: { xs: "inline-flex", md: "none" } }}
                >
                  ☰
                </IconButton>
                <Menu
                  anchorEl={menuAnchor}
                  open={Boolean(menuAnchor)}
                  onClose={() => setMenuAnchor(null)}
                >
                  {links.map((l) => (
                    <MenuItem
                      key={l.to}
                      component={NavLink}
                      to={l.to}
                      onClick={() => setMenuAnchor(null)}
                      sx={{ "&.active": { bgcolor: "action.selected" } }}
                    >
                      {l.label}
                    </MenuItem>
                  ))}
                  <Divider />
                  <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </Menu>
              </>
            ) : (
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button color="inherit" component={Link} to="/login">
                  Log in
                </Button>
                <Button variant="contained" component={Link} to="/register">
                  Sign up
                </Button>
              </Box>
            ))}
        </Toolbar>
      </AppBar>

      {/* Logout errors pop up here instead of squeezing into the bar */}
      <Snackbar
        open={Boolean(err)}
        autoHideDuration={4000}
        onClose={() => setErr("")}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="error" onClose={() => setErr("")}>
          {err}
        </Alert>
      </Snackbar>
    </>
  );
}

export default Navbar;
