import { Link, useNavigate } from "react-router-dom";
import { Box, Button, Stack, Typography } from "@mui/material";
import Mascot from "../../components/Mascot/Mascot";

function NotFound() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        px: 2,
        py: 6,
      }}
    >
      <Typography
        variant="h1"
        sx={{
          fontSize: { xs: 96, sm: 140 },
          lineHeight: 1,
          color: "primary.main",
        }}
      >
        404
      </Typography>

      <Typography variant="h4" sx={{ mt: 1 }}>
        This page ran off
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1, mb: 4, maxWidth: 420 }}>
        The page you are looking for doesn't exist, or it was moved. The cat is
        still looking for it.
      </Typography>

      {/* The cat and its bubble */}
      <Box sx={{ mb: 2 }}>
        <Mascot mood="playing" size={88} message="Not me! It was the yarn." />
      </Box>

      {/* A yarn ball that rolls back and forth along a short track */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: 320,
          height: 44,
          mb: 4,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Box
          aria-hidden="true"
          sx={{
            position: "absolute",
            bottom: 2,
            left: 0,
            fontSize: 34,
            lineHeight: 1,
            animation: "roll 3s ease-in-out infinite alternate",
            "@keyframes roll": {
              from: { left: 0, transform: "rotate(0deg)" },
              to: { left: "calc(100% - 34px)", transform: "rotate(720deg)" },
            },
            // people who turned animations off in their system see it still
            "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          }}
        >
          🧶
        </Box>
      </Box>

      <Stack
        direction="row"
        sx={{ gap: 2, flexWrap: "wrap", justifyContent: "center" }}
      >
        <Button variant="contained" size="large" component={Link} to="/">
          Take me home
        </Button>
        <Button variant="outlined" size="large" onClick={() => navigate(-1)}>
          Go back
        </Button>
      </Stack>
    </Box>
  );
}

export default NotFound;
